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
const CACHE_VERSION = 'v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_COURSES_TO_DISPLAY = 15; // Extracted constant for maintainability

const LayupsByTiming = ({darkMode}) => {
  const [timeSlotCourses, setTimeSlotCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("11"); // Changed initial value
  const isMobile = useMediaQuery('(max-width:600px)');
  const [courseIndex, setCourseIndex] = useState(null); // To store the course index for efficient lookups
  
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
  
  // Initialize course index only once
  useEffect(() => {
    const initializeCourseIndex = async () => {
      try {
        // Check if we have a cached index
        const cachedIndex = await localforage.getItem('course_index_cache');
        const cacheTimestamp = await localforage.getItem('course_index_timestamp');
        
        if (cachedIndex && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
          setCourseIndex(cachedIndex);
          return;
        }
        
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
        await localforage.setItem('course_index_cache', coursesIndex);
        await localforage.setItem('course_index_timestamp', Date.now());
      } catch (err) {
        console.error('Error initializing course index:', err);
      }
    };
    
    initializeCourseIndex();
  }, [normalizeCourseNumber]);

  // Add this after your state declarations
  useEffect(() => {
    // Fetch period 11 data when component mounts
    fetchCoursesByPeriod("11");
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

      // Check cache first
      const cacheKey = `${CACHE_KEY}_${periodCode}`;
      const cachedData = await localforage.getItem(cacheKey);
      const cacheTimestamp = await localforage.getItem(`${cacheKey}_timestamp`);
      const cacheVersion = await localforage.getItem(`${cacheKey}_version`);

      // Use cache if valid
      if (
        cachedData && 
        cacheTimestamp && 
        Date.now() - cacheTimestamp < CACHE_DURATION &&
        cacheVersion === CACHE_VERSION
      ) {
        if (updateLoadingState) {
          setTimeSlotCourses(cachedData);
          setLoading(false);
        }
        return;
      }

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

      const sortedCourses = springCourses
        .filter(course => course.layup > 0)
        .sort((a, b) => b.layup - a.layup)
        .slice(0, MAX_COURSES_TO_DISPLAY);

      // Cache the results
      try {
        await Promise.all([
          localforage.setItem(cacheKey, sortedCourses),
          localforage.setItem(`${cacheKey}_timestamp`, Date.now()),
          localforage.setItem(`${cacheKey}_version`, CACHE_VERSION)
        ]);
      } catch (cacheError) {
        console.warn('Cache write failed:', cacheError);
        // Non-critical error, continue without failing the main operation
      }

      if (updateLoadingState) {
        setTimeSlotCourses(sortedCourses);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      if (updateLoadingState) {
        setError('Failed to fetch courses.');
        setLoading(false);
      }
    }
  }, [courseIndex, normalizeCourseNumber, periodCodeToTiming]);

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