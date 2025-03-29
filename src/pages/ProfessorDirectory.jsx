import { getFirestore, collection, query as firestoreQuery, getDocs, limit, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import { Mail, Search, X } from 'lucide-react';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getMajorDepartmentCode, 
  applySorting, 
  filterByMinReviews,
  hasProfessorsFromDepartment,
  getAllDepartmentOptions,
  getPopularDepartments
} from '../algorithms/professorMatching';
import { Typography, Box } from '@mui/material';

// Create a cache to store previously fetched data
const professorCache = {
  data: null,
  timestamp: null,
  expiryTime: 5 * 60 * 1000 // 5 minutes cache validity
};

const LoadingSpinner = ({ darkMode }) => (
  <div
    className={
      darkMode
        ? "min-h-screen flex flex-col items-center justify-center bg-[linear-gradient(90deg,_#1C093F_0%,_#0C0F33_100%)] gap-4"
        : "min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4"
    }
  >
    <div className="relative w-20 h-20">
      <div className="absolute top-0 left-0 right-0 bottom-0">
        <div className="w-full h-full border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
    <div 
      className={
        darkMode 
          ? "text-sm text-gray-300 animate-pulse" 
          : "text-sm text-gray-500 animate-pulse"
      }
    >
      Loading professors...
    </div>
  </div>
);

const LoadingOverlay = ({ darkMode }) => (
  <div className="flex justify-center items-center py-8">
    <div className="relative w-12 h-12">
      <div
        className={
          darkMode
            ? "w-full h-full border-4 border-indigo-200 rounded-full"
            : "w-full h-full border-4 border-indigo-100 rounded-full"
        }
      ></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
    </div>
  </div>
);

// Add a more subtle initial loading component
const InitialLoading = ({ darkMode }) => (
  <div
    className={
      darkMode
        ? "flex flex-col items-center justify-center py-12 gap-4"
        : "flex flex-col items-center justify-center py-12 gap-4"
    }
  >
    <div className="relative w-14 h-14">
      <div className="absolute top-0 left-0 right-0 bottom-0">
        <div className="w-full h-full border-4 border-indigo-100 rounded-full opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
    <div 
      className={
        darkMode 
          ? "text-sm text-gray-300 animate-pulse" 
          : "text-sm text-gray-500 animate-pulse"
      }
    >
      Loading professors...
    </div>
  </div>
);

const getScoreColor = (score, darkMode) => {
  // More subtle, classy color palette
  if (score >= 80) return darkMode ? 'text-green-200 bg-[#13422b]/40' : 'text-green-700 bg-green-50/80';
  if (score >= 60) return darkMode ? 'text-green-200 bg-[#13422b]/30' : 'text-green-600 bg-green-50/60';
  if (score >= 40) return darkMode ? 'text-amber-200 bg-[#553e11]/40' : 'text-amber-600 bg-amber-50/60';
  return darkMode ? 'text-rose-200 bg-[#4c1a23]/40' : 'text-rose-600 bg-rose-50/60';
};

const MetricBadge = ({ value, label, isDifficulty = false, onClick, courseLink, darkMode }) => {
  // For difficulty, invert the score for display (100 - difficulty)
  const displayValue = isDifficulty ? 100 - value : value;
  
  const handleClick = (e) => {
    if (courseLink) {
      e.stopPropagation(); // Prevent triggering parent click handlers
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onClick(courseLink);
    }
  };

  return (
    <div 
      className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center ${getScoreColor(displayValue, darkMode)} ${
        courseLink ? 'cursor-pointer hover:ring-1 hover:ring-indigo-300 transition-all' : ''
      }`}
      onClick={handleClick}
      title={courseLink ? "View course details" : undefined}
    >
      <div className="text-lg font-medium leading-tight">{displayValue.toFixed(1)}</div>
      <div className="text-xs font-medium opacity-75 tracking-tight">{label}</div>
    </div>
  );
};


const NoReviewsCard = ({ darkMode }) => (
  <div
    className={
      darkMode
        ? "flex items-center justify-center p-4 bg-[#1C1F43] rounded-lg"
        : "flex items-center justify-center p-4 bg-gray-50 rounded-lg"
    }
  >
    <p className={darkMode ? "text-gray-300 text-sm" : "text-gray-500 text-sm"}>
      No reviews available yet
    </p>
  </div>
);

const MIN_REVIEW_OPTIONS = [
  { label: 'All Reviews', value: 1 },
  { label: '5+ Reviews', value: 5 },
  { label: '10+ Reviews', value: 10 },
  { label: '20+ Reviews', value: 20 }
];

const SORT_OPTIONS = {
  REVIEW_COUNT: { label: 'Most Reviews', field: 'review_count' },
  QUALITY: { label: 'Best Quality', field: 'quality_score' },
  DIFFICULTY: { label: 'Easiest Classes', field: 'difficulty_score' },
  SENTIMENT: { label: 'Best Sentiment', field: 'sentiment_score' },
  RANDOM: { label: 'Random', field: null }
};

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '');
};

const generateSearchTokens = (text) => {
  const normalized = normalizeText(text);
  const tokens = normalized.split(/\s+/).filter(token => token.length > 0);
  return [...new Set(tokens)];
};

const calculateRelevanceScore = (professor, searchTerms) => {
  let score = 0;
  const normalizedName = normalizeText(professor.name);
  const normalizedDepartments = Object.keys(professor.departments || {}).map(normalizeText);
  
  for (const term of searchTerms) {
    if (normalizedName.includes(term)) {
      score += 10;
      if (normalizedName.startsWith(term)) {
        score += 5;
      }
    }
    
    for (const dept of normalizedDepartments) {
      if (dept.includes(term)) {
        score += 3;
      }
    }
    
    if (term.length >= 3) {
      const partialMatches = normalizedName.split(' ')
        .filter(word => word.startsWith(term) || word.endsWith(term))
        .length;
      score += partialMatches * 2;
    }
  }
  
  return score;
};

// Separate search function
// Replace the existing searchProfessors function with this implementation:
const searchProfessors = async (searchTerm, db) => {
  if (!searchTerm?.trim() || !db) {
    return { results: [], isPartialMatch: false };
  }

  try {
    const searchTokens = generateSearchTokens(searchTerm);
    const professorsRef = collection(db, "professor");
    const searchResults = new Map();
    
    // Create queries for each search token
    const queries = searchTokens.flatMap(token => [
      // Name search
      getDocs(
        firestoreQuery(
          professorsRef,
          where("name", ">=", token),
          where("name", "<=", token + "\uf8ff"),
          limit(50)
        )
      ),
      // Department search if department_tokens exists
      getDocs(
        firestoreQuery(
          professorsRef,
          where("department_tokens", "array-contains", token),
          limit(50)
        )
      )
    ]);

    // Execute all queries in parallel
    const querySnapshots = await Promise.all(queries);
    
    // Process results
    for (const snapshot of querySnapshots) {
      for (const doc of snapshot.docs) {
        if (!searchResults.has(doc.id)) {
          searchResults.set(doc.id, { id: doc.id, ...doc.data() });
        }
      }
    }

    // Process and sort results
    let results = Array.from(searchResults.values())
      .map(prof => ({
        ...prof,
        relevanceScore: calculateRelevanceScore(prof, searchTokens)
      }))
      .filter(prof => prof.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);

    const isPartialMatch = results.length > 0 && 
      results[0].relevanceScore < (searchTokens.length * 15);

    return { results, isPartialMatch };
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("Search failed. Please try again.");
  }
};

// Custom hook for search functionality
const useEnhancedSearch = (db, initialDelay = 300) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPartialMatch, setIsPartialMatch] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) {
      console.error('Firestore instance not available');
      setError('Database connection error');
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsPartialMatch(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const { results, isPartialMatch: partial } = await searchProfessors(searchQuery, db);
        setSearchResults(results);
        setIsPartialMatch(partial);
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed. Please try again.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, db, initialDelay]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    isPartialMatch,
    error
  };
};

// Then in your ProfessorDirectory component
const ProfessorDirectory = ({ darkMode }) => {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    isPartialMatch,
    error: searchError
  } = useEnhancedSearch(db);

  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.REVIEW_COUNT);
  const [minReviews, setMinReviews] = useState(10);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userMajor, setUserMajor] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showAllDepartments, setShowAllDepartments] = useState(false);
  const departmentOptions = useMemo(() => getAllDepartmentOptions(), []);
  const popularDepartments = useMemo(() => getPopularDepartments(), []);
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);

  // Check cache on component mount
  useEffect(() => {
    // Check if we have valid cached data
    const now = Date.now();
    if (professorCache.data && 
        professorCache.timestamp && 
        (now - professorCache.timestamp < professorCache.expiryTime)) {
      console.log('Using cached professor data');
      setProfessors(professorCache.data);
      setLoading(false);
      setInitialLoad(false);
    } else {
      // Set a very short timeout for initial loading animation
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setInitialLoad(false);
        }
      }, 300); // Reduced from 800ms to 300ms
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get user major
  useEffect(() => {
    const fetchUserMajor = async () => {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.major) {
            setUserMajor(userData.major);
            console.log(`User major found: ${userData.major}`);
          }
        }
      } catch (err) {
        console.error('Error fetching user major:', err);
      }
    };
    
    fetchUserMajor();
  }, [currentUser]);

  const fetchInitialProfessors = useCallback(async (selectedSort = sortBy, reviewThreshold = minReviews) => {
    try {
      // Don't show loading if we already have data
      if (!professors.length) {
        setLoading(true);
      }
      
      const professorsRef = collection(db, 'professor');
      let professorsData = [];
      
      // If a department is explicitly selected, prioritize that
      if (selectedDepartment && !searchQuery) {
        console.log(`Fetching professors for selected department: ${selectedDepartment}`);
        
        try {
          const deptQuery = firestoreQuery(
            professorsRef,
            where(`departments.${selectedDepartment}`, '!=', null),
            limit(50)
          );
          
          const deptSnapshot = await getDocs(deptQuery);
          
          if (!deptSnapshot.empty) {
            console.log(`Found ${deptSnapshot.size} professors in ${selectedDepartment}`);
            professorsData = deptSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Apply filters
            professorsData = filterByMinReviews(professorsData, reviewThreshold);
            
            if (professorsData.length >= 3) {
              professorsData = applySorting(professorsData, selectedSort);
              professorsData = professorsData.slice(0, 12);
              
              if (isMounted.current) {
                setProfessors(professorsData);
                
                // Update cache
                professorCache.data = professorsData;
                professorCache.timestamp = Date.now();
                
                setLoading(false);
                setInitialLoad(false);
              }
              return;
            }
            console.log(`Not enough professors for ${selectedDepartment} after filtering`);
          } else {
            console.log(`No professors found for department: ${selectedDepartment}`);
          }
        } catch (deptError) {
          console.error(`Error with department query for ${selectedDepartment}:`, deptError);
        }
      }
      
      // If user has a major and no search is active, and no department is selected,
      // try to get professors from their department
      if (userMajor && !searchQuery && !selectedDepartment) {
        const deptCode = getMajorDepartmentCode(userMajor);
        console.log(`Attempting to find professors from department: ${deptCode}`);
        
        try {
          // Query for professors from the user's department
          const deptQuery = firestoreQuery(
            professorsRef,
            where(`departments.${deptCode}`, '!=', null),
            limit(50) // Get more results to allow for sorting
          );
          
          const deptSnapshot = await getDocs(deptQuery);
          
          if (!deptSnapshot.empty) {
            console.log(`Found ${deptSnapshot.size} professors in ${deptCode}`);
            professorsData = deptSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Apply filters to the department-specific results
            professorsData = filterByMinReviews(professorsData, reviewThreshold);
            
            // If we have enough professors after filtering, we can skip the fallback query
            if (professorsData.length >= 6) {
              // Apply sorting based on selected option
              professorsData = applySorting(professorsData, selectedSort);
              professorsData = professorsData.slice(0, 12);
              
              if (isMounted.current) {
                setProfessors(professorsData);
                
                // Update cache
                professorCache.data = professorsData;
                professorCache.timestamp = Date.now();
                
                setLoading(false);
                setInitialLoad(false);
              }
              return;
            }
            
            console.log(`Not enough professors (${professorsData.length}) after filtering, falling back to regular query`);
          } else {
            console.log(`No professors found for department: ${deptCode}`);
          }
        } catch (deptError) {
          console.error(`Error with department query for ${deptCode}:`, deptError);
        }
      }

      // Fallback or default query based on selected filters
      let baseQuery;
      if (selectedSort === SORT_OPTIONS.REVIEW_COUNT) {
        baseQuery = firestoreQuery(
          professorsRef,
          where('overall_metrics.review_count', '>=', reviewThreshold),
          orderBy('overall_metrics.review_count', 'desc'),
          limit(12)
        );
      } else if (selectedSort === SORT_OPTIONS.DIFFICULTY) {
        baseQuery = firestoreQuery(
          professorsRef,
          where('overall_metrics.review_count', '>=', reviewThreshold),
          orderBy('overall_metrics.difficulty_score', 'asc'),
          limit(12)
        );
      } else {
        baseQuery = firestoreQuery(
          professorsRef,
          where('overall_metrics.review_count', '>=', reviewThreshold),
          limit(50)
        );
      }

      const snapshot = await getDocs(baseQuery);
      professorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply sorting if needed
      professorsData = applySorting(professorsData, selectedSort);
      professorsData = professorsData.slice(0, 12);

      if (isMounted.current) {
        setProfessors(professorsData);
        
        // Update cache
        professorCache.data = professorsData;
        professorCache.timestamp = Date.now();
      }
    } catch (err) {
      console.error('Error fetching professors:', err);
      if (isMounted.current) {
        setError('Failed to load professors');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  }, [sortBy, minReviews, userMajor, searchQuery, selectedDepartment, professors.length]);

  // Add useEffect to trigger fetch when selectedDepartment changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchInitialProfessors(sortBy, minReviews);
    }
  }, [selectedDepartment, fetchInitialProfessors]);

  // The useEffects now correctly use the memoized callback
  // Initial load when user major is available
  useEffect(() => {
    if (userMajor) {
      // Add a small delay so UI transitions feel smoother
      const timer = setTimeout(() => {
        fetchInitialProfessors(sortBy, minReviews);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userMajor, fetchInitialProfessors]); // Only re-run when userMajor or the fetch function changes
  
  // Handle filter changes (sort option or min reviews)
  useEffect(() => {
    // Skip if this is the initial render or search is active
    if (!searchQuery && (sortBy || minReviews)) {
      fetchInitialProfessors(sortBy, minReviews);
    }
  }, [sortBy, minReviews, fetchInitialProfessors, searchQuery]);

  // Smooth scrolling when results change
  useEffect(() => {
    if (professors.length > 0 || searchResults.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [professors, searchResults]);

  const handleCourseClick = (courseLink) => {
    navigate(courseLink);
  };

  // Update dependencies to include dependencies for the fetchInitialProfessors function
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [professors, searchResults]);

  const getCourseLink = (prof) => {
    if (prof.courses && Object.keys(prof.courses).length > 0) {
      const firstCourse = Object.values(prof.courses)[0];
      if (firstCourse.department && firstCourse.document_id) {
        return `/departments/${firstCourse.department}/courses/${firstCourse.document_id}`;
      }
    }
    if (prof.latest_course) {
      const { department, document_id } = prof.latest_course;
      if (department && document_id) {
        return `/departments/${department}/courses/${document_id}`;
      }
    }
    return null;
  };

  const InfoBanner = ({ selectedDepartment, departmentOptions }) => {
    // Track if we're showing general professors or major-specific ones
    const [showingMajorSpecific, setShowingMajorSpecific] = useState(false);
    const [departmentName, setDepartmentName] = useState('');
    
    // Get department name from code (for display)
    useEffect(() => {
      if (selectedDepartment) {
        // Find the department name from departmentOptions
        const option = departmentOptions.find(opt => opt.value === selectedDepartment);
        if (option) {
          setDepartmentName(option.label.split(' (')[0]); // Extract just the name part
        } else {
          setDepartmentName(selectedDepartment); // Fallback to code
        }
      }
    }, [selectedDepartment, departmentOptions]);
    
    // Update when professors or department change
    useEffect(() => {
      if (selectedDepartment) {
        // If a department is explicitly selected, set showingMajorSpecific based on 
        // whether we have professors from that department
        setShowingMajorSpecific(hasProfessorsFromDepartment(professors, selectedDepartment));
      } else if (userMajor && professors.length > 0) {
        // Otherwise, check if at least one professor has the user's department
        const deptCode = getMajorDepartmentCode(userMajor);
        setShowingMajorSpecific(hasProfessorsFromDepartment(professors, deptCode));
      } else {
        setShowingMajorSpecific(false);
      }
    }, [professors, userMajor, selectedDepartment]);
    
    const getMessage = () => {
      if (selectedDepartment) {
        return showingMajorSpecific 
          ? `Showing professors from the ${selectedDepartment} department. Click on any professor's name to view their teaching summary and reviews.`
          : `We couldn't find enough professors for ${selectedDepartment}, so we're showing popular professors across all departments. Click on any professor's name to view their teaching summary.`;
      }
      
      if (userMajor && showingMajorSpecific) {
        const deptCode = getMajorDepartmentCode(userMajor);
        return `Showing professors from your major's department (${deptCode}). Click on any professor's name to view their teaching summary and reviews.`;
      }
      
      if (userMajor && !showingMajorSpecific) {
        const deptCode = getMajorDepartmentCode(userMajor);
        return `We couldn't find enough professors for your major's department (${deptCode}), so we're showing popular professors across all departments. Click on any professor's name to view their teaching summary.`;
      }
      
      return "Click on any professor's name to view their AI-generated teaching summary, student reviews, and course history.";
    };
    
    return (
      <div
        className={
          darkMode
            ? "p-4 rounded-lg mb-6 mt-2 bg-[#332F56]"
            : "bg-indigo-50 p-4 rounded-lg mb-6 mt-2"
        }
      >
        <p
          className={
            darkMode
              ? "text-gray-200 text-sm"
              : "text-indigo-800 text-sm"
          }
        >
          {getMessage()}
          {" "}*Note metrics are AI-generated and may be inaccurate.
        </p>
      </div>
    );
  };

  const handleSortChange = (option) => {
    setSortBy(option);
    if (!searchQuery) {
      fetchInitialProfessors(option, minReviews);
    }
  };

  const handleMinReviewsChange = (threshold) => {
    setMinReviews(threshold);
    if (!searchQuery) {
      fetchInitialProfessors(sortBy, threshold);
    }
  };

  const handleProfessorClick = (professorId) => {
    navigate(`/professors/${professorId}`);
  };

  const handleEmailClick = (e, email) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  const hasReviews = (prof) => {
    return (
      prof.overall_metrics?.review_count > 0 &&
      prof.overall_metrics?.quality !== "Unknown"
    );
  };


  // Load more data when scrolling
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [professors, searchResults]);

  // Display Logic
  const displayProfessors = searchQuery ? searchResults : professors;

  const handleDepartmentSelect = (deptCode) => {
    setSelectedDepartment(deptCode);
    setSearchQuery(''); // Clear any existing search
  };

  const clearDepartmentFilter = () => {
    setSelectedDepartment(null);
    fetchInitialProfessors(sortBy, minReviews);
  };

  const toggleAllDepartments = () => {
    setShowAllDepartments(!showAllDepartments);
  };

  if (error) {
    return (
      <div
        className={
          darkMode
            ? "min-h-screen flex items-center justify-center bg-[linear-gradient(90deg,_#1C093F_0%,_#0C0F33_100%)]"
            : "min-h-screen flex items-center justify-center bg-gray-50"
        }
      >
        <div 
          className={
            darkMode ? "text-red-400 text-center" : "text-red-500 text-center"
          }
        >
          <p className="text-xl font-semibold">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: darkMode
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
          : '#F9F9F9',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      {/* Header section for user's major */}
      {userMajor && !searchQuery && !selectedDepartment && (
        <div className="max-w-7xl mx-auto pt-8 px-6">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              marginBottom: '20px',
              color: darkMode ? '#fff' : '#2c3e50',
              textShadow: darkMode
                ? '1px 1px 2px rgba(0, 0, 0, 0.2)'
                : '1px 1px 2px rgba(0, 0, 0, 0.1)',
              transition: 'color 0.3s ease',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            Professors for {userMajor}
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{
              marginBottom: '20px',
              color: darkMode ? '#a78bfa' : '#571CE0',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: 500,
              maxWidth: 1100,
              marginLeft: 'auto',
              marginRight: 'auto',
              transition: 'background-color 0.3s ease, color 0.3s ease',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            Tailored recommendations based on your major
          </Typography>
        </div>
      )}

      {/* Default header (shown when no major, no search, no department selected) */}
      {!userMajor && !searchQuery && !selectedDepartment && (
        <div className="max-w-7xl mx-auto pt-8 px-6">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              marginBottom: '20px',
              color: darkMode ? '#fff' : '#2c3e50',
              textShadow: darkMode
                ? '1px 1px 2px rgba(0, 0, 0, 0.2)'
                : '1px 1px 2px rgba(0, 0, 0, 0.1)',
              transition: 'color 0.3s ease',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            Find Your Professors
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{
              marginBottom: '20px',
              color: darkMode ? '#a78bfa' : '#571CE0',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: 500,
              maxWidth: 1100,
              marginLeft: 'auto',
              marginRight: 'auto',
              transition: 'background-color 0.3s ease, color 0.3s ease',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            Search by name or select a department below
          </Typography>
        </div>
      )}

      {/* Header section for selected department */}
      {selectedDepartment && !searchQuery && (
        <div className="max-w-7xl mx-auto pt-8 px-6">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              marginBottom: '20px',
              color: darkMode ? '#fff' : '#2c3e50',
              textShadow: darkMode
                ? '1px 1px 2px rgba(0, 0, 0, 0.2)'
                : '1px 1px 2px rgba(0, 0, 0, 0.1)',
              transition: 'color 0.3s ease',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            {selectedDepartment} Department
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{
              marginBottom: '20px',
              color: darkMode ? '#a78bfa' : '#571CE0',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: 500,
              maxWidth: 1100,
              marginLeft: 'auto',
              marginRight: 'auto',
              transition: 'background-color 0.3s ease, color 0.3s ease',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            All professors in this department
          </Typography>
        </div>
      )}

      {/* Header for search results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="max-w-7xl mx-auto pt-8 px-6">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              marginBottom: '20px',
              color: darkMode ? '#fff' : '#2c3e50',
              textShadow: darkMode
                ? '1px 1px 2px rgba(0, 0, 0, 0.2)'
                : '1px 1px 2px rgba(0, 0, 0, 0.1)',
              transition: 'color 0.3s ease',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            Search Results
            <Box component="span" sx={{ 
              display: 'inline-block',
              fontSize: { xs: '0.6em', sm: '0.6em', md: '0.5em' },
              ml: 2, 
              opacity: 0.8,
              fontWeight: 500,
              verticalAlign: 'middle'
            }}>
              "{searchQuery}"
            </Box>
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{
              marginBottom: '20px',
              color: darkMode ? '#a78bfa' : '#571CE0',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: 500,
              maxWidth: 1100,
              marginLeft: 'auto',
              marginRight: 'auto',
              transition: 'background-color 0.3s ease, color 0.3s ease',
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            Found {searchResults.length} {searchResults.length === 1 ? 'professor' : 'professors'} matching your search
          </Typography>
        </div>
      )}

      {/* Search and Filter Section - show immediately */}
      <div className={`max-w-7xl mx-auto p-6 ${!searchQuery && !selectedDepartment && !userMajor ? 'mb-12' : 'mb-8 pt-4'} space-y-4`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search professors by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg shadow-sm ${
              darkMode
                ? "border-[#571CE0]/30 bg-[#0C0F33] text-white placeholder:text-gray-400"
                : "border-gray-200 bg-white text-gray-900"
            }`}
          />
          <Search
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              darkMode ? "text-gray-300" : "text-gray-400"
            }`}
          />
        </div>
        
        {/* Department Quick Select */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className={darkMode ? "text-white text-sm font-medium" : "text-gray-700 text-sm font-medium"}>
              Select Department
            </h3>
            <button
              onClick={toggleAllDepartments}
              className={`text-xs ${darkMode ? "text-indigo-300" : "text-indigo-600"} hover:underline`}
            >
              {showAllDepartments ? "Show Popular" : "View All"}
            </button>
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {/* Department Chips - Show only the code with hover tooltip */}
            {(showAllDepartments ? departmentOptions : popularDepartments).map((dept) => (
              <button 
                key={dept.value}
                onClick={() => handleDepartmentSelect(dept.value)}
                title={dept.label.split(' (')[0]} // Show full department name on hover
                className={`px-1 py-2 rounded-full text-xs font-medium transition-all transform hover:scale-105 ${
                  selectedDepartment === dept.value
                    ? darkMode 
                      ? "bg-indigo-700 text-white shadow-md" 
                      : "bg-indigo-500 text-white shadow-md"
                    : darkMode
                      ? "bg-[#1C1F43] text-gray-300 hover:bg-[#252a57]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={{ 
                  textAlign: 'center',
                  letterSpacing: '0.02em'
                }}
              >
                {dept.value}
              </button>
            ))}
            
            {/* Clear Selection Button - show only when a department is selected */}
            {selectedDepartment && (
              <button 
                onClick={clearDepartmentFilter}
                title="Clear department filter"
                className={`px-1 py-2 rounded-full text-xs font-medium flex items-center justify-center transition-all transform hover:scale-105 ${
                  darkMode 
                    ? "bg-red-800/70 text-red-200 hover:bg-red-700/80 shadow-md" 
                    : "bg-red-500 text-white hover:bg-red-600 shadow-md"
                }`}
                style={{ 
                  textAlign: 'center'
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        
        {!searchQuery && (
          <div className="flex flex-col md:flex-row gap-4">
            {/* Sort Options */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-grow">
              {Object.values(SORT_OPTIONS).map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleSortChange(option)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    sortBy === option
                      ? darkMode
                        ? 'bg-[#332F56] text-white'
                        : 'bg-indigo-100 text-indigo-700'
                      : darkMode
                        ? 'bg-[#1C1F43] text-gray-200 hover:bg-[#332F56]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Minimum Reviews Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {MIN_REVIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleMinReviewsChange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    minReviews === option.value
                      ? darkMode
                        ? 'bg-green-900 text-green-200'
                        : 'bg-green-100 text-green-700'
                      : darkMode
                        ? 'bg-[#1C1F43] text-gray-200 hover:bg-[#332F56]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Show InfoBanner only when not in initial loading state */}
        {!initialLoad && (
          <InfoBanner 
            selectedDepartment={selectedDepartment}
            departmentOptions={departmentOptions}
          />
        )}
      </div>

      {/* Professors Grid with improved loading state logic */}
      <div className="max-w-7xl mx-auto px-6">
        {initialLoad ? (
          <InitialLoading darkMode={darkMode} />
        ) : (loading || isSearching) && !displayProfessors.length ? (
          <LoadingSpinner darkMode={darkMode} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProfessors.map((prof) => (
                <div 
                  key={prof.id}
                  onClick={() => handleProfessorClick(prof.id)}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    darkMode
                      ? "bg-gradient-to-br from-[#1C1F43] to-[#171A3B] text-white hover:shadow-[0_15px_30px_-5px_rgba(80,70,180,0.2)]"
                      : "bg-white text-gray-900 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)]"
                  }`}
                  style={{ 
                    boxShadow: darkMode 
                      ? "0 10px 20px rgba(0, 0, 0, 0.3)"
                      : "0 10px 20px rgba(0, 0, 0, 0.05)",
                    transform: "translate3d(0, 0, 0)",
                  }}
                >
                  <div className={`p-6 ${darkMode ? "border-b border-[#343866]" : "border-b border-gray-100"}`}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-medium ${
                          darkMode 
                            ? "bg-gradient-to-br from-[#4e3cf6] to-[#7b5cff] text-white"
                            : "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white"
                        }`}>
                          {prof.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                            {prof.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.keys(prof.departments || {}).slice(0, 2).map((dept) => (
                              <span
                                key={dept}
                                className={
                                  darkMode
                                    ? "text-xs px-2 py-0.5 bg-[#2c2e4a] rounded-full text-gray-300"
                                    : "text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
                                }
                              >
                                {dept}
                              </span>
                            ))}
                            {Object.keys(prof.departments || {}).length > 2 && (
                              <span
                                className={
                                  darkMode
                                    ? "text-xs px-2 py-0.5 bg-[#2c2e4a] rounded-full text-gray-300"
                                    : "text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
                                }
                              >
                                +{Object.keys(prof.departments || {}).length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {prof.contact_info?.email && (
                        <button
                          onClick={(e) => handleEmailClick(e, prof.contact_info.email)}
                          className={`rounded-full p-2 transition-colors ${
                            darkMode ? "hover:bg-[#332F56]" : "hover:bg-gray-100"
                          }`}
                        >
                          <Mail
                            className={`w-4 h-4 ${
                              darkMode ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-700"
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    {hasReviews(prof) ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <MetricBadge
                            value={prof.overall_metrics.quality_score || 0}
                            label="Quality"
                            darkMode={darkMode}
                          />
                          <MetricBadge
                            value={prof.overall_metrics.difficulty_score || 0}
                            label="Difficulty"
                            isDifficulty={true}
                            onClick={handleCourseClick}
                            courseLink={prof.course_path ? `/departments/${prof.course_path}` : null}
                            darkMode={darkMode}
                          />
                          <MetricBadge
                            value={prof.overall_metrics.sentiment_score || 0}
                            label="Sentiment"
                            darkMode={darkMode}
                          />
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <div className={`inline-flex items-center gap-1 ${darkMode ? "text-gray-300/90" : "text-gray-600/90"}`}>
                            <span className="text-sm font-medium">{prof.overall_metrics.review_count || 0}</span>
                            <span className="text-xs">reviews</span>
                          </div>
                          <div
                            className={`text-xs ${
                              darkMode ? "text-indigo-300/80" : "text-indigo-600/80"
                            }`}
                          >
                            Click difficulty for course
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className={
                          darkMode
                            ? "flex items-center justify-center p-4 rounded-lg bg-[#252848]"
                            : "flex items-center justify-center p-4 rounded-lg bg-gray-50"
                        }
                      >
                        <p className={darkMode ? "text-gray-300 text-sm" : "text-gray-500 text-sm"}>
                          No reviews available yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {isSearching && <LoadingOverlay darkMode={darkMode} />}

            {!loading && !isSearching && displayProfessors.length === 0 && (
              <div className="text-center py-12">
                <p
                  className={
                    darkMode ? "text-gray-300 text-lg" : "text-gray-500 text-lg"
                  }
                >
                  No professors found matching your search.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Preload data for faster return navigation
// This runs once when the app loads
(async function preloadProfessorData() {
  try {
    if (!professorCache.data) {
      console.log('Preloading professor data...');
      const professorsRef = collection(db, 'professor');
      const baseQuery = firestoreQuery(
        professorsRef,
        where('overall_metrics.review_count', '>=', 10),
        orderBy('overall_metrics.review_count', 'desc'),
        limit(12)
      );
      
      const snapshot = await getDocs(baseQuery);
      const professorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      professorCache.data = professorsData;
      professorCache.timestamp = Date.now();
      console.log('Professor data preloaded successfully');
    }
  } catch (err) {
    console.error('Error preloading professor data:', err);
  }
})();

export default ProfessorDirectory;