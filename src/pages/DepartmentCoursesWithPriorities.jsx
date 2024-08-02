import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  CircularProgress
} from '@mui/material';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const DepartmentCoursesWithPriorities = () => {
  const { department } = useParams(); // Extract department from URL
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesCollection = collection(db, 'CoursePriorities');
        const courseSnapshot = await getDocs(coursesCollection);
        if (!courseSnapshot.empty) {
          const coursesList = courseSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(course => course.Department === decodeURIComponent(department));
          
          setCourses(coursesList);
        } else {
          setError('No courses found for this department.');
        }
      } catch (err) {
        console.error('Failed to fetch course priorities:', err);
        setError('Failed to fetch courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [department]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#E4E2DD',
        padding: '40px'
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          gutterBottom
          align="left"
          color="primary"
          sx={{ fontWeight: 'bold', mb: 2 }}
        >
          Courses in {decodeURIComponent(department)}
        </Typography>

        {loading ? (
          <CircularProgress color="primary" />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : courses.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Course Name</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Course Number</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Enrollment Limit</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Priorities</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                    }}
                  >
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'left' }}>{course['Title of the Class']}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{course['Course Number']}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{course['Enrollment Limit']}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'left' }}>
                      <ul style={{ padding: '0', listStyleType: 'none' }}>
                        {course.Priorities.split(/(\d+[a-z]{2}:\s)/).map((priority, index) => 
                          priority.trim() && (
                            <li key={index}>
                              <Typography component="span" sx={{ color: 'black' }}>
                                {priority.trim()}
                              </Typography>
                            </li>
                          )
                        )}
                      </ul>
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
    </Box>
  );
};

export default DepartmentCoursesWithPriorities;
