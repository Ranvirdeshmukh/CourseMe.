import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Paper, CircularProgress, useMediaQuery, FormControl, InputLabel, Select, MenuItem, Card, CardContent } from '@mui/material';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

const LayupsPage = () => {
  const [courses, setCourses] = useState([]);
  const [departmentCourses, setDepartmentCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)');
  const initialPageSize = 30; // Fetch more than 15 courses initially to ensure enough unique courses

  const fetchCoursesRef = useRef();
  const fetchDepartmentsRef = useRef();

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

      // Log fetched data
      console.log('Fetched courses data:', coursesData);

      // Use a Set to filter out duplicate courses based on a unique combination of normalized course name
      const uniqueCoursesSet = new Set();
      const uniqueCourses = [];

      coursesData.forEach(course => {
        // Normalize course name to avoid duplicates
        const normalizedCourseName = course.name.trim().toLowerCase();
        const uniqueKey = `${normalizedCourseName}`;
        
        if (!uniqueCoursesSet.has(uniqueKey) && uniqueCourses.length < 15) {
          uniqueCoursesSet.add(uniqueKey);
          uniqueCourses.push(course);
        } else {
          console.log('Duplicate found or limit reached:', uniqueKey); // Log duplicates found or if limit reached
        }
      });

      console.log('Unique courses:', uniqueCourses); // Log unique courses

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
      setLoading(true);
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
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const q = query(collection(db, 'courses'));
      const querySnapshot = await getDocs(q);
      const departmentsData = querySnapshot.docs.map(doc => doc.data().department);
      const uniqueDepartments = [...new Set(departmentsData)];

      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to fetch departments.');
    }
  }, []);

  fetchCoursesRef.current = fetchCourses;
  fetchDepartmentsRef.current = fetchDepartments;

  useEffect(() => {
    fetchDepartmentsRef.current();
    fetchCoursesRef.current();
  }, []);

  const handleDepartmentChange = (event) => {
    const department = event.target.value;
    setSelectedDepartment(department);
    fetchDepartmentCourses(department);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        backgroundColor: '#E4E2DD',
        color: '#571CE0',
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '20px'
      }}
    >
      <Container>
        <Typography variant="h4" align='left' gutterBottom>The Biggest Layups Of All Time</Typography>
        
        {loading ? (
          <CircularProgress sx={{ color: '#571CE0' }} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : courses.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#E4E2DD', margin: '20px 0' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Course Name</TableCell>
                  {!isMobile && <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Distribs</TableCell>}
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Num of Reviews</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Layup</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow
                    key={course.id}
                    component={Link}
                    to={`/departments/${course.department}/courses/${course.id}`}
                    sx={{
                      backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : index % 2 === 0 ? '#FFFFFF' : '#F5F5F5',
                      '&:hover': { backgroundColor: '#D3D3D3' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{index + 1}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{course.name}</TableCell>
                    {!isMobile && <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{course.distribs}</TableCell>}
                    <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.numOfReviews}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.layup}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No courses available</Typography>
        )}
      </Container>

      <Container>
        <Card sx={{ width: '100%', marginTop: '20px' }}>
          <CardContent>
            <Typography variant="h4" align='left' gutterBottom>Find the Layups by Department</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <Typography sx={{ marginRight: '10px', fontWeight: 'bold', color: '#571CE0' }}>Dept:</Typography>
              <FormControl sx={{ minWidth: 200, '& .MuiInputBase-input': { paddingTop: '10px', paddingBottom: '10px' } }}>
                <InputLabel id="department-label" sx={{ top: '50%', transform: 'translateY(-50%)' }}> Department</InputLabel>
                <Select
                  labelId="department-label"
                  value={selectedDepartment}
                  label="Department"
                  onChange={handleDepartmentChange}
                  sx={{ height: '40px', backgroundColor: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
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

            {loading ? (
              <CircularProgress sx={{ color: '#571CE0' }} />
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : departmentCourses.length > 0 ? (
              <TableContainer component={Paper} sx={{ backgroundColor: '#E4E2DD', margin: '20px 0' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>#</TableCell>
                      <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Course Name</TableCell>
                      {!isMobile && <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Distribs</TableCell>}
                      <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Num of Reviews</TableCell>
                      <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Layup</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departmentCourses.map((course, index) => (
                      <TableRow
                        key={course.id}
                        component={Link}
                        to={`/departments/${course.department}/courses/${course.id}`}
                        sx={{
                          backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : index % 2 === 0 ? '#FFFFFF' : '#F5F5F5',
                          '&:hover': { backgroundColor: '#D3D3D3' },
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{index + 1}</TableCell>
                        <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{course.name}</TableCell>
                        {!isMobile && <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{course.distribs}</TableCell>}
                        <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.numOfReviews}</TableCell>
                        <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.layup}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>Select the department to see the Biggest layups</Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LayupsPage;
