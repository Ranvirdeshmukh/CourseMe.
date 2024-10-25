import React, { useState, useEffect } from 'react';
import { Search, Mail } from 'lucide-react';
import { getFirestore, collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
    <div className="relative w-20 h-20">
      <div className="absolute top-0 left-0 right-0 bottom-0">
        <div className="w-full h-full border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
    <div className="text-sm text-gray-500 animate-pulse">Loading professors...</div>
  </div>
);

const LoadingOverlay = () => (
  <div className="flex justify-center items-center py-8">
    <div className="relative w-12 h-12">
      <div className="absolute top-0 left-0 right-0 bottom-0">
        <div className="w-full h-full border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
  </div>
);

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-green-600/80 bg-green-50/80';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const MetricBadge = ({ value, label }) => (
  <div className={`px-3 py-1.5 rounded-full ${getScoreColor(value)}`}>
    <div className="text-sm font-semibold">{value.toFixed(1)}</div>
    <div className="text-xs opacity-75">{label}</div>
  </div>
);

const NoReviewsCard = () => (
  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
    <p className="text-gray-500 text-sm">No reviews available yet</p>
  </div>
);

const MIN_REVIEW_OPTIONS = [
    { label: 'All Reviews', value: 0 },
    { label: '5+ Reviews', value: 5 },
    { label: '10+ Reviews', value: 10 },
    { label: '20+ Reviews', value: 20 }
  ];
  
  const SORT_OPTIONS = {
    REVIEW_COUNT: { label: 'Most Reviews', field: 'review_count' },
    QUALITY: { label: 'Best Quality', field: 'quality_score' },
    DIFFICULTY: { label: 'Best Difficulty', field: 'difficulty_score' },
    SENTIMENT: { label: 'Best Sentiment', field: 'sentiment_score' },
    RANDOM: { label: 'Random', field: null }
  };
  
  const ProfessorDirectory = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [professors, setProfessors] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState(SORT_OPTIONS.REVIEW_COUNT);
    const [minReviews, setMinReviews] = useState(10); // Default to 10+ reviews
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const db = getFirestore();
  
    const fetchInitialProfessors = async (selectedSort = sortBy, reviewThreshold = minReviews) => {
      try {
        setLoading(true);
        const professorsRef = collection(db, 'professors');
        
        let baseQuery;
        if (selectedSort === SORT_OPTIONS.REVIEW_COUNT) {
          // For review count, use direct Firebase ordering
          baseQuery = query(
            professorsRef,
            where('overall_analysis.metrics.review_count', '>=', reviewThreshold),
            orderBy('overall_analysis.metrics.review_count', 'desc'),
            limit(12)
          );
        } else {
          // For other metrics, fetch more professors then sort
          baseQuery = query(
            professorsRef,
            where('overall_analysis.metrics.review_count', '>=', reviewThreshold),
            limit(50)
          );
        }
        
        const snapshot = await getDocs(baseQuery);
        let professorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        // Only sort if not using REVIEW_COUNT (which is already sorted by Firebase)
        if (selectedSort.field && selectedSort !== SORT_OPTIONS.REVIEW_COUNT) {
          professorsData.sort((a, b) => {
            const scoreA = a.overall_analysis?.metrics?.[selectedSort.field] || 0;
            const scoreB = b.overall_analysis?.metrics?.[selectedSort.field] || 0;
            return scoreB - scoreA;
          });
          professorsData = professorsData.slice(0, 12);
        } else if (selectedSort === SORT_OPTIONS.RANDOM) {
          professorsData = professorsData
            .sort(() => Math.random() - 0.5)
            .slice(0, 12);
        }
  
        setProfessors(professorsData);
      } catch (err) {
        console.error('Error fetching professors:', err);
        setError('Failed to load professors');
      } finally {
        setLoading(false);
      }
    };
    
      const searchProfessors = async () => {
        if (!searchQuery.trim()) {
          setSearchResults([]);
          return;
        }
    
        try {
          setIsSearching(true);
          const professorsRef = collection(db, 'professors');
          
          // Split search query into terms and create search strings for each term
          const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term);
          const results = new Set();
    
          // Get initial results for the first term
          const firstTerm = searchTerms[0];
          const initialQuery = query(
            professorsRef,
            where('name', '>=', firstTerm),
            where('name', '<=', firstTerm + '\uf8ff'),
            limit(100)
          );
    
          const snapshot = await getDocs(initialQuery);
          
          // Filter results that match all search terms
          snapshot.docs.forEach(doc => {
            const profData = doc.data();
            const profName = profData.name.toLowerCase();
            
            // Check if all search terms are present in the professor's name
            if (searchTerms.every(term => profName.includes(term))) {
              results.add(JSON.stringify({ id: doc.id, ...profData }));
            }
          });
    
          const searchData = Array.from(results)
            .map(jsonStr => JSON.parse(jsonStr))
            .slice(0, 12);
    
          setSearchResults(searchData);
        } catch (err) {
          console.error('Error searching professors:', err);
        } finally {
          setIsSearching(false);
        }
      };
  useEffect(() => {
    fetchInitialProfessors();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchProfessors();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
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
      prof.overall_analysis?.metrics?.review_count > 0 &&
      prof.overall_analysis?.quality !== "Unknown"
    );
  };

  const displayProfessors = searchQuery ? searchResults : professors;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <button 
            onClick={() => fetchInitialProfessors()}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto mb-12 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search professors by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg bg-white shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                      ? 'bg-indigo-100 text-indigo-700'
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
                      ? 'bg-green-100 text-green-700'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Professors Grid */}
      <div className="max-w-7xl mx-auto">
        {(loading || isSearching) && !displayProfessors.length ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProfessors.map((prof) => (
                <div 
                  key={prof.id}
                  onClick={() => handleProfessorClick(prof.id)}
                  className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{prof.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.keys(prof.departments || {}).map((dept) => (
                          <span key={dept} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                    {prof.contact_info?.email && (
                      <button
                        onClick={(e) => handleEmailClick(e, prof.contact_info.email)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Mail className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                      </button>
                    )}
                  </div>

                  {hasReviews(prof) ? (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <MetricBadge 
                          value={prof.overall_analysis.metrics.quality_score || 0} 
                          label="Quality"
                        />
                        <MetricBadge 
                          value={prof.overall_analysis.metrics.difficulty_score || 0} 
                          label="Difficulty"
                        />
                        <MetricBadge 
                          value={prof.overall_analysis.metrics.sentiment_score || 0} 
                          label="Sentiment"
                        />
                      </div>

                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {prof.overall_analysis.metrics.review_count || 0} Reviews
                        </span>
                        <div className="text-xs text-gray-500">
                          Click to view details
                        </div>
                      </div>
                    </>
                  ) : (
                    <NoReviewsCard />
                  )}
                </div>
              ))}
            </div>

            {isSearching && <LoadingOverlay />}

            {!loading && !isSearching && displayProfessors.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No professors found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfessorDirectory;