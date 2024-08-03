import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
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

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, 'courses'),
        orderBy('layup', 'desc'),
        limit(initialPageSize)
      );

      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        department: doc.data().department,
        distribs: doc.data().distribs,
        numOfReviews: doc.data().numOfReviews,
        layup: doc.data().layup
      }));

      console.log('Fetched courses data:', coursesData);

      const uniqueCoursesSet = new Set();
      const uniqueCourses = [];

      coursesData.forEach(course => {
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

      setCourses(uniqueCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses.');
    } finally {
      setLoading(false);
    }
  }, [initialPageSize]);

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
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        department: doc.data().department,
        distribs: doc.data().distribs,
        numOfReviews: doc.data().numOfReviews,
        layup: doc.data().layup
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
        .filter((course) =>
          typeof course.distribs === 'string' && course.distribs.split(',').map((d) => d.trim()).includes(distrib)
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

  const fetchDepartmentsAndDistribs = useCallback(async () => {
    try {
      const q = query(collection(db, 'courses'));
      const querySnapshot = await getDocs(q);
      const departmentsData = querySnapshot.docs.map(doc => doc.data().department);
      const uniqueDepartments = [...new Set(departmentsData)];
      setDepartments(uniqueDepartments);

      // Extract unique distribs, assuming distribs is a comma-separated string
      const distribsData = querySnapshot.docs.flatMap(doc => {
        const distribField = doc.data().distribs;
        if (typeof distribField === 'string') {
          return distribField.split(',').map(distrib => distrib.trim()); // Split string and trim spaces
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

  useEffect(() => {
    fetchDepartmentsAndDistribs();
    fetchCourses();
  }, [fetchCourses, fetchDepartmentsAndDistribs]);

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
        backgroundColor: '#E4E2DD',
        padding: '20px'
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h4" align='left' gutterBottom color="primary" sx={{ fontWeight: 'bold', marginBottom: '20px' }}>
          The Biggest Layups Of All Time
        </Typography>
        
        {loading ? (
          <CircularProgress color="primary" />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : courses.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginBottom: '20px', boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ textAlign: 'left', fontWeight: 'bold', color: 'primary.main' }}>#</TableCell>
                  <TableCell sx={{ textAlign: 'left', fontWeight: 'bold', color: 'primary.main' }}>Course Name</TableCell>
                  {!isMobile && <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Distribs</TableCell>}
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Num of Reviews</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Layup</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow
                    key={course.id}
                    component={Link}
                    to={`/departments/${course.department}/courses/${course.id}`}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{index + 1}</TableCell>
                    <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{course.name}</TableCell>
                    {!isMobile && <TableCell sx={{ padding: '10px', textAlign: 'center' }}>{typeof course.distribs === 'string' ? course.distribs.split(',').map(distrib => distrib.trim()).join(', ') : 'N/A'}</TableCell>}
                    <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.numOfReviews}</TableCell>
                    <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.layup}</TableCell>
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
        <Card sx={{ width: '100%', marginTop: '20px', boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" align='left' gutterBottom color="primary" sx={{ fontWeight: 'bold', marginBottom: '20px' }}>
              Find the Layups by Department
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <FormControl sx={{ minWidth: 200, '& .MuiInputBase-input': { paddingTop: '10px', paddingBottom: '10px' } }}>
                <InputLabel id="department-label" sx={{ color: 'primary.main' }} shrink={!!selectedDepartment}>Department</InputLabel>
                <Select
                  labelId="department-label"
                  value={selectedDepartment}
                  label="Department"
                  onChange={handleDepartmentChange}
                  sx={{ height: '40px', backgroundColor: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', color: 'primary.main' }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                        width: 250,
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All Departments</em>
                  </MenuItem>
                  {departments.map((department, index) => (
                    <MenuItem key={index} value={department}>{department}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {departmentLoading ? (
              <CircularProgress color="primary" />
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : departmentCourses.length > 0 ? (
              <TableContainer component={Paper} sx={{ backgroundColor: '#fff', boxShadow: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ textAlign: 'left', fontWeight: 'bold', color: 'primary.main' }}>#</TableCell>
                      <TableCell sx={{ textAlign: 'left', fontWeight: 'bold', color: 'primary.main' }}>Course Name</TableCell>
                      {!isMobile && <TableCell sx={{ padding: '10px', textAlign: 'center' }}>Distribs</TableCell>}
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Num of Reviews</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Layup</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departmentCourses.map((course, index) => (
                      <TableRow
                        key={course.id}
                        component={Link}
                        to={`/departments/${course.department}/courses/${course.id}`}
                        sx={{
                          backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                          '&:hover': { backgroundColor: '#e0e0e0' },
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{index + 1}</TableCell>
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{course.name}</TableCell>
                        {!isMobile && <TableCell sx={{ padding: '10px', textAlign: 'center' }}>{typeof course.distribs === 'string' ? course.distribs.split(',').map(distrib => distrib.trim()).join(', ') : 'N/A'}</TableCell>}
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.numOfReviews}</TableCell>
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.layup}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>Select the department to see the biggest layups</Typography>
            )}
          </CardContent>
        </Card>
      </Container>

      <Container maxWidth="lg">
        <Card sx={{ width: '100%', marginTop: '20px', boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" align='left' gutterBottom color="primary" sx={{ fontWeight: 'bold', marginBottom: '20px' }}>
              Layups by Distribs
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <FormControl sx={{ minWidth: 200, '& .MuiInputBase-input': { paddingTop: '10px', paddingBottom: '10px' } }}>
                <InputLabel id="distrib-label" sx={{ color: 'primary.main' }} shrink={!!selectedDistrib}>Distrib</InputLabel>
                <Select
                  labelId="distrib-label"
                  value={selectedDistrib}
                  label="Distrib"
                  onChange={handleDistribChange}
                  sx={{ height: '40px', backgroundColor: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', color: 'primary.main' }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                        width: 250,
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All Distribs</em>
                  </MenuItem>
                  {distribs.map((distrib, index) => (
                    <MenuItem key={index} value={distrib}>{distrib}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {distribLoading ? (
              <CircularProgress color="primary" />
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : distribCourses.length > 0 ? (
              <TableContainer component={Paper} sx={{ backgroundColor: '#fff', boxShadow: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ textAlign: 'left', fontWeight: 'bold', color: 'primary.main' }}>#</TableCell>
                      <TableCell sx={{ textAlign: 'left', fontWeight: 'bold', color: 'primary.main' }}>Course Name</TableCell>
                      {!isMobile && <TableCell sx={{ padding: '10px', textAlign: 'center' }}>Distribs</TableCell>}
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Num of Reviews</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Layup</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {distribCourses.map((course, index) => (
                      <TableRow
                        key={course.id}
                        component={Link}
                        to={`/departments/${course.department}/courses/${course.id}`}
                        sx={{
                          backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                          '&:hover': { backgroundColor: '#e0e0e0' },
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{index + 1}</TableCell>
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{course.name}</TableCell>
                        {!isMobile && <TableCell sx={{ padding: '10px', textAlign: 'center' }}>{typeof course.distribs === 'string' ? course.distribs.split(',').map(distrib => distrib.trim()).join(', ') : 'N/A'}</TableCell>}
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.numOfReviews}</TableCell>
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.layup}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>Select the distrib to see the biggest layups</Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LayupsPage;
