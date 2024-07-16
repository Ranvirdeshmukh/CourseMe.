import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Paper, CircularProgress, useMediaQuery } from '@mui/material';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const LayupsPage = () => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)');
  const initialPageSize = 30; // Fetch more than 15 courses initially to ensure enough unique courses

  const fetchCoursesRef = useRef();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, 'courses'),
        orderBy('layup', 'desc'),
        limit(initialPageSize)
      );

      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log('Fetched courses data:', coursesData); // Log fetched data

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

  fetchCoursesRef.current = fetchCourses;

  useEffect(() => {
    fetchCoursesRef.current();
  }, []);

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
                  {/* <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Quality</TableCell> */}
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
                    {/* <TableCell sx={{ color: '#571CE0', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.quality}</TableCell> */}
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
    </Box>
  );
};

export default LayupsPage;
