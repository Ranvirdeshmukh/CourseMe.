import React, { useState, useCallback, useEffect } from 'react';
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
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useMediaQuery } from '@mui/material';
import localforage from 'localforage';

// Add these constants at the top
const CACHE_KEY = 'winter_layups_cache';
const CACHE_VERSION = 'v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const LayupsByTiming = () => {
  const [timeSlotCourses, setTimeSlotCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("11"); // Changed initial value
  const isMobile = useMediaQuery('(max-width:600px)');
  const periodCodeToTiming = {
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
  };
  

  // Helper function to normalize course numbers
  const normalizeCourseNumber = (number) => {
    if (typeof number === 'string' && number.includes('.')) {
      const [integerPart, decimalPart] = number.split('.');
      return `${integerPart.padStart(3, '0')}.${decimalPart}`;
    }
    return typeof number === 'string' ? number.padStart(3, '0') : String(number).padStart(3, '0');
  };

  // Helper function to generate course ID
  const generateCourseId = (dept, courseNum) => {
    // Format: DEPT_DEPTXXX_Title
    return `${dept}_${dept}${normalizeCourseNumber(courseNum)}`;
  };
  // Add this after your state declarations
useEffect(() => {
  // Fetch period 11 data when component mounts
  fetchCoursesByPeriod("11");
}, []); // Empty dependency array means this runs once on mount
useEffect(() => {
  // Preload common periods
  const preloadPeriods = async () => {
    const commonPeriods = [ '10', '2'];
    await Promise.all(
      commonPeriods.map(period => fetchCoursesByPeriod(period))
    );
  };
  
  preloadPeriods();
}, []);

const fetchCoursesByPeriod = useCallback(async (periodCode) => {
  try {
    setLoading(true);
    setError(null);

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
      setTimeSlotCourses(cachedData);
      setLoading(false);
      return;
    }

    // Create indexes for faster lookups
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

    // Fetch winter timetable data
    const winterQuery = query(
      collection(db, 'winterTimetable'),
      where('Period Code', '==', periodCode)
    );
    const winterSnapshot = await getDocs(winterQuery);
    
    // Process data in batches
    const batchSize = 50;
    const winterCourses = [];
    
    for (let i = 0; i < winterSnapshot.docs.length; i += batchSize) {
      const batch = winterSnapshot.docs.slice(i, i + batchSize);
      const batchResults = batch.map(doc => {
        const data = doc.data();
        const lookupKey = `${data.Subj}_${normalizeCourseNumber(data.Num)}`;
        const courseInfo = coursesIndex.get(lookupKey) || { 
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
      winterCourses.push(...batchResults);
    }

    // Filter and sort
    const sortedCourses = winterCourses
      .filter(course => course.layup > 0)
      .sort((a, b) => b.layup - a.layup)
      .slice(0, 15);

    // Cache the results
    await Promise.all([
      localforage.setItem(cacheKey, sortedCourses),
      localforage.setItem(`${cacheKey}_timestamp`, Date.now()),
      localforage.setItem(`${cacheKey}_version`, CACHE_VERSION)
    ]);

    setTimeSlotCourses(sortedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    setError('Failed to fetch courses.');
  } finally {
    setLoading(false);
  }
}, []);

  const handlePeriodChange = (event) => {
    const period = event.target.value;
    setSelectedPeriod(period);
    if (period) {
      fetchCoursesByPeriod(period);
    } else {
      setTimeSlotCourses([]);
    }
  };

  

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
          <InputLabel id="period-label" sx={{ color: '#00693E' }}>
            Period
          </InputLabel>
          <Select
            labelId="period-label"
            value={selectedPeriod}
            label="Period"
            onChange={handlePeriodChange}
            sx={{
              height: '48px',
              backgroundColor: '#F0F4FF',
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#E0E7FF' },
              transition: 'background-color 0.3s ease',
            }}
          >
            {/* <MenuItem value="">
              <em>Select Period</em>
            </MenuItem> */}
            {Object.entries(periodCodeToTiming).map(([code, timing]) => (
              <MenuItem key={code} value={code}>
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
    width: '5%', 
    whiteSpace: 'nowrap'
  }}
>
  #
</TableCell>
<TableCell 
  sx={{ 
    color: 'black', 
    textAlign: 'left', 
    fontWeight: 600, 
    fontSize: '1rem', 
    padding: '12px 20px',
    borderBottom: '2px solid #E0E0E0',
    width: '15%' // Changed from 50% to 15%
  }}
>
  Course
</TableCell>
<TableCell 
  sx={{ 
    color: 'black', 
    textAlign: 'left', 
    fontWeight: 600, 
    fontSize: '1rem', 
    padding: '12px 20px',
    borderBottom: '2px solid #E0E0E0',
    width: '40%' // Added width specification
  }}
>
  Title
</TableCell>
<TableCell 
  sx={{ 
    color: 'black', 
    textAlign: 'left', 
    fontWeight: 600, 
    fontSize: '1rem', 
    padding: '12px 20px',
    borderBottom: '2px solid #E0E0E0',
    width: '25%' // Added width specification
  }}
>
  Professor
</TableCell>
<TableCell 
  sx={{ 
    color: 'black', 
    textAlign: 'center', 
    fontWeight: 600, 
    fontSize: '1rem', 
    padding: '10px', 
    borderBottom: '2px solid #E0E0E0',
    width: '15%' // Added width specification
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
<TableCell 
  sx={{ 
    color: '#000', 
    fontWeight: 600, 
    padding: '10px', 
    fontSize: '0.95rem', 
    borderBottom: '1px solid #E0E0E0',
    width: '5%', 
    whiteSpace: 'nowrap'
  }}
>
  {index + 1}
</TableCell>
<TableCell 
  sx={{ 
    color: '#571ce0', 
    padding: '10px 20px',
    fontSize: '0.95rem', 
    borderBottom: '1px solid #E0E0E0',
    fontWeight: 500,
    width: '15%',
    '&:hover': {
      textDecoration: 'underline',
    }
  }}
>
  {`${course.subj} ${course.num}`}
</TableCell>
<TableCell 
  sx={{ 
    color: '#333', 
    padding: '10px 20px',
    fontSize: '0.95rem', 
    borderBottom: '1px solid #E0E0E0',
    width: '40%'
  }}
>
  {course.title}
</TableCell>
<TableCell 
  sx={{ 
    color: '#333', 
    padding: '10px 20px',
    fontSize: '0.95rem', 
    borderBottom: '1px solid #E0E0E0',
    width: '25%'
  }}
>
  {course.instructor}
</TableCell>
<TableCell 
  sx={{ 
    color: course.layup >= 4 ? '#34C759' : course.layup >= 3 ? '#007AFF' : '#FF3B30',
    padding: isMobile ? '8px' : '10px', 
    fontSize: '0.95rem', 
    textAlign: 'center', 
    borderBottom: '1px solid #E0E0E0',
    fontWeight: 500,
    width: '15%'
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