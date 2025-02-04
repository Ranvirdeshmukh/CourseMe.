import React, { useState, useEffect } from 'react';
import { Search, Mail } from 'lucide-react';
import { getFirestore, collection, query as firestoreQuery, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

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

const getScoreColor = (score, darkMode) => {
  // In dark mode, you might prefer slightly more muted backgrounds
  // This function returns color classes. We'll define separate sets
  // for dark mode vs. light mode if you want to tweak them differently.
  if (score >= 80) return darkMode ? 'text-green-300 bg-green-900/20' : 'text-green-600 bg-green-50';
  if (score >= 60) return darkMode ? 'text-green-300 bg-green-900/20' : 'text-green-600/80 bg-green-50/80';
  if (score >= 40) return darkMode ? 'text-yellow-300 bg-yellow-900/20' : 'text-yellow-600 bg-yellow-50';
  return darkMode ? 'text-red-300 bg-red-900/20' : 'text-red-600 bg-red-50';
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
      className={`px-3 py-1.5 rounded-full ${getScoreColor(displayValue, darkMode)} ${
        courseLink ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all' : ''
      }`}
      onClick={handleClick}
      title={courseLink ? "View course details" : undefined}
    >
      <div className="text-sm font-semibold">{displayValue.toFixed(1)}</div>
      <div className="text-xs opacity-75">{label}</div>
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

const ProfessorDirectory = ({ darkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [professors, setProfessors] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.REVIEW_COUNT);
  const [minReviews, setMinReviews] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  const handleCourseClick = (courseLink) => {
    navigate(courseLink);
  };

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

  const fetchInitialProfessors = async (selectedSort = sortBy, reviewThreshold = minReviews) => {
    try {
      setLoading(true);
      const professorsRef = collection(db, 'professor');
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
      let professorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (
        selectedSort.field &&
        selectedSort !== SORT_OPTIONS.REVIEW_COUNT &&
        selectedSort !== SORT_OPTIONS.DIFFICULTY
      ) {
        professorsData.sort((a, b) => {
          const scoreA = a.overall_metrics?.[selectedSort.field] || 0;
          const scoreB = b.overall_metrics?.[selectedSort.field] || 0;
          return scoreB - scoreA;
        });
        professorsData = professorsData.slice(0, 12);
      } else if (selectedSort === SORT_OPTIONS.RANDOM) {
        professorsData = professorsData
          .sort(() => Math.random() - 0.5)
          .slice(0, 12);
      }

      setProfessors(professorsData);
      setSearchResults([]);
    } catch (err) {
      console.error('Error fetching professors:', err);
      setError('Failed to load professors');
    } finally {
      setLoading(false);
    }
  };

  const InfoBanner = () => (
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
        Click on any professor's name to view their AI-generated teaching summary, student reviews, and course history.
        *Note metrics are AI-generated and may be inaccurate.
      </p>
    </div>
  );

  const searchProfessors = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      fetchInitialProfessors(sortBy, minReviews);
      return;
    }
    try {
      setIsSearching(true);
      const professorsRef = collection(db, 'professor');

      // Format the search term to match the capitalization pattern
      const formattedSearch = searchTerm.trim().toLowerCase().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Create query to search by name field
      const searchQuery = query(
        professorsRef,
        where('name', '>=', formattedSearch),
        where('name', '<=', formattedSearch + '\uf8ff'),
        limit(20)
      );

      const querySnapshot = await getDocs(searchQuery);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSearchResults(results);
    } catch (err) {
      console.error('Error searching professors:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchInitialProfessors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProfessors(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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

  const displayProfessors = searchQuery ? searchResults : professors;

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
      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto p-6 mb-12 space-y-4">
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
        <InfoBanner />
      </div>

      {/* Professors Grid */}
      <div className="max-w-7xl mx-auto px-6">
        {(loading || isSearching) && !displayProfessors.length ? (
          <LoadingSpinner darkMode={darkMode} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProfessors.map((prof) => (
                <div 
                  key={prof.id}
                  onClick={() => handleProfessorClick(prof.id)}
                  className={`rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                    darkMode
                      ? "bg-[#1C1F43] text-white shadow-md hover:bg-[#24273c]"
                      : "bg-white text-gray-900 shadow-lg hover:shadow-xl"
                  }`}
                  style={{ boxShadow: darkMode 
                    ? "0 6px 16px rgba(255, 255, 255, 0.1)"
                    : "0 6px 16px rgba(0, 0, 0, 0.08)"
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {prof.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.keys(prof.departments || {}).map((dept) => (
                          <span
                            key={dept}
                            className={
                              darkMode
                                ? "text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-200"
                                : "text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600"
                            }
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                    {prof.contact_info?.email && (
                      <button
                        onClick={(e) => handleEmailClick(e, prof.contact_info.email)}
                        className={`p-2 rounded-full transition-colors ${
                          darkMode ? "hover:bg-[#332F56]" : "hover:bg-gray-100"
                        }`}
                      >
                        <Mail
                          className={`w-5 h-5 ${
                            darkMode ? "text-gray-200 hover:text-white" : "text-gray-500 hover:text-gray-700"
                          }`}
                        />
                      </button>
                    )}
                  </div>

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
                        <span
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {prof.overall_metrics.review_count || 0} Reviews
                        </span>
                        <div
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Click difficulty to view course
                        </div>
                      </div>
                    </>
                  ) : (
                    <NoReviewsCard darkMode={darkMode} />
                  )}
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

export default ProfessorDirectory;
