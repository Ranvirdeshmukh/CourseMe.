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
import { useMediaQuery } from '@mui/material';
import { getCoursesByPeriod } from '../services/courseDataService';

const LayupsByTiming = ({darkMode}) => {
  const [timeSlotCourses, setTimeSlotCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("11");
  const isMobile = useMediaQuery('(max-width:600px)');
  
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
  }), []);

  const fetchCoursesByPeriod = useCallback(async (periodCode, updateLoadingState = true) => {
    try {
      if (updateLoadingState) {
        setLoading(true);
        setError(null);
      }

      // Using the centralized data service instead of direct Firestore calls
      const data = await getCoursesByPeriod(periodCode, periodCodeToTiming);
      
      if (updateLoadingState) {
        setTimeSlotCourses(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      if (updateLoadingState) {
        setError('Failed to fetch courses. Please try again later.');
        setLoading(false);
      }
    }
  }, [periodCodeToTiming]);

  // Add this after your state declarations
  useEffect(() => {
    // Fetch period 11 data when component mounts
    fetchCoursesByPeriod("11");
  }, [fetchCoursesByPeriod]); 
  
  useEffect(() => {
    // Preload common periods
    const preloadPeriods = async () => {
      const commonPeriods = ['10', '2'];
      await Promise.all(
        commonPeriods.map(period => fetchCoursesByPeriod(period, false))
      );
    };
    
    preloadPeriods();
  }, [fetchCoursesByPeriod]);

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