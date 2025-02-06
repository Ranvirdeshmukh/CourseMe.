import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate} from 'react-router-dom';
import {
  Container, Typography, Box, Table, TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Paper,
  CircularProgress,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Fab,
  KeyboardArrowUpIcon,
  Button,
   CardActions, Skeleton, 
} from '@mui/material';
import { collection, query, orderBy, getDocs, where, limit,startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import HiddenLayups from './HiddenLayups';
import LayupsByTiming from './LayupsByTiming';
import useInfiniteScroll from '../constants/useInfiniteScroll'; // Adjust path if needed


import useHorizontalInfiniteScroll from '../constants/useHorizontalInfiniteScroll';
// Adjust the path to match your actual file structure


// Add this constant at the top of your file, outside the component
const CACHE_VERSION = '2.0'; // Increment this when you push updates

const LayupsPage = ({darkMode}) => {
  const [courses, setCourses] = useState([]);
  const [departmentCourses, setDepartmentCourses] = useState([]);
  const [distribCourses, setDistribCourses] = useState([]); // State for distribs courses
  const [departments, setDepartments] = useState([]);
  const [distribs, setDistribs] = useState([]); // State for unique distribs
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDistrib, setSelectedDistrib] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [distribLoading, setDistribLoading] = useState(false); // Loading state for distrib courses
  const isMobile = useMediaQuery('(max-width:600px)');
  const initialPageSize = 30;
  const [lastVisible, setLastVisible] = useState(null); // Keep track of the last document
  const [hasMore, setHasMore] = useState(true); // Track if there are more courses to load
  const [expandedBox, setExpandedBox] = useState(null); // 'left' or 'right' or null
  const [pageLoading, setPageLoading] = useState(true);
  const [initialCourses, setInitialCourses] = useState([]);
  const { scrollContainerRef, clonedItems } = useHorizontalInfiniteScroll(courses);


  // ─── DARK MODE COLOR VARIABLES ───────────────────────────────────────────────
  const mainBgColor = darkMode
    ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
    : '#F9F9F9';
  const paperBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
  const tableHeaderBgColor = darkMode ? '#333333' : '#f0f0f0';
  const tableRowEvenBgColor = darkMode ? '#1C1F43' : '#F8F8F8';
  const tableRowOddBgColor = darkMode ? '#24273c' : '#FFFFFF';
  const textColor = darkMode ? '#FFFFFF' : '#333333';
  const headerTextColor = darkMode ? '#FFFFFF' : '#571CE0';
  const noteBgColor = darkMode ? '#333333' : '#E0E7FF';
  const liveIndicatorBg = darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)';
  const selectBgColor = darkMode ? '#0C0F33' : '#F0F4FF';
  const selectHoverBgColor = darkMode ? '#0A0E27' : '#E0E7FF';
  const tableBorderColor = darkMode ? '#444444' : '#E0E0E0';
  const headerCardBg = darkMode ? '#2C2C2C' : '#F0F4FF';


  const fetchMoreCourses = useCallback(async () => {
    if (!hasMore) return; // No more courses to fetch
    
    try {
      let q;
      if (lastVisible) {
        q = query(
          collection(db, 'courses'),
          orderBy('layup', 'desc'),
          orderBy('name', 'asc'),
          orderBy('__name__', 'asc'),
          startAfter(lastVisible),
          limit(15)
        );
      } else {
        q = query(
          collection(db, 'courses'),
          orderBy('layup', 'desc'),
          orderBy('name', 'asc'),
          orderBy('__name__', 'asc'),
          limit(15)
        );
      }
    
      const snapshot = await getDocs(q);
    
      if (snapshot.empty) {
        // If no new courses are returned, reset courses to the initial 15
        setCourses(initialCourses);
        // Optionally, reset the scroll position:
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = 0;
        }
        return;
      }
      
      const newCourses = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        department: doc.data().department,
        distribs: doc.data().distribs,
        numOfReviews: doc.data().numOfReviews,
        layup: doc.data().layup,
      }));
    
      // Append new courses (if available)
      setCourses((prev) => [...prev, ...newCourses]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } catch (err) {
      console.error('Error fetching more courses:', err);
      setError('Failed to fetch more courses.');
    }
  }, [hasMore, lastVisible, db, initialCourses]);
  
  
  
// Now pass fetchMoreCourses to the infinite scroll hook
// const { scrollContainerRef } = useInfiniteScroll(fetchMoreCourses);

// 2. Modify fetchAndCacheCourses so that the querySnapshot is handled correctly:
const fetchAndCacheCourses = useCallback(async () => {
  try {
    const cachedData = JSON.parse(localStorage.getItem('topCoursesCache'));
    const now = new Date().getTime();

    // Check both timestamp and version
    if (
      cachedData &&
      cachedData.version === CACHE_VERSION &&
      now - cachedData.timestamp < 24 * 60 * 60 * 1000
    ) {
      setCourses(cachedData.courses);
      setInitialCourses(cachedData.courses);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'courses'),
      orderBy('layup', 'desc'),
      orderBy('name', 'asc'),
      orderBy('__name__', 'asc'),
      limit(initialPageSize)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }

    const coursesData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      department: doc.data().department,
      distribs: doc.data().distribs,
      numOfReviews: doc.data().numOfReviews,
      layup: doc.data().layup,
    }));

    console.log('Fetched courses data:', coursesData);

    const uniqueCoursesSet = new Set();
    const uniqueCourses = [];

    coursesData.forEach((course) => {
      const normalizedCourseName = course.name.trim().toLowerCase();
      if (!uniqueCoursesSet.has(normalizedCourseName) && uniqueCourses.length < 15) {
        uniqueCoursesSet.add(normalizedCourseName);
        uniqueCourses.push(course);
      } else {
        console.log('Duplicate found or limit reached:', normalizedCourseName);
      }
    });

    console.log('Unique courses:', uniqueCourses);

    // Store version with cache
    localStorage.setItem('topCoursesCache', JSON.stringify({
      courses: uniqueCourses,
      timestamp: now,
      version: CACHE_VERSION
    }));

    setCourses(uniqueCourses);
    setInitialCourses(uniqueCourses);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching courses:', error);
    setError('Failed to fetch courses.');
    setLoading(false);
  }
}, [initialPageSize]);


  // Fetch department courses based on the selected department
  const fetchDepartmentCourses = useCallback(async (department) => {
    try {
      setDepartmentLoading(true);
      const q = query(
        collection(db, 'courses'),
        where('department', '==', department),
        orderBy('layup', 'desc'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        department: doc.data().department,
        distribs: doc.data().distribs,
        numOfReviews: doc.data().numOfReviews,
        layup: doc.data().layup,
      }));

      console.log('Fetched department courses data:', coursesData);

      setDepartmentCourses(coursesData);
    } catch (error) {
      console.error('Error fetching department courses:', error);
      setError('Failed to fetch department courses.');
    } finally {
      setDepartmentLoading(false);
    }
  }, []);

  
  // Fetch distrib courses based on the selected distrib
  const fetchDistribCourses = useCallback(async (distrib) => {
    try {
      setDistribLoading(true);

      // Fetch all courses without limit
      const q = query(
        collection(db, 'courses'),
        orderBy('layup', 'desc') // Order by layup first to help with sorting
      );

      const querySnapshot = await getDocs(q);
      const allCourses = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        department: doc.data().department,
        distribs: doc.data().distribs,
        numOfReviews: doc.data().numOfReviews,
        layup: doc.data().layup,
      }));

      // Filter courses where the distribs string includes the selected distrib
      const filteredCourses = allCourses
        .filter(
          (course) =>
            typeof course.distribs === 'string' &&
            course.distribs.split(',').map((d) => d.trim()).includes(distrib)
        )
        .sort((a, b) => b.layup - a.layup) // Sort by layup in descending order
        .slice(0, 5); // Take top 5

      console.log('Fetched distrib courses data:', filteredCourses);
      setDistribCourses(filteredCourses);
    } catch (error) {
      console.error('Error fetching distrib courses:', error);
      setError('Failed to fetch distrib courses.');
    } finally {
      setDistribLoading(false);
    }
  }, []);

  // Fetch departments and distribs to populate dropdowns
  const fetchDepartmentsAndDistribs = useCallback(async () => {
    try {
      const q = query(collection(db, 'courses'));
      const querySnapshot = await getDocs(q);
      const departmentsData = querySnapshot.docs.map((doc) => doc.data().department);
      const uniqueDepartments = [...new Set(departmentsData)];
      setDepartments(uniqueDepartments);

      // Extract unique distribs, assuming distribs is a comma-separated string
      const distribsData = querySnapshot.docs.flatMap((doc) => {
        const distribField = doc.data().distribs;
        if (typeof distribField === 'string') {
          return distribField.split(',').map((distrib) => distrib.trim()); // Split string and trim spaces
        }
        return []; // Handle unexpected types safely
      });
      const uniqueDistribs = [...new Set(distribsData)];
      setDistribs(uniqueDistribs);
    } catch (error) {
      console.error('Error fetching departments and distribs:', error);
      setError('Failed to fetch departments and distribs.');
    }
  }, []);

  // Background fetch and cache courses on component mount
  useEffect(() => {
    fetchDepartmentsAndDistribs();
    fetchAndCacheCourses(); // Pre-fetch and cache top courses
  }, [fetchAndCacheCourses, fetchDepartmentsAndDistribs]);

  const handleDepartmentChange = (event) => {
    const department = event.target.value;
    setSelectedDepartment(department);
    if (department) {
      fetchDepartmentCourses(department);
    } else {
      setDepartmentCourses([]);
    }
  };

  const handleDistribChange = (event) => {
    const distrib = event.target.value;
    setSelectedDistrib(distrib);
    if (distrib) {
      fetchDistribCourses(distrib);
    } else {
      setDistribCourses([]);
    }
  };

  useEffect(() => {
    // Simulate initial page load
    setTimeout(() => setPageLoading(false), 1000);
  }, []);

  return (
    <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: darkMode
        ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
        : '#F9F9F9',
      padding: '40px',
      fontFamily: 'SF Pro Display, sans-serif',
      transition: 'background-color 0.3s ease',
    }}
    >
      {/* Live fetching indicator */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 35,
          display: 'flex',
          alignItems: 'center',
          zIndex: 1000,
          backgroundColor: darkMode
            ? 'rgba(0, 0, 0, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          padding: '8px 12px',
          borderRadius: '20px',
          boxShadow: darkMode
            ? '0 2px 8px rgba(0, 0, 0, 0.5)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
        sx={{
          width: 10,
          height: 10,
          backgroundColor: '#F26655', // Keeping this constant
          borderRadius: '50%',
          marginRight: '8px',
          animation: 'blinker 1.5s linear infinite',
          '@keyframes blinker': {
            '50%': { opacity: 0 },
          },
        }}
        />
      <Typography variant="body2" sx={{ fontWeight: 500, color: darkMode ? '#fff' : '#333' }}>
      Fetching Live Courses
        </Typography>
      </Box>
  
      <Container maxWidth="lg">
  {/* Updated Heading */}
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
        }}
      >
    The Greatest Layups of All Time
  </Typography>

  {/* Updated Note */}
  <Typography
        variant="body2"
        align="center"
        sx={{
          marginBottom: '20px',
          color: darkMode ? '#fff' : '#333',
          backgroundColor: darkMode ? '#333' : '#E0E7FF',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: darkMode
            ? '0 2px 4px rgba(0, 0, 0, 0.5)'
            : '0 2px 4px rgba(0, 0, 0, 0.1)',
          maxWidth: 1100,
          marginLeft: 'auto',
          marginRight: 'auto',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
      >

    <strong>Note:</strong> In the context of courses, "layup" refers to the perceived ease and workload of the course.
  </Typography>

  
  <Box
  sx={{
    // Full-bleed approach
    width: '100vw',             // take the entire viewport width
    position: 'relative',       // needed to shift outside the container
    left: '50%',
    right: '50%',
    marginLeft: '-50vw',        // centers the full-width Box
    marginRight: '-50vw',
    display: 'flex',
    overflowX: 'auto',          // horizontal scroll
    gap: 2,
    pb: 2,
    mb: 4,
    // Scrollbar styles for Firefox
    scrollbarWidth: 'thin',
    scrollbarColor: 'transparent transparent',
    // Scrollbar styles for WebKit browsers (Chrome, Safari, Edge)
    '&::-webkit-scrollbar': {
      height: '8px', // Adjust the height as needed
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
    },
  
  }}
  ref={scrollContainerRef}  // attach custom hook's ref
>
  {loading ? (
    // Show skeletons while loading
    [...Array(5)].map((_, i) => (
      <Skeleton
        key={i}
        variant="rectangular"
        width={250}
        height={140}
        sx={{ borderRadius: 2 }}
      />
    ))
  ) : error ? (
    <Alert severity="error">{error}</Alert>
  ) : (
    clonedItems.map((course, index) => (
      <Card
        key={`${course.id}-${index}`}
        component={Link}
        to={`/departments/${course.department}/courses/${course.id}`}
        sx={{
          minWidth: 250,
          maxWidth: 300,
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: '12px',
          p: 2,
          backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
          color: darkMode ? '#fff' : '#333',
          boxShadow: darkMode
            ? '0 6px 16px rgba(255, 255, 255, 0.1)'
            : '0 6px 16px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.2s ease',
          ml: 2,
          position: 'relative',
          '&:hover': {
            transform: 'scale(1.03)',
            backgroundColor: darkMode ? '#24273c' : undefined,
          },
        }}
      >
        {/* Number Badge (reset numbering every 15 items) */}
        <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  backgroundColor: darkMode
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  px: 1,
                  py: 0.5,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  zIndex: 1,
                }}
        >
          {(index % 15) + 1}
        </Box>

        <CardContent>
          {/* Header: Course Name and Distribs */}
          <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
          <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', color: darkMode ? '#fff' : '#333', mb: 1 }}
                  >

              {course.name}
            </Typography>
            {course.distribs && typeof course.distribs === 'string' && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {course.distribs.split(',').map((dist, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      fontSize: '0.75rem',
                      px: 1,
                      py: 0.5,
                      borderRadius: '9999px',
                      backgroundColor: darkMode ? '#333' : '#F0F0F0',
                      color: darkMode ? '#fff' : '#333',
                    }}
                  >
                    {dist.trim()}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Metrics: Layup Score and Reviews */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            {/* Layup Score Metric */}
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '9999px',
                textAlign: 'center',
                backgroundColor:
                        course.layup >= 80
                          ? '#D1FAE5'
                          : course.layup >= 60
                          ? '#FEF3C7'
                          : '#FEE2E2',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color:
                  course.layup >= 80
                  ? '#065F46'
                  : course.layup >= 60
                  ? '#92400E'
                  : '#991B1B',
                }}
              >
                {course.layup.toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Layup
              </Typography>
            </Box>

            {/* Reviews Metric */}
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '9999px',
                textAlign: 'center',
                backgroundColor: '#DBEAFE',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1D4ED8' }}>
                {course.numOfReviews}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Reviews
              </Typography>
            </Box>
          </Box>
        </CardContent>
        <CardActions>
          <Button variant="outlined" size="small" color="primary">
            View Course
          </Button>
        </CardActions>
      </Card>
    ))
  )}
</Box>






        {/* 
  WINTER 2025 LAYUPS
  (Previously "Right Box - Layups by Timing" - now a simple block)
*/}
<Box
  sx={{
    width: '100%',
    maxWidth: 1100,
    mb: 4,
  }}
>
  <Card
    sx={{
      backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
      borderRadius: '16px',
      boxShadow: darkMode
        ? '0 4px 20px rgba(255, 255, 255, 0.08)'
        : '0 4px 20px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      mb: 4,
    }}
  >
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 600,
          mb: 2,
          color: darkMode ? '#fff' : '#34495E',
          backgroundColor: darkMode ? '#24273c' : '#F0F4FF',
          borderLeft: '4px solid #571CE0',
          borderRadius: '8px',
          p: 2,
          boxShadow: darkMode
            ? '0 2px 4px rgba(0, 0, 0, 0.2)'
            : '0 2px 4px rgba(0, 0, 0, 0.05)',
        }}
      >
        Winter 2025 Layups
      </Typography>
    </Box>
    <CardContent>
      <LayupsByTiming darkMode={true} />
    </CardContent>
  </Card>
</Box>

</Container>
<Container maxWidth="lg" sx={{ mb: 4 }}>
  <Card
    sx={{
      width: '100%',
      maxWidth: 1100,
      marginTop: '20px',
      boxShadow: darkMode
        ? '0 4px 12px rgba(255, 255, 255, 0.1)'
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
      backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
      borderRadius: '12px',
      padding: 4,
      transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    }}
  >
    <CardContent>
      {/* Now HiddenLayups is back! */}
      <HiddenLayups darkMode={true} />
    </CardContent>
  </Card>
</Container>



{/* Add the new Layups by Timing section here
<Container maxWidth="lg">
        <Card
          sx={{
            width: '100%',
            maxWidth: 1100,
            marginTop: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: 4,
          }}
        >
          <LayupsByTiming />
        </Card>
      </Container> */}

      <Container maxWidth="lg">
  <Card
    sx={{
      width: '100%',
      maxWidth: 1100,
      marginTop: '20px',
      boxShadow: darkMode
        ? '0 4px 12px rgba(255, 255, 255, 0.1)'
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
      backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
      borderRadius: '12px',
      padding: 4,
    }}
  >
    
    <CardContent>
  <Typography
    variant="h4"
    align="left"
    gutterBottom
    sx={{
      fontWeight: 600,
      marginBottom: '25px',
      color: darkMode ? '#fff' : '#34495E',
      padding: '8px 16px',
      backgroundColor: darkMode ? '#24273c' : '#F0F4FF',
      borderRadius: '6px',
      boxShadow: darkMode
        ? '0 1px 3px rgba(255, 255, 255, 0.1)'
        : '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderLeft: '4px solid #571CE0',
      fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
    }}
  >
    Layups by Department
  </Typography>

  <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel id="department-label" sx={{ color: darkMode ? '#fff' : '#571CE0' }}>
        Department
      </InputLabel>
      <Select
        labelId="department-label"
        value={selectedDepartment}
        label="Department"
        onChange={handleDepartmentChange}
        sx={{
          height: '48px',
          backgroundColor: darkMode ? '#1C1F43' : '#F0F4FF',
          borderRadius: '8px',
          '&:hover': { backgroundColor: darkMode ? '#24273c' : '#E0E7FF' },
          transition: 'background-color 0.3s ease',
          color: darkMode ? '#fff' : 'inherit',
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
              width: 250,
              backgroundColor: darkMode ? '#1C1F43' : undefined,
              color: darkMode ? '#fff' : undefined,
            },
          },
        }}
      >
        <MenuItem value="">
          <em>All Departments</em>
        </MenuItem>
        {departments.map((department, index) => (
          <MenuItem key={index} value={department} sx={{ color: darkMode ? '#fff' : undefined }}>
            {department}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>

  {departmentLoading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '200px' }}>
      <CircularProgress color="primary" />
    </Box>
  ) : error ? (
    <Alert severity="error">{error}</Alert>
  ) : departmentCourses.length > 0 ? (
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
                color: darkMode ? '#fff' : 'black',
                textAlign: 'left',
                fontWeight: 600,
                fontSize: '1rem',
                padding: '12px 20px',
                borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                width: '50%',
              }}
            >
              Course Name
            </TableCell>
            {!isMobile && (
              <TableCell
                sx={{
                  color: darkMode ? '#fff' : 'black',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '10px',
                  borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                }}
              >
                Distribs
              </TableCell>
            )}
            <TableCell
              sx={{
                color: darkMode ? '#fff' : 'black',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '1rem',
                padding: '10px',
                borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
              }}
            >
              Num of Reviews
            </TableCell>
            <TableCell
              sx={{
                color: darkMode ? '#fff' : 'black',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '1rem',
                padding: '10px',
                borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
              }}
            >
              Layup
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {departmentCourses.map((course, index) => (
            <TableRow
              key={course.id}
              component={Link}
              to={`/departments/${course.department}/courses/${course.id}`}
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
                  color: darkMode ? '#fff' : 'black',
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
                  color: darkMode ? '#ccc' : '#333',
                  padding: '10px 20px',
                  fontSize: '0.95rem',
                  borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                  width: '50%',
                }}
              >
                {course.name}
              </TableCell>
              {!isMobile && (
                <TableCell
                  sx={{
                    color: darkMode ? '#ccc' : '#333',
                    padding: '10px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
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
                    {typeof course.distribs === 'string' &&
                      course.distribs.split(',').map((distrib, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            backgroundColor: darkMode ? '#333' : '#F0F0F0',
                            color: darkMode ? '#fff' : '#333',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            boxShadow: darkMode
                              ? '0 2px 5px rgba(0, 0, 0, 0.5)'
                              : '0 2px 5px rgba(0, 0, 0, 0.1)',
                            transition: 'background-color 0.2s ease',
                            lineHeight: '1.5',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': {
                              backgroundColor: darkMode ? '#444' : '#E0E0E0',
                              boxShadow: darkMode
                                ? '0 3px 8px rgba(0, 0, 0, 0.7)'
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
              <TableCell
                sx={{
                  color: darkMode ? '#ccc' : '#333',
                  padding: isMobile ? '8px' : '10px',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                }}
              >
                {course.numOfReviews}
              </TableCell>
              <TableCell
                sx={{
                  color: darkMode ? '#ccc' : '#333',
                  padding: isMobile ? '8px' : '10px',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
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
    <Typography sx={{ color: darkMode ? '#fff' : '#333' }}>
      Select a department to see the biggest layups
    </Typography>
  )}
</CardContent>
</Card>
</Container>

{/* <Container maxWidth="lg">
  <Card
    sx={{
      width: '100%',
      maxWidth: 1100,
      marginTop: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: 4,
    }}
  > */}
    <Container maxWidth="lg">
  <Card
    sx={{
      width: '100%',
      maxWidth: 1100,
      marginTop: '20px',
      boxShadow: darkMode
        ? '0 4px 12px rgba(255, 255, 255, 0.1)'
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
      backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
      borderRadius: '12px',
      padding: 4,
    }}
  >
    <CardContent>
      <Typography
        variant="h4"
        align="left"
        gutterBottom
        sx={{
          fontWeight: 600,
          marginBottom: '25px',
          color: darkMode ? '#fff' : '#34495E',
          padding: '8px 16px',
          backgroundColor: darkMode ? '#24273c' : '#F0F4FF',
          borderRadius: '6px',
          boxShadow: darkMode
            ? '0 1px 3px rgba(255, 255, 255, 0.1)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #571CE0',
          fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
        }}
      >
        Layups by Distribs
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="distrib-label" sx={{ color: darkMode ? '#fff' : '#571CE0' }}>
            Distrib
          </InputLabel>
          <Select
            labelId="distrib-label"
            value={selectedDistrib}
            label="Distrib"
            onChange={handleDistribChange}
            sx={{
              height: '48px',
              backgroundColor: darkMode ? '#1C1F43' : '#F0F4FF',
              borderRadius: '8px',
              '&:hover': { backgroundColor: darkMode ? '#24273c' : '#E0E7FF' },
              transition: 'background-color 0.3s ease',
              color: darkMode ? '#fff' : 'inherit',
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  width: 250,
                  backgroundColor: darkMode ? '#1C1F43' : undefined,
                  color: darkMode ? '#fff' : undefined,
                },
              },
            }}
          >
            <MenuItem value="">
              <em>All Distribs</em>
            </MenuItem>
            {distribs.map((distrib, index) => (
              <MenuItem key={index} value={distrib} sx={{ color: darkMode ? '#fff' : undefined }}>
                {distrib}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {distribLoading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '200px',
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : distribCourses.length > 0 ? (
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
                    color: darkMode ? '#fff' : 'black',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '12px 20px',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                    width: '50%',
                  }}
                >
                  Course Name
                </TableCell>
                {!isMobile && (
                  <TableCell
                    sx={{
                      color: darkMode ? '#fff' : 'black',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '1rem',
                      padding: '10px',
                      borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                    }}
                  >
                    Distribs
                  </TableCell>
                )}
                <TableCell
                  sx={{
                    color: darkMode ? '#fff' : 'black',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '10px',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                  }}
                >
                  Num of Reviews
                </TableCell>
                <TableCell
                  sx={{
                    color: darkMode ? '#fff' : 'black',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '10px',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                  }}
                >
                  Layup
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {distribCourses.map((course, index) => (
                <TableRow
                  key={course.id}
                  component={Link}
                  to={`/departments/${course.department}/courses/${course.id}`}
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
                      color: darkMode ? '#fff' : 'black',
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
                      color: darkMode ? '#ccc' : '#333',
                      padding: '10px 20px',
                      fontSize: '0.95rem',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                      width: '50%',
                    }}
                  >
                    {course.name}
                  </TableCell>
                  {!isMobile && (
                    <TableCell
                      sx={{
                        color: darkMode ? '#ccc' : '#333',
                        padding: '10px',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
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
                        {typeof course.distribs === 'string' &&
                          course.distribs.split(',').map((distrib, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                backgroundColor: darkMode ? '#333' : '#F0F0F0',
                                color: darkMode ? '#fff' : '#333',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                boxShadow: darkMode
                                  ? '0 2px 5px rgba(0, 0, 0, 0.5)'
                                  : '0 2px 5px rgba(0, 0, 0, 0.1)',
                                transition: 'background-color 0.2s ease',
                                lineHeight: '1.5',
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                  backgroundColor: darkMode ? '#444' : '#E0E0E0',
                                  boxShadow: darkMode
                                    ? '0 3px 8px rgba(0, 0, 0, 0.7)'
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
                  <TableCell
                    sx={{
                      color: darkMode ? '#ccc' : '#333',
                      padding: isMobile ? '8px' : '10px',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                    }}
                  >
                    {course.numOfReviews}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: darkMode ? '#ccc' : '#333',
                      padding: isMobile ? '8px' : '10px',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
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
        <Typography sx={{ color: darkMode ? '#fff' : '#333' }}>
          Select a distrib to see the biggest layups
        </Typography>
      )}
    </CardContent>
  </Card>
</Container>

    </Box>
  );
};

export default LayupsPage;
