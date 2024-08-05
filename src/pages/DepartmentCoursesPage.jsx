import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  useMediaQuery

} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import departmentMapping from '../classstructure/departmentMapping';

const DepartmentCoursesPage = () => {
  const { department } = useParams();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)');

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
        setLoading(false);
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
        alignItems: 'center',
        backgroundColor: '#E4E2DD',
        padding: '20px'
      }}
    >
      <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
  <Typography 
    variant="h3" 
    align='left'
    sx={{ 
      fontWeight: 600, 
      fontFamily: 'SF Pro Display, sans-serif', 
      color: '#571CE0',  // Purple color for headings
      marginBottom: '0px',
      marginTop: '20px'
    }}
  >
    Courses in {departmentMapping[department]?.name || department}
  </Typography>
</Box>


        {loading ? (
          <CircularProgress color="primary" />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : courses.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3, borderRadius:'12px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Course Name</TableCell>
                  {!isMobile && <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Distribs</TableCell>}
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
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <TableCell sx={{ color: 'black', padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>{course.name}</TableCell>
                    {!isMobile && <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'center' }}>{course.distribs}</TableCell>}
                    <TableCell sx={{ color: 'black', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.numOfReviews}</TableCell>
                    <TableCell sx={{ color: 'black', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.quality}</TableCell>
                    <TableCell sx={{ color: 'black', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>{course.layup}</TableCell>
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
