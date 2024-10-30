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
const CACHE_VERSION = '1.0'; // Add version control to cache

// Utility functions for cache management
const getCacheKey = (department) => `${CACHE_PREFIX}${department}_${CACHE_VERSION}`;

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

const DepartmentCoursesPage = () => {
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
  const [qualityFilter, setQualityFilter] = useState([-100, 300]); // Range for Quality filter
  const [selectedWCDistribs, setSelectedWCDistribs] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState([]);
  const [showFilterTip, setShowFilterTip] = useState(false);
  

  // Popover state
  const [anchorEl, setAnchorEl] = useState(null);

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: '20px',
        fontFamily: 'SF Pro Display, sans-serif',
        
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
      color: '#34495E',
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
      aria-describedby={popoverId}
      onClick={handleFilterOpen} 
      sx={{
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        color: '#1c1c1e',
        borderRadius: '24px',
        padding: '10px 20px',
        fontWeight: '500',
        fontSize: '15px',
        fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
        textTransform: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: 'fit-content',
        minHeight: '40px',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.12)',
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
        }
      }}
    >
      Filter
      <svg 
        width="12" 
        height="12" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          marginLeft: '2px',
          transition: 'transform 0.2s ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
        }}
      >
        <path 
          d="M19 9l-7 7-7-7" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
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

        <Popover
  id={popoverId}
  open={open}
  anchorEl={anchorEl}
  onClose={handleFilterClose}
  anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'right',
  }}
  sx={{
    '.MuiPaper-root': {
      backgroundColor: '#ffffff', // White background
      borderRadius: '8px', // Smaller rounded corners
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)', // Even lighter shadow
      padding: '8px', // Reduced padding for compactness
      transition: 'all 0.2s ease-in-out',
      width: '180px', // Smaller width for a compact look
    },
  }}
>
  <Box sx={{ padding: '8px' }}>
    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Sort
    </Typography>
    <FormControl component="fieldset" sx={{ marginBottom: '8px' }}>
      <RadioGroup
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        sx={{
          '& .MuiFormControlLabel-root': {
            marginBottom: '6px', // Reduced spacing
          },
          '& .MuiTypography-root': {
            fontSize: '12px', // Smaller font for a more compact feel
          },
        }}
      >
        <FormControlLabel value="level" control={<Radio />} label="Level (low to high)" />
        <FormControlLabel value="alphabetical" control={<Radio />} label="Alphabetical" />
        <FormControlLabel value="layup" control={<Radio />} label="Layup votes (high to low)" />
      </RadioGroup>
    </FormControl>

    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Layup Votes
    </Typography>
    <Slider
      value={layupVotes}
      onChange={handleLayupVotesChange}
      valueLabelDisplay="auto"
      min={-300}
      max={300}
      sx={{
        marginBottom: '10px',
        '& .MuiSlider-thumb': {
          backgroundColor: '#571CE0',
          width: '10px', // Smaller thumb
          height: '10px',
        },
        '& .MuiSlider-track': {
          backgroundColor: '#571CE0',
          height: '3px',
        },
      }}
    />

    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Quality
    </Typography>
    <Slider
      value={qualityFilter}
      onChange={handleQualityFilterChange}
      valueLabelDisplay="auto"
      min={0}
      max={50}
      sx={{
        marginBottom: '10px',
        '& .MuiSlider-thumb': {
          backgroundColor: '#571CE0',
          width: '10px',
          height: '10px',
        },
        '& .MuiSlider-track': {
          backgroundColor: '#571CE0',
          height: '3px',
        },
      }}
    />

<Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
    Terms Offered
  </Typography>
  <FormGroup sx={{ marginBottom: '16px' }}>
    <FormControlLabel
      control={
        <Checkbox 
          checked={selectedTerms.includes('25W')} 
          onChange={handleTermsChange} 
          value="25W" 
          sx={{
            color: '#571CE0',
            padding: '4px',
          }}
        />
      }
      label="25W"
      sx={{
        marginBottom: '6px',
        '& .MuiTypography-root': {
          fontSize: '12px',
        },
      }}
    />
  </FormGroup>
    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Culture Requirement
    </Typography>
    <FormGroup sx={{ marginBottom: '16px' }}>
      {worldCultureOptions.map((distrib) => (
        <FormControlLabel
          key={distrib.value}
          control={
            <Checkbox 
              checked={selectedWCDistribs.includes(distrib.value)} 
              onChange={handleWCDistribsChange} 
              value={distrib.value} 
              sx={{
                color: '#571CE0',
                padding: '4px',
              }}
            />
          }
          label={distrib.label}
          sx={{
            marginBottom: '6px',
            '& .MuiTypography-root': {
              fontSize: '12px',
            },
          }}
        />
      ))}
    </FormGroup>

    {/* Regular Distribs section */}
    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Distribs
    </Typography>
    <FormGroup sx={{ marginBottom: '10px' }}>
      {distribOptions.map((distrib) => (
        <FormControlLabel
          key={distrib.value}
          control={
            <Checkbox 
              checked={selectedDistribs.includes(distrib.value)} 
              onChange={handleDistribsChange} 
              value={distrib.value} 
              sx={{
                color: '#571CE0',
                padding: '4px',
              }}
            />
          }
          label={distrib.label}
          sx={{
            marginBottom: '6px',
            '& .MuiTypography-root': {
              fontSize: '12px',
            },
          }}
        />
      ))}
    </FormGroup>

    <FormControlLabel
      control={
        <Checkbox 
          checked={withReviewsOnly} 
          onChange={(e) => setWithReviewsOnly(e.target.checked)} 
          sx={{
            color: '#571CE0',
            padding: '4px', // Reduced padding around checkbox
          }}
        />
      }
      label="With reviews only"
      sx={{
        '& .MuiTypography-root': {
          fontSize: '12px', // Smaller font size
        },
      }}
    />
  </Box>
</Popover>


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
              backgroundColor: '#FFFFFF', 
              borderRadius: '10px', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
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
                      color: 'black', 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '12px 10px',
                      borderBottom: '2px solid #E0E0E0',
                      width: '15%', 
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Course Code
                  </TableCell>
                  
                  <TableCell 
                    sx={{ 
                      color: 'black', 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '12px 20px',
                      borderBottom: '2px solid #E0E0E0',
                      width: '50%' 
                    }}
                  >
                    Course Name
                  </TableCell>

                  {!isMobile && (
                    <TableCell 
                      sx={{ 
                        color: 'black', 
                        textAlign: 'center', 
                        fontWeight: 600, 
                        fontSize: '1rem', 
                        padding: '10px', 
                        borderBottom: '2px solid #E0E0E0' 
                      }}
                    >
                      Distribs
                    </TableCell>
                  )}
                  <TableCell 
                    sx={{ 
                      color: 'black', 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '10px', 
                      borderBottom: '2px solid #E0E0E0' 
                    }}
                  >
                    Num of Reviews
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: 'black', 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '10px', 
                      borderBottom: '2px solid #E0E0E0' 
                    }}
                  >
                    Quality
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      color: 'black', 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      fontSize: '1rem', 
                      padding: '10px', 
                      borderBottom: '2px solid #E0E0E0' 
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
                      backgroundColor: index % 2 === 0 ? '#F8F8F8' : '#FFFFFF',
                      transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#E9E9E9',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)', 
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
                        color: '#000', 
                        fontWeight: 600, 
                        padding: '10px', 
                        fontSize: '0.95rem', 
                        borderBottom: '1px solid #E0E0E0',
                        width: '15%', 
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {`${course.department}${course.course_number}`}
                    </TableCell>
        
                    {/* Displaying Course Name */}
                    <TableCell 
  sx={{ 
    color: '#333', 
    padding: '10px 20px',
    fontSize: '0.95rem', 
    borderBottom: '1px solid #E0E0E0',
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

{/* Also add a safety check for the distribs array mapping */}
{!isMobile && (
  <TableCell 
    sx={{ 
      color: '#333', 
      padding: '10px', 
      fontSize: '0.9rem', 
      textAlign: 'center', 
      borderBottom: '1px solid #E0E0E0',
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
            backgroundColor: '#F0F0F0',  
            color: '#333',             
            padding: '4px 10px',       
            borderRadius: '20px',      
            fontSize: '0.85rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', 
            transition: 'background-color 0.2s ease',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: '#E0E0E0', 
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
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
                        color: '#333', 
                        padding: isMobile ? '8px' : '10px', 
                        fontSize: '0.9rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #E0E0E0' 
                      }}
                    >
                      {course.numOfReviews}
                    </TableCell>
                    {/* Quality */}
                    <TableCell 
                      sx={{ 
                        color: '#333', 
                        padding: isMobile ? '8px' : '10px', 
                        fontSize: '0.9rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #E0E0E0' 
                      }}
                    >
                      {course.quality}
                    </TableCell>
                    {/* Layup */}
                    <TableCell 
                      sx={{ 
                        color: '#333', 
                        padding: isMobile ? '8px' : '10px', 
                        fontSize: '0.9rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #E0E0E0' 
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
