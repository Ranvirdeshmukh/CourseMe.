import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Paper, CircularProgress } from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import departmentMapping from '../classstructure/departmentMapping';

const DepartmentCoursesPage = () => {
  const { department } = useParams();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching courses for department: ${department}`);
        const q = query(collection(db, 'courses'), where('department', '==', department));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Fetched courses data:', coursesData);
          setCourses(coursesData);
        } else {
          console.log('No courses found for this department.');
          setError('No courses found for this department.');
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to fetch courses.');
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    fetchData();
  }, [department]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E4E2DD', // Light background color
        color: '#571CE0', // Purple text color
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '20px'
      }}
    >
      <Container>
        <Typography variant="h4" align='left' gutterBottom>Courses in {departmentMapping[department]?.name || department}</Typography>
        {loading ? (
          <CircularProgress sx={{ color: '#571CE0' }} /> // Display loading spinner while data is being fetched
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : courses.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#E4E2DD', margin: '20px 0' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Course Name</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Distribs</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Num of Reviews</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Quality</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Layup</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow
                    key={index}
                    component={Link}
                    to={`/departments/${department}/courses/${course.id}`}
                    sx={{
                      '&:nth-of-type(odd)': { backgroundColor: '#F5F5F5' },
                      '&:hover': { backgroundColor: '#D3D3D3' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'left' }}>{course.name}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{course.distribs}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{course.numOfReviews}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{course.quality}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{course.layup}</TableCell>
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


export default DepartmentCoursesPage;
