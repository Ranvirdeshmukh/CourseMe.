import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useMediaQuery } from '@mui/material';
import localforage from 'localforage';

// Add these constants at the top
const CACHE_KEY = 'winter_layups_cache';
const CACHE_VERSION = 'v2'; // Increment version when data structure changes
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for full cache expiry
const CACHE_REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour threshold for background refresh
const MAX_COURSES_TO_DISPLAY = 15; // Extracted constant for maintainability
const MAX_RETRY_ATTEMPTS = 3; // Maximum cache operation retry attempts

const LayupsByTiming = ({darkMode}) => {
  const [timeSlotCourses, setTimeSlotCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("11"); // Changed initial value
  const isMobile = useMediaQuery('(max-width:600px)');
  const [courseIndex, setCourseIndex] = useState(null); // To store the course index for efficient lookups
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false); // Track background refreshes
  
  // Moved this to useMemo to prevent recreation on every render
  const periodCodeToTiming = useMemo(() => ({
    "11": "MWF 11:30-12:35, Tu 12:15-1:05",
    "10": "MWF 10:10-11:15, Th 12:15-1:05",
    "2": "MWF 2:10-3:15, Th 1:20-2:10",
    "3A": "MW 3:30-5:20, M 5:30-6:20",
    "12": "MWF 12:50-1:55, Tu 1:20-2:10",
    "2A": "TuTh 2:25-4:15, W 5:30-6:20",
    "10A": "TuTh 10:10-12, F 3:30-4:20",
    "9L": "MWF 8:50-9:55, Th 9:05-9:55",
    "9S": "MTuWThF 9:05-9:55",
    "6A": "MTh 6:30-8:20, Tu 6:30-7:20",
    "6B": "W 6:30-9:30, Tu 7:30-8:20",
    "8S": "MTThF 7:45-8:35, Wed 7:45-8:35",
  }), []); // Empty dependency array as this shouldn't change
  
  // Cache operation helper functions
  const cacheRead = useCallback(async (key, defaultValue = null) => {
    let attempts = 0;
    while (attempts < MAX_RETRY_ATTEMPTS) {
      try {
        const value = await localforage.getItem(key);
        return value !== null ? value : defaultValue;
      } catch (err) {
        attempts++;
        if (attempts >= MAX_RETRY_ATTEMPTS) {
          console.error(`Cache read failed after ${MAX_RETRY_ATTEMPTS} attempts:`, err);
          return defaultValue;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
      }
    }
    return defaultValue;
  }, []);

  const cacheWrite = useCallback(async (key, value) => {
    let attempts = 0;
    while (attempts < MAX_RETRY_ATTEMPTS) {
      try {
        await localforage.setItem(key, value);
        return true;
      } catch (err) {
        attempts++;
        if (attempts >= MAX_RETRY_ATTEMPTS) {
          console.error(`Cache write failed after ${MAX_RETRY_ATTEMPTS} attempts:`, err);
          return false;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
      }
    }
    return false;
  }, []);

  // Helper function to normalize course numbers
  const normalizeCourseNumber = useCallback((number) => {
    if (typeof number === 'string' && number.includes('.')) {
      const [integerPart, decimalPart] = number.split('.');
      return `${integerPart.padStart(3, '0')}.${decimalPart}`;
    }
    return typeof number === 'string' ? number.padStart(3, '0') : String(number).padStart(3, '0');
  }, []);

  // Helper function to generate course ID
  const generateCourseId = useCallback((dept, courseNum) => {
    // Format: DEPT_DEPTXXX_Title
    return `${dept}_${dept}${normalizeCourseNumber(courseNum)}`;
  }, [normalizeCourseNumber]);

  // Check if cache needs background refresh
  const shouldRefreshCache = useCallback((timestamp) => {
    if (!timestamp) return true;
    const age = Date.now() - timestamp;
    return age > CACHE_REFRESH_THRESHOLD;
  }, []);
  
  // Initialize course index only once
  useEffect(() => {
    const initializeCourseIndex = async () => {
      try {
        // Check if we have a cached index
        const cachedIndex = await cacheRead('course_index_cache');
        const cacheTimestamp = await cacheRead('course_index_timestamp', 0);
        const cacheVersion = await cacheRead('course_index_version', '');
        
        // Use valid cache but refresh in background if stale
        if (cachedIndex && cacheVersion === CACHE_VERSION && Date.now() - cacheTimestamp < CACHE_DURATION) {
          setCourseIndex(cachedIndex);
          
          // If cache is older than refresh threshold, refresh in background
          if (shouldRefreshCache(cacheTimestamp)) {
            refreshCourseIndexInBackground(cachedIndex);
          }
          return;
        }
        
        await fetchAndCacheCourseIndex();
      } catch (err) {
        console.error('Error initializing course index:', err);
        // Try to recover with a fresh fetch if cache fails
        await fetchAndCacheCourseIndex();
      }
    };
    
    initializeCourseIndex();
  }, [normalizeCourseNumber, cacheRead, cacheWrite, shouldRefreshCache]);

  // Function to fetch course index and cache it
  const fetchAndCacheCourseIndex = useCallback(async () => {
    try {
      const coursesIndex = new Map();
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      coursesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.department && data.course_number) {
          const key = `${data.department}_${normalizeCourseNumber(data.course_number)}`;
          coursesIndex.set(key, {
            layup: data.layup || 0,
            id: doc.id,
            name: data.name || '',
            numOfReviews: data.numOfReviews || 0,
          });
        }
      });
      
      // Save to state and cache
      setCourseIndex(coursesIndex);
      await Promise.all([
        cacheWrite('course_index_cache', coursesIndex),
        cacheWrite('course_index_timestamp', Date.now()),
        cacheWrite('course_index_version', CACHE_VERSION)
      ]);
      return coursesIndex;
    } catch (err) {
      console.error('Error fetching course index:', err);
      throw err;
    }
  }, [normalizeCourseNumber, cacheWrite]);

  // Background refresh of course index
  const refreshCourseIndexInBackground = useCallback(async (existingIndex) => {
    try {
      // Only refresh if we're not already doing so
      if (isBackgroundRefreshing) return;
      
      setIsBackgroundRefreshing(true);
      const updatedIndex = await fetchAndCacheCourseIndex();
      setIsBackgroundRefreshing(false);
      
      // If the data has changed significantly, we might want to trigger a UI update
      if (updatedIndex && updatedIndex.size !== existingIndex.size) {
        // Optionally refetch current period to reflect latest data
        fetchCoursesByPeriod(selectedPeriod, false);
      }
    } catch (err) {
      setIsBackgroundRefreshing(false);
      console.error('Background refresh failed:', err);
      // Non-critical error, we can continue with cached data
    }
  }, [fetchAndCacheCourseIndex, isBackgroundRefreshing, selectedPeriod]);

  // Add this after your state declarations
  useEffect(() => {
    // Fetch period 11 data when component mounts
    if (courseIndex) {
      fetchCoursesByPeriod("11");
    }
  }, [courseIndex]); // Depends on courseIndex being loaded
  
  useEffect(() => {
    // Preload common periods
    const preloadPeriods = async () => {
      if (!courseIndex) return; // Wait for course index to be ready
      
      const commonPeriods = ['10', '2'];
      await Promise.all(
        commonPeriods.map(period => fetchCoursesByPeriod(period, false)) // false = don't set loading state for preloads
      );
    };
    
    preloadPeriods();
  }, [courseIndex]);

  const fetchCoursesByPeriod = useCallback(async (periodCode, updateLoadingState = true) => {
    // Skip if course index isn't loaded yet
    if (!courseIndex) return;
    
    try {
      if (updateLoadingState) {
        setLoading(true);
        setError(null);
      }

      // Generate cache keys
      const cacheKey = `${CACHE_KEY}_${periodCode}`;
      const timestampKey = `${cacheKey}_timestamp`;
      const versionKey = `${cacheKey}_version`;
      
      // Check cache first
      const cachedData = await cacheRead(cacheKey);
      const cacheTimestamp = await cacheRead(timestampKey, 0);
      const cacheVersion = await cacheRead(versionKey, '');

      // Use cache if valid and not expired
      const isCacheValid = cachedData && 
                           cacheVersion === CACHE_VERSION && 
                           Date.now() - cacheTimestamp < CACHE_DURATION;
                           
      if (isCacheValid) {
        if (updateLoadingState) {
          setTimeSlotCourses(cachedData);
          setLoading(false);
        }
        
        // If cache is stale but not expired, refresh in background
        if (shouldRefreshCache(cacheTimestamp)) {
          refreshDataInBackground(periodCode, cacheKey, timestampKey, versionKey);
        }
        return;
      }

      // Cache miss or invalid - fetch fresh data
      const data = await fetchPeriodCoursesFromFirestore(periodCode);
      
      // Cache the results
      await Promise.all([
        cacheWrite(cacheKey, data),
        cacheWrite(timestampKey, Date.now()),
        cacheWrite(versionKey, CACHE_VERSION)
      ]);

      if (updateLoadingState) {
        setTimeSlotCourses(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      // Try to recover from cache in case of network failure
      try {
        const fallbackData = await cacheRead(`${CACHE_KEY}_${periodCode}`);
        if (fallbackData && updateLoadingState) {
          console.log('Recovered data from cache after fetch failure');
          setTimeSlotCourses(fallbackData);
          setLoading(false);
          // Show a softer error message instead of complete failure
          setError('Using cached data. Latest data could not be loaded.');
          return;
        }
      } catch (cacheError) {
        console.error('Cache recovery also failed:', cacheError);
      }
      
      if (updateLoadingState) {
        setError('Failed to fetch courses. Please try again later.');
        setLoading(false);
      }
    }
  }, [courseIndex, normalizeCourseNumber, periodCodeToTiming, cacheRead, cacheWrite, shouldRefreshCache]);

  // Extract the Firestore query logic
  const fetchPeriodCoursesFromFirestore = useCallback(async (periodCode) => {
    // Fetch spring timetable data with limit to improve performance
    const springQuery = query(
      collection(db, 'springTimetable'),
      where('Period Code', '==', periodCode),
      limit(100) // Add reasonable limit to query
    );
    const springSnapshot = await getDocs(springQuery);
    
    // Process data efficiently
    const springCourses = springSnapshot.docs.map(doc => {
      const data = doc.data();
      const lookupKey = `${data.Subj}_${normalizeCourseNumber(data.Num)}`;
      const courseInfo = courseIndex.get(lookupKey) || { 
        layup: 0, 
        id: null,
        name: '',
        numOfReviews: 0
      };

      return {
        id: doc.id,
        subj: data.Subj,
        num: data.Num,
        title: data.Title,
        section: data.Section,
        period: data['Period Code'],
        instructor: data.Instructor,
        timing: periodCodeToTiming[data['Period Code']] || 'Unknown Timing',
        layup: courseInfo.layup,
        courseId: courseInfo.id,
        numOfReviews: courseInfo.numOfReviews
      };
    });

    return springCourses
      .filter(course => course.layup > 0)
      .sort((a, b) => b.layup - a.layup)
      .slice(0, MAX_COURSES_TO_DISPLAY);
  }, [courseIndex, normalizeCourseNumber, periodCodeToTiming]);

  // Background refresh without disrupting UI
  const refreshDataInBackground = useCallback(async (periodCode, cacheKey, timestampKey, versionKey) => {
    try {
      console.log(`Background refreshing data for period ${periodCode}`);
      const freshData = await fetchPeriodCoursesFromFirestore(periodCode);
      
      // Update cache silently
      await Promise.all([
        cacheWrite(cacheKey, freshData),
        cacheWrite(timestampKey, Date.now()),
        cacheWrite(versionKey, CACHE_VERSION)
      ]);
      
      // If this is the currently displayed period, update the UI
      if (selectedPeriod === periodCode) {
        setTimeSlotCourses(freshData);
      }
    } catch (err) {
      console.error('Background refresh failed:', err);
      // Non-critical error, can continue with cached data
    }
  }, [fetchPeriodCoursesFromFirestore, cacheWrite, selectedPeriod]);

  const handlePeriodChange = useCallback((event) => {
    const period = event.target.value;
    setSelectedPeriod(period);
    if (period) {
      fetchCoursesByPeriod(period);
    } else {
      setTimeSlotCourses([]);
    }
  }, [fetchCoursesByPeriod]);

  return (
    <>
      {/* <Typography
        variant="h4"
        align="left"
        gutterBottom
        sx={{
          fontWeight: 600,
          marginBottom: '25px',
          color: '#34495E',
          padding: '8px 16px',
          backgroundColor: '#F0F4FF',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #00693E',
          fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
          fontFamily: 'SF Pro Display, sans-serif',
        }}
      >
        Winter 2025 Layups by Period
      </Typography> */}

<Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
  <FormControl sx={{ minWidth: 200 }}>
    <InputLabel
      id="period-label"
      sx={{ color: darkMode ? '#fff' : '#00693E' }}
    >
      Period
    </InputLabel>
    <Select
      labelId="period-label"
      value={selectedPeriod}
      label="Period"
      onChange={handlePeriodChange}
      sx={{
        height: '48px',
        backgroundColor: darkMode ? '#1C1F43' : '#F0F4FF',
        borderRadius: '8px',
        color: darkMode ? '#fff' : '#333',
        '&:hover': { backgroundColor: darkMode ? '#24273c' : '#E0E7FF' },
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {Object.entries(periodCodeToTiming).map(([code, timing]) => (
        <MenuItem
          key={code}
          value={code}
          sx={{
            backgroundColor: darkMode ? '#1C1F43' : undefined,
            color: darkMode ? '#fff' : undefined,
          }}
        >
          {`Period ${code} (${timing})`}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Box>


      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress sx={{ color: '#00693E' }} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : timeSlotCourses.length > 0 ? (
        <TableContainer
  component={Paper}
  sx={{
    backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
    borderRadius: '10px',
    boxShadow: darkMode
      ? '0 2px 8px rgba(255, 255, 255, 0.1)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '10px',
    overflowX: 'auto',
    flex: '3',
    transition: 'background-color 0.3s ease',
  }}
>
  <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
    <TableHead>
      <TableRow>
        <TableCell
          sx={{
            color: darkMode ? '#fff' : 'black',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '12px 10px',
            borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
            width: '5%',
            whiteSpace: 'nowrap',
          }}
        >
          #
        </TableCell>
        <TableCell
          sx={{
            color: darkMode ? '#A5A5FF' : 'black',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '12px 20px',
            borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
            width: '15%', // Changed from 50% to 15%
          }}
        >
          Course
        </TableCell>
        <TableCell
          sx={{
            color: darkMode ? '#fff' : 'black',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '12px 20px',
            borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
            width: '40%', // Added width specification
          }}
        >
          Title
        </TableCell>
        <TableCell
          sx={{
            color: darkMode ? '#fff' : 'black',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '12px 20px',
            borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
            width: '25%', // Added width specification
          }}
        >
          Professor
        </TableCell>
        <TableCell
          sx={{
            color: darkMode ? '#fff' : 'black',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '10px',
            borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
            width: '15%', // Added width specification
          }}
        >
          Layup Score
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {timeSlotCourses.map((course, index) => (
        <TableRow
          key={course.id}
          component={Link}
          to={`/departments/${course.subj}/courses/${course.courseId}`}
          sx={{
            backgroundColor:
              index % 2 === 0
                ? darkMode
                  ? '#1C1F43'
                  : '#F8F8F8'
                : darkMode
                ? '#24273c'
                : '#FFFFFF',
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
          <TableCell
            sx={{
              color: darkMode ? '#fff' : '#000',
              fontWeight: 600,
              padding: '10px',
              fontSize: '0.95rem',
              borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
              width: '5%',
              whiteSpace: 'nowrap',
            }}
          >
            {index + 1}
          </TableCell>
          <TableCell
            sx={{
              color: darkMode ? '#A5A5FF' : '#571ce0',
              padding: '10px 20px',
              fontSize: '0.95rem',
              borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
              fontWeight: 500,
              width: '15%',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {`${course.subj} ${course.num}`}
          </TableCell>
          <TableCell
            sx={{
              color: darkMode ? '#ccc' : '#333',
              padding: '10px 20px',
              fontSize: '0.95rem',
              borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
              width: '40%',
            }}
          >
            {course.title}
          </TableCell>
          <TableCell
            sx={{
              color: darkMode ? '#ccc' : '#333',
              padding: '10px 20px',
              fontSize: '0.95rem',
              borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
              width: '25%',
            }}
          >
            {course.instructor}
          </TableCell>
          <TableCell
            sx={{
              color:
                course.layup >= 4
                  ? '#34C759'
                  : course.layup >= 3
                  ? '#007AFF'
                  : '#FF3B30',
              padding: isMobile ? '8px' : '10px',
              fontSize: '0.95rem',
              textAlign: 'center',
              borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
              fontWeight: 500,
              width: '15%',
            }}
          >
            {course.layup.toFixed(2)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

      ) : (
        <Typography sx={{ color: '#333', fontFamily: 'SF Pro Display, sans-serif' }}>
          Select a period to see the biggest layups in that time slot
        </Typography>
      )}
    </>
  );
};

export default LayupsByTiming;