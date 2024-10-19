import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
} from '@mui/material';
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

const LayupsPage = () => {
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


  // Function to fetch and cache courses data
  const fetchAndCacheCourses = useCallback(async () => {
    try {
      const cachedData = JSON.parse(localStorage.getItem('topCoursesCache'));
      const now = new Date().getTime();

      if (cachedData && now - cachedData.timestamp < 24 * 60 * 60 * 1000) { // 24 hours expiry
        setCourses(cachedData.courses);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'courses'),
        orderBy('layup', 'desc'),
        limit(initialPageSize)
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

      console.log('Fetched courses data:', coursesData);

      const uniqueCoursesSet = new Set();
      const uniqueCourses = [];

      coursesData.forEach((course) => {
        const normalizedCourseName = course.name.trim().toLowerCase();
        const uniqueKey = `${normalizedCourseName}`;

        if (!uniqueCoursesSet.has(uniqueKey) && uniqueCourses.length < 15) {
          uniqueCoursesSet.add(uniqueKey);
          uniqueCourses.push(course);
        } else {
          console.log('Duplicate found or limit reached:', uniqueKey);
        }
      });

      console.log('Unique courses:', uniqueCourses);

      // Cache the data in local storage with a timestamp
      localStorage.setItem('topCoursesCache', JSON.stringify({
        courses: uniqueCourses,
        timestamp: now,
      }));

      setCourses(uniqueCourses);
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: '40px',
        fontFamily: 'SF Pro Display, sans-serif',
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
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '8px 12px',
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            backgroundColor: '#F26655',
            borderRadius: '50%',
            marginRight: '8px',
            animation: 'blinker 1.5s linear infinite',
            '@keyframes blinker': {
              '50%': { opacity: 0 },
            },
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
          Fetching Live Courses
        </Typography>
      </Box>

      <Container maxWidth="lg">
        <Typography
          variant="h3"
          align="left"
          gutterBottom
          sx={{
            fontWeight: 600,
            marginBottom: '20px',
            color: '#571CE0',
          }}
        >
          The Biggest Layups Of All Time
        </Typography>

        <Typography
          variant="body1"
          sx={{
            marginBottom: '20px',
            color: '#333',
            backgroundColor: '#E0E7FF',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <strong>Note:</strong> In the context of courses, "layup" refers to the perceived ease and workload of the course. A higher layup score typically indicates a course is easier and less time-consuming for students.
        </Typography>

        {loading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '200px' }}>
    <CircularProgress color="primary" />
  </Box>
) : error ? (
  <Alert severity="error">{error}</Alert>
) : courses.length > 0 ? (
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
            Layup
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {courses.map((course, index) => (
          <TableRow
            key={course.id}
            component={Link}
            to={`/departments/${course.department}/courses/${course.id}`}
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
                color: '#333', 
                padding: '10px 20px',
                fontSize: '0.95rem', 
                borderBottom: '1px solid #E0E0E0',
                width: '50%'
              }}
            >
              {course.name}
            </TableCell>
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
                  {typeof course.distribs === 'string' && course.distribs.split(',').map((distrib, idx) => (
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
    <CardContent>
      <Typography
        variant="h4"
        align="left"
        gutterBottom
        sx={{
          fontWeight: 600,
          marginBottom: '25px',
          color: '#571CE0',
          padding: '8px 16px',
          backgroundColor: '#F0F4FF',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #571CE0',
          fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
        }}
      >
        Layups by Department
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="department-label" sx={{ color: '#571CE0' }}>
            Department
          </InputLabel>
          <Select
            labelId="department-label"
            value={selectedDepartment}
            label="Department"
            onChange={handleDepartmentChange}
            sx={{
              height: '48px',
              backgroundColor: '#F0F4FF',
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#E0E7FF' },
              transition: 'background-color 0.3s ease',
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  width: 250,
                },
              },
            }}
          >
            <MenuItem value="">
              <em>All Departments</em>
            </MenuItem>
            {departments.map((department, index) => (
              <MenuItem key={index} value={department}>
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
                      color: '#333', 
                      padding: '10px 20px',
                      fontSize: '0.95rem', 
                      borderBottom: '1px solid #E0E0E0',
                      width: '50%'
                    }}
                  >
                    {course.name}
                  </TableCell>
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
                        {typeof course.distribs === 'string' && course.distribs.split(',').map((distrib, idx) => (
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
        <Typography sx={{ color: '#333' }}>Select a department to see the biggest layups</Typography>
      )}
    </CardContent>
  </Card>
</Container>
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
    <CardContent>
      <Typography
        variant="h4"
        align="left"
        gutterBottom
        sx={{
          fontWeight: 600,
          marginBottom: '25px',
          color: '#571CE0',
          padding: '8px 16px',
          backgroundColor: '#F0F4FF',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #571CE0',
          fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
        }}
      >
        Layups by Distribs
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="distrib-label" sx={{ color: '#571CE0' }}>
            Distrib
          </InputLabel>
          <Select
            labelId="distrib-label"
            value={selectedDistrib}
            label="Distrib"
            onChange={handleDistribChange}
            sx={{
              height: '48px',
              backgroundColor: '#F0F4FF',
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#E0E7FF' },
              transition: 'background-color 0.3s ease',
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                  width: 250,
                },
              },
            }}
          >
            <MenuItem value="">
              <em>All Distribs</em>
            </MenuItem>
            {distribs.map((distrib, index) => (
              <MenuItem key={index} value={distrib}>
                {distrib}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {distribLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '200px' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : distribCourses.length > 0 ? (
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
                      color: '#333', 
                      padding: '10px 20px',
                      fontSize: '0.95rem', 
                      borderBottom: '1px solid #E0E0E0',
                      width: '50%'
                    }}
                  >
                    {course.name}
                  </TableCell>
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
                        {typeof course.distribs === 'string' && course.distribs.split(',').map((distrib, idx) => (
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
        <Typography sx={{ color: '#333' }}>Select a distrib to see the biggest layups</Typography>
      )}
    </CardContent>
  </Card>
</Container>
    </Box>
  );
};

export default LayupsPage;
