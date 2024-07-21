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
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

const LayupsPage = () => {
  const [courses, setCourses] = useState([]);
  const [departmentCourses, setDepartmentCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentLoading, setDepartmentLoading] = useState(false); // Separate loading state for department courses
  const isMobile = useMediaQuery('(max-width:600px)');
  const initialPageSize = 30; // Fetch more than 15 courses initially to ensure enough unique courses

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

  useEffect(() => {
    fetchDepartments();
    fetchCourses();
  }, [fetchCourses, fetchDepartments]);

  const handleDepartmentChange = (event) => {
    const department = event.target.value;
    setSelectedDepartment(department);
    if (department) {
      fetchDepartmentCourses(department);
    } else {
      setDepartmentCourses([]);
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
                    {!isMobile && <TableCell sx={{ padding: '10px', textAlign: 'center' }}>{course.distribs}</TableCell>}
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
              <Typography sx={{ marginRight: '10px', fontWeight: 'bold', color: 'primary.main' }}>Dept:</Typography>
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
                      {!isMobile && <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>Distribs</TableCell>}
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
                        {!isMobile && <TableCell sx={{ padding: '10px', textAlign: 'center' }}>{course.distribs}</TableCell>}
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.numOfReviews}</TableCell>
                        <TableCell sx={{ padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.layup}</TableCell>
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
