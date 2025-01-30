import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Alert, 
  Paper, 
  CircularProgress, 
  useMediaQuery,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Slider,
  Checkbox,
  Button,
  Popover,
  FormGroup,
} from '@mui/material';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { db } from '../firebase';
import departmentMapping from '../classstructure/departmentMapping';

const CACHE_PREFIX = 'courses_';
const CACHE_EXPIRATION = 5 * 24 * 60 * 60 * 1000 // 5 days 
const CACHE_VERSION = '1.1'; // Add version control to cache
const DEPARTMENT_VERSIONS = {
  'ENGS': '1.1', // Increment this version specifically for ENGS
  'default': '1.0' // Keep default version for other departments
};

// Utility functions for cache management
// Update the getCacheKey function to use department-specific versions
const getCacheKey = (department) => {
  const version = DEPARTMENT_VERSIONS[department] || DEPARTMENT_VERSIONS.default;
  return `${CACHE_PREFIX}${department}_${version}`;
};

// Update the getFromCache function to handle department-specific versions
const getFromCache = (department) => {
  try {
    const cacheKey = getCacheKey(department);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const { data, timestamp } = JSON.parse(cachedData);
    const now = new Date().getTime();
    
    // Check if cache has expired
    if (now - timestamp > CACHE_EXPIRATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

// Update the saveToCache function to use department-specific versions
const saveToCache = (department, data) => {
  try {
    const cacheKey = getCacheKey(department);
    const cacheData = {
      data,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

// Optional: Add a function to clear old ENGS cache entries
const clearOldEngsCache = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${CACHE_PREFIX}ENGS_`) && !key.endsWith(DEPARTMENT_VERSIONS.ENGS)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing old ENGS cache:', error);
  }
};

const DepartmentCoursesPage = ({ darkMode }) => {
  const { department } = useParams();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Filter States
  const [sortOption, setSortOption] = useState('level'); // 'level', 'alphabetical', 'layup'
  const [layupVotes, setLayupVotes] = useState([-300, 300]); // Range for Layup votes
  const [withReviewsOnly, setWithReviewsOnly] = useState(false); // Show only courses with reviews
  const [selectedDistribs, setSelectedDistribs] = useState([]); // For filtering by distribution categories
  const [qualityFilter, setQualityFilter] = useState([-1000, 1000]); // Range for Quality filter
  const [selectedWCDistribs, setSelectedWCDistribs] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState([]);
  const [showFilterTip, setShowFilterTip] = useState(false);
  

  // Popover state
  const [anchorEl, setAnchorEl] = useState(null);

  // First add the state for controlling filter visibility
  const [showFilters, setShowFilters] = useState(false);

  const fetchCourses = async (forceFetch = false) => {
    try {
      setLoading(true);
      
      // Check cache first if not forcing a fetch
      if (!forceFetch) {
        const cachedData = getFromCache(department);
        if (cachedData) {
          console.log('Using cached data for department:', department);
          setCourses(cachedData);
          setFilteredCourses(cachedData);
          setLastUpdated(new Date().getTime());
          setLoading(false);
          return;
        }
      }

      console.log('Fetching fresh data for department:', department);
      const db = getFirestore();
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, where('department', '==', department));
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const coursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Save to cache
        saveToCache(department, coursesData);
        
        setCourses(coursesData);
        setFilteredCourses(coursesData);
        setLastUpdated(new Date().getTime());
      } else {
        setError('No courses found for this department.');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses: ' + error.message);
      
      // Try to fall back to cached data if available
      const cachedData = getFromCache(department);
      if (cachedData) {
        setCourses(cachedData);
        setFilteredCourses(cachedData);
        setLastUpdated(new Date().getTime());
        setError('Using cached data due to fetch error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Modified useEffect to handle cache
  useEffect(() => {
    fetchCourses();
  }, [department]);

  // Add refresh functionality
  const handleRefresh = () => {
    fetchCourses(true); // Force fetch fresh data
  };

  // Add cache management utilities
  const clearDepartmentCache = () => {
    localStorage.removeItem(getCacheKey(department));
    handleRefresh();
  };

  const clearAllCache = () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
    handleRefresh();
  };
  
  // Add a function to clear cache for testing
  const clearCache = () => {
    console.log('Clearing cache...');
    localStorage.removeItem(`${CACHE_PREFIX}${department}`);
    fetchCourses();
  };
  
  // Add this temporary debug button to your UI (remove in production)
  <Button 
    onClick={clearCache}
    sx={{
      marginBottom: '10px',
      backgroundColor: '#ff4444',
      color: 'white',
      '&:hover': {
        backgroundColor: '#cc0000',
      }
    }}
  >
    Clear Cache & Reload
  </Button>


  // Apply Filters Whenever Filter States Change
  useEffect(() => {
    const applyFilters = () => {
      console.log('Applying filters with data source:', {
        totalCourses: courses.length,
        sampleCourse: courses[0],
        dataSource: courses[0]?._source || 'unknown', // Add a _source field if needed
        selectedTerms,
      });
      const hasMatchingDistribs = (course) => {
        const courseDistribs = Array.isArray(course.distribs) ? 
          course.distribs : 
          course.distribs?.split(',').map(d => d.trim());
        
        // Check for regular distribs
        const hasRegularDistrib = selectedDistribs.length === 0 || 
          selectedDistribs.some(distrib => courseDistribs?.includes(distrib));
        
        // Check for World Culture distribs
        const hasWCDistrib = selectedWCDistribs.length === 0 || 
          selectedWCDistribs.some(distrib => courseDistribs?.includes(distrib));
        
        return hasRegularDistrib && hasWCDistrib;
      };
      let updatedCourses = [...courses];
    
      if (selectedTerms.length > 0) {
        console.log('Before terms filter:', updatedCourses.length);
        updatedCourses = updatedCourses.filter(course => {
          const courseTerms = course.terms || [];
          const matches = selectedTerms.some(term => courseTerms.includes(term));
          console.log('Course terms check:', {
            courseName: course.name,
            courseTerms,
            selectedTerms,
            matches
          });
          return matches;
        });
        console.log('After terms filter:', updatedCourses.length);
      }
    

      const hasMatchingTerm = (course) => {
        console.log("terms")
        console.log(course.terms)
        if (selectedTerms.length === 0) return true; // If no terms selected, include all courses
        return selectedTerms.some(term => 
          Array.isArray(course.terms) && course.terms.includes(term)
        );
      };

      // Apply all filters
      updatedCourses = updatedCourses.filter(course => {
        return (
          (course.layup >= layupVotes[0] && course.layup <= layupVotes[1]) &&
          (!withReviewsOnly || course.numOfReviews > 0) &&
          hasMatchingDistribs(course) &&
          (course.quality >= qualityFilter[0] && course.quality <= qualityFilter[1]) &&
          hasMatchingTerm(course)
        );
      });

      // Sort courses with priority for matching both types of distribs
      if (selectedDistribs.length > 0 || selectedWCDistribs.length > 0) {
        updatedCourses.sort((a, b) => {
          const aDistribs = Array.isArray(a.distribs) ? a.distribs : a.distribs?.split(',').map(d => d.trim());
          const bDistribs = Array.isArray(b.distribs) ? b.distribs : b.distribs?.split(',').map(d => d.trim());
          
          // Count matching distribs for each course
          const aMatchCount = (
            selectedDistribs.filter(d => aDistribs?.includes(d)).length +
            selectedWCDistribs.filter(d => aDistribs?.includes(d)).length
          );
          const bMatchCount = (
            selectedDistribs.filter(d => bDistribs?.includes(d)).length +
            selectedWCDistribs.filter(d => bDistribs?.includes(d)).length
          );
          
          return bMatchCount - aMatchCount;  // Sort by number of matches (descending)
        });
      }

      // Apply additional sorting if specified
      switch (sortOption) {
        case 'level':
          updatedCourses.sort((a, b) => a.level - b.level);
          break;
        case 'alphabetical':
          updatedCourses.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'layup':
          updatedCourses.sort((a, b) => b.layup - a.layup);
          break;
        default:
          break;
      }
      setFilteredCourses(updatedCourses);
    };

    applyFilters();
  }, [courses, sortOption, layupVotes, withReviewsOnly, selectedDistribs, selectedWCDistribs, qualityFilter, selectedTerms]);

  useEffect(() => {
    // Check if it's the first visit
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      setShowFilterTip(true);
      localStorage.setItem('hasVisitedBefore', 'true');
      
      // Automatically hide the tooltip after 5 seconds
      setTimeout(() => {
        setShowFilterTip(false);
      }, 5000);
    }
  }, []);
  // Handler for World Culture distribs change
  const handleWCDistribsChange = (event) => {
    const value = event.target.value;
    setSelectedWCDistribs(prev => 
      prev.includes(value) ? prev.filter(distrib => distrib !== value) : [...prev, value]
    );
  };
  const handleTermsChange = (event) => {
    const value = event.target.value;
    setSelectedTerms(prev => 
      prev.includes(value) ? prev.filter(term => term !== value) : [...prev, value]
    );
  };

  // Handler for Layup Votes Slider
  const handleLayupVotesChange = (event, newValue) => {
    setLayupVotes(newValue);
  };

  // Handler for Quality Slider
  const handleQualityFilterChange = (event, newValue) => {
    setQualityFilter(newValue);
  };

  // Handler for Distribs change
  const handleDistribsChange = (event) => {
    const value = event.target.value;
    setSelectedDistribs(prev => 
      prev.includes(value) ? prev.filter(distrib => distrib !== value) : [...prev, value]
    );
  };

  // Toggle Popover
  const handleFilterOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const popoverId = open ? 'filter-popover' : undefined;

  // Full Distribs categories with descriptions
  const distribOptions = [
    { label: 'ART', value: 'ART' },
    { label: 'LIT', value: 'LIT' },
    { label: 'TMV', value: 'TMV' },
    { label: 'INT', value: 'INT' },
    { label: 'SOC', value: 'SOC' },
    { label: 'QDS', value: 'QDS' },
    { label: 'SCI/SLA', value: 'SCI/SLA' },
    { label: 'TAS/TLA', value: 'TAS/TLA' },
  ];
  const worldCultureOptions = [
    { label: 'W', value: 'W' },
    { label: 'NW', value: 'NW' },
    { label: 'CI', value: 'CI' },
  ];

  

  // Define color variables based on darkMode
  const mainBgColor = darkMode 
  ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)' 
  : '#F9F9F9';
  const paperBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
  const textColor = darkMode ? '#FFFFFF' : '#333333';
  const headerTextColor = darkMode ? '#FFFFFF' : '#34495E';
  const buttonBgColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)';
  const buttonHoverBgColor = darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)';
  const borderColor = darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)';
  const tableHeaderBgColor = darkMode ? '#333333' : '#E0E0E0';
  const tableRowEvenBgColor = darkMode ? '#1C1F43' : '#F8F8F8';
  const tableRowOddBgColor = darkMode ? '#24273c' : '#FFFFFF';
  const tooltipBgColor = darkMode ? '#333333' : '#f5f5f9';
  const tooltipTextColor = darkMode ? '#FFFFFF' : '#000000';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: mainBgColor,
        padding: '20px',
        fontFamily: 'SF Pro Display, sans-serif',
        color: textColor,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', // Changed from center to allow for the note
          width: '100%', 
          marginBottom: '20px' // Moved margin to container
        }}>
          <Typography 
            variant="h3" 
            align='left'
            sx={{ 
              fontWeight: 600, 
              fontFamily: 'SF Pro Display, sans-serif', 
              color: headerTextColor,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Courses in {departmentMapping[department]?.name || department}
          </Typography>

          {/* Filter button and note in a flex container */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            gap: '4px'
          }}>
            <Button 
  onClick={() => setShowFilters(!showFilters)}
  sx={{
    position: 'relative',
    backgroundColor: buttonBgColor,
    backdropFilter: 'blur(10px)',
    color: darkMode ? '#FFFFFF' : '#1c1c1e', // Conditional text color
    borderRadius: '25px', // Increased border radius for a smoother look
    padding: '10px 20px',
    fontWeight: '500',
    fontSize: '15px',
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
    border: `2px solid #571CE0`, // Increased border width and specific color
    boxShadow: darkMode
      ? '0px 4px 12px rgba(255, 255, 255, 0.1)' // Light shadow in dark mode
      : '0px 4px 12px rgba(0, 0, 0, 0.1)', // Dark shadow in light mode
    transition: 'all 0.2s ease',
    textTransform: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: 'fit-content',
    minHeight: '40px',
    '&:hover': {
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)', // Subtle background change on hover
      borderColor: '#571CE0', // Maintain border color on hover
      boxShadow: darkMode
        ? '0px 6px 16px rgba(255, 255, 255, 0.15)' // Enhanced shadow on hover in dark mode
        : '0px 6px 16px rgba(0, 0, 0, 0.15)', // Enhanced shadow on hover in light mode
    },
  }}
>
              <span>Filters</span>
              {(selectedDistribs.length > 0 || selectedWCDistribs.length > 0 || selectedTerms.length > 0 || withReviewsOnly) && (
                <Box
                  sx={{
                    backgroundColor: '#007AFF',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedDistribs.length + selectedWCDistribs.length + selectedTerms.length + (withReviewsOnly ? 1 : 0)}
                </Box>
              )}
            </Button>
            <Typography 
              sx={{ 
                fontSize: '11px',
                color: '#666',
                fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: '400',
                opacity: 0.8,
                letterSpacing: '0.2px'
              }}
            >
              Filter by Winter 2025 (on special demand)
            </Typography>
          </Box>
        </Box>

        {/* Filters Section */}
        <Box
          sx={{
            opacity: showFilters ? 1 : 0,
            transform: showFilters ? 'translateY(0)' : 'translateY(-8px)',
            visibility: showFilters ? 'visible' : 'hidden',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            height: showFilters ? 'auto' : 0,
            overflow: 'hidden',
            marginBottom: showFilters ? '24px' : 0,
            transformOrigin: 'top',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: showFilters ? '16px' : 0,
            border: `1px solid ${borderColor}`,
            boxShadow: darkMode
              ? '0 2px 8px rgba(255, 255, 255, 0.05)'
              : '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px',
            width: '100%'
          }}>
            {/* Combined Filters in Rows */}
            <Box sx={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              '& > *': { // This targets all direct children
                flexShrink: 0,
              }
            }}>
              {/* Sort Options */}
              {[
                { value: 'level', label: 'Level (low to high)' },
                { value: 'alphabetical', label: 'Alphabetical' },
                { value: 'layup', label: 'Layup votes' }
              ].map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setSortOption(option.value)}
                  sx={{
                    height: '32px',
                    padding: '0 16px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    backgroundColor: sortOption === option.value 
                      ? '#007AFF' 
                      : darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                    color: sortOption === option.value 
                      ? '#FFFFFF' 
                      : '#007AFF',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: sortOption === option.value 
                        ? '#0066D6' 
                        : darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 122, 255, 0.15)',
                    }
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Box>

            {/* Distribs and World Culture in one row */}
            <Box sx={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              '& > *': {
                flexShrink: 0,
              }
            }}>
              {/* Distribs */}
              {distribOptions.map((distrib) => (
                <Button
                  key={distrib.value}
                  onClick={() => {
                    setSelectedDistribs(prev => 
                      prev.includes(distrib.value) 
                        ? prev.filter(d => d !== distrib.value) 
                        : [...prev, distrib.value]
                    );
                  }}
                  sx={{
                    height: '32px',
                    padding: '0 16px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    backgroundColor: selectedDistribs.includes(distrib.value) 
                      ? '#5E5CE6' // iOS purple
                      : darkMode ? 'rgba(94, 92, 230, 0.1)' : 'rgba(94, 92, 230, 0.1)',
                    color: selectedDistribs.includes(distrib.value) 
                      ? '#FFFFFF' 
                      : '#5E5CE6',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: selectedDistribs.includes(distrib.value) 
                        ? '#4E4CC6' 
                        : darkMode ? 'rgba(94, 92, 230, 0.15)' : 'rgba(94, 92, 230, 0.15)',
                    }
                  }}
                >
                  {distrib.label}
                </Button>
              ))}

              {/* World Culture */}
              {worldCultureOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => {
                    setSelectedWCDistribs(prev => 
                      prev.includes(option.value) 
                        ? prev.filter(d => d !== option.value) 
                        : [...prev, option.value]
                    );
                  }}
                  size="small"
                  sx={{
                    minHeight: '32px',
                    px: 2,
                    py: 0.5,
                    borderRadius: '16px',
                    fontSize: '0.813rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    backgroundColor: selectedWCDistribs.includes(option.value) 
                      ? '#34C759' // iOS green
                      : darkMode ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.1)',
                    color: selectedWCDistribs.includes(option.value) 
                      ? '#FFFFFF' 
                      : '#34C759',
                    border: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: selectedWCDistribs.includes(option.value) 
                        ? '#2DB14F' 
                        : darkMode ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.15)',
                    }
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Box>

            {/* Additional Filters Row */}
            <Box sx={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              '& > *': {
                flexShrink: 0,
              }
            }}>
              {/* Term Filter */}
              <Button
                onClick={() => {
                  setSelectedTerms(prev => 
                    prev.includes('25W') 
                      ? prev.filter(t => t !== '25W') 
                      : [...prev, '25W']
                  );
                }}
                size="small"
                sx={{
                  minHeight: '32px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '16px',
                  fontSize: '0.813rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  backgroundColor: selectedTerms.includes('25W') 
                    ? 'rgba(87, 28, 224, 0.2)' 
                    : darkMode ? 'white' : 'white',
                  color: selectedTerms.includes('25W') 
                    ? '#571CE0' 
                    : darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                  border: selectedTerms.includes('25W') 
                    ? '1px solid rgba(87, 28, 224, 0.2)' 
                    : `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`,
                  '&:hover': {
                    backgroundColor: selectedTerms.includes('25W') 
                      ? 'rgba(87, 28, 224, 0.15)' 
                      : darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                Winter 2025
              </Button>

              {/* Reviews Only Filter */}
              <Button
                onClick={() => setWithReviewsOnly(!withReviewsOnly)}
                size="small"
                sx={{
                  minHeight: '32px',
                  px: 2,
                  py: 0.5,
                  borderRadius: '16px',
                  fontSize: '0.813rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  backgroundColor: withReviewsOnly 
                    ? '#FF9500' // iOS orange
                    : darkMode ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                  color: withReviewsOnly 
                    ? '#FFFFFF' 
                    : '#FF9500',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: withReviewsOnly 
                      ? '#E68600' 
                      : darkMode ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                  }
                }}
              >
                With Reviews Only
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Courses Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '200px' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredCourses.length > 0 ? (
          <TableContainer 
            component={Paper} 
            sx={{ 
              backgroundColor: paperBgColor, 
              borderRadius: '10px', 
              boxShadow: darkMode 
                ? '0 2px 8px rgba(255, 255, 255, 0.05)' 
                : '0 2px 8px rgba(0, 0, 0, 0.1)', 
              padding: '10px',
              overflowX: 'auto',
              flex: '3',
            }}
          >
            <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      color: headerTextColor, 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '12px 10px',
                      borderBottom: '2px solid',
                      borderColor: tableHeaderBgColor,
                      width: '15%', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Course Code
                  </TableCell>
                  
                  <TableCell 
                    sx={{ 
                      color: headerTextColor, 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '12px 20px',
                      borderBottom: '2px solid',
                      borderColor: tableHeaderBgColor,
                      width: '50%' 
                    }}
                  >
                    Course Name
                  </TableCell>

                  {!isMobile && (
                    <TableCell 
                      sx={{ 
                        color: headerTextColor, 
                        textAlign: 'center', 
                        fontWeight: 600, 
                        fontSize: '1rem', 
                        padding: '10px', 
                        borderBottom: '2px solid',
                        borderColor: tableHeaderBgColor,
                      }}
                    >
                      Distribs
                    </TableCell>
                  )}
                  <TableCell 
                    sx={{ 
                      color: headerTextColor, 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '10px', 
                      borderBottom: '2px solid',
                      borderColor: tableHeaderBgColor,
                    }}
                  >
                    Num of Reviews
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: headerTextColor, 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '10px', 
                      borderBottom: '2px solid',
                      borderColor: tableHeaderBgColor,
                    }}
                  >
                    Quality
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: headerTextColor, 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '10px', 
                      borderBottom: '2px solid',
                      borderColor: tableHeaderBgColor,
                    }}
                  >
                    Layup
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCourses.map((course, index) => (
                  <TableRow
                    key={course.id}
                    component={Link}
                    to={`/departments/${department}/courses/${course.id}`}
                    sx={{
                      backgroundColor: index % 2 === 0 ? tableRowEvenBgColor : tableRowOddBgColor,
                      transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        backgroundColor: darkMode ? '#2a2a2a' : '#E9E9E9',
                        boxShadow: darkMode
                          ? '0 2px 6px rgba(255, 255, 255, 0.1)'
                          : '0 2px 6px rgba(0, 0, 0, 0.1)', 
                      },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit',
                      borderRadius: '6px',
                    }}
                  >
                    {/* Displaying Course Code */}
                    <TableCell 
                      sx={{ 
                        color: textColor, 
                        fontWeight: 600, 
                        padding: '10px', 
                        fontSize: '0.95rem', 
                        borderBottom: '1px solid',
                        borderColor: darkMode ? '#555555' : '#E0E0E0',
                        width: '15%', 
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {`${course.department}${course.course_number}`}
                    </TableCell>
        
                    {/* Displaying Course Name */}
                    <TableCell 
                      sx={{ 
                        color: textColor, 
                        padding: '10px 20px',
                        fontSize: '0.95rem', 
                        borderBottom: '1px solid',
                        borderColor: darkMode ? '#555555' : '#E0E0E0',
                        width: '50%'
                      }}
                    >
                      {course.name ? 
                        (course.name.includes(':') ? 
                          course.name.split(':')[1].trim() : 
                          course.name
                        ) : 
                        'Untitled Course'
                      }
                    </TableCell>
    
                    {/* Distribs */}
                    {!isMobile && (
                      <TableCell 
                        sx={{ 
                          color: textColor, 
                          padding: '10px', 
                          fontSize: '0.9rem', 
                          textAlign: 'center', 
                          borderBottom: '1px solid',
                          borderColor: darkMode ? '#555555' : '#E0E0E0',
                          verticalAlign: 'middle',
                          height: 'auto',
                        }}
                      >
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            gap: '5px', 
                            justifyContent: 'center', 
                            flexWrap: 'nowrap', 
                            maxWidth: '200px',  
                            whiteSpace: 'nowrap', 
                            alignItems: 'center',  
                            height: '100%',
                          }}
                        >
                          {(course.distribs ? course.distribs.split(',') : []).map((distrib, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                backgroundColor: darkMode ? '#444444' : '#F0F0F0',  
                                color: darkMode ? '#FFFFFF' : '#333333',             
                                padding: '4px 10px',       
                                borderRadius: '20px',      
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                boxShadow: darkMode 
                                  ? '0 1px 3px rgba(255, 255, 255, 0.1)' 
                                  : '0 2px 5px rgba(0, 0, 0, 0.1)', 
                                transition: 'background-color 0.2s ease',
                                lineHeight: '1.5',
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                  backgroundColor: darkMode ? '#555555' : '#E0E0E0', 
                                  boxShadow: darkMode 
                                    ? '0 2px 6px rgba(255, 255, 255, 0.15)' 
                                    : '0 3px 8px rgba(0, 0, 0, 0.15)',
                                },
                              }}
                            >
                              {distrib.trim()}
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                    )}
                    
                    {/* Num of Reviews */}
                    <TableCell 
                      sx={{ 
                        color: textColor, 
                        padding: isMobile ? '8px' : '10px', 
                        fontSize: '0.9rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid',
                        borderColor: darkMode ? '#555555' : '#E0E0E0',
                      }}
                    >
                      {course.numOfReviews}
                    </TableCell>
                    {/* Quality */}
                    <TableCell 
                      sx={{ 
                        color: textColor, 
                        padding: isMobile ? '8px' : '10px', 
                        fontSize: '0.9rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid',
                        borderColor: darkMode ? '#555555' : '#E0E0E0',
                      }}
                    >
                      {course.quality}
                    </TableCell>
                    {/* Layup */}
                    <TableCell 
                      sx={{ 
                        color: textColor, 
                        padding: isMobile ? '8px' : '10px', 
                        fontSize: '0.9rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid',
                        borderColor: darkMode ? '#555555' : '#E0E0E0',
                      }}
                    >
                      {course.layup}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No courses available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default DepartmentCoursesPage;