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
  CircularProgress,
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
              ...doc.data(),
            }))
            .filter((course) => course.Department === decodeURIComponent(department));

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
        padding: '40px',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          gutterBottom
          align="left"
          sx={{
            fontWeight: 600,
            marginBottom: '16px',
            fontFamily: 'SF Pro Display, sans-serif',
            color: '#571CE0',
          }}
        >
          Courses in {decodeURIComponent(department)}
        </Typography>
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{
            marginBottom: '24px',
            fontFamily: 'SF Pro Display, sans-serif',
            color: '#1D1D1F',
            lineHeight: 1.5,
          }}
        >
          Explore the courses offered under the {decodeURIComponent(department)} department. Ensure you are aware of the enrollment priorities and limits for effective planning.
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
                  <TableCell sx={{ textAlign: 'left', fontWeight: 'bold', color: '#571CE0' }}>
                    Course Name
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: '#571CE0' }}>
                    Course Number
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: '#571CE0' }}>
                    Enrollment Limit
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: '#571CE0' }}>
                    Priorities
                  </TableCell>
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
                    <TableCell sx={{ padding: '10px', textAlign: 'left' }}>
                      <Typography
                        sx={{
                          fontFamily: 'SF Pro Display, sans-serif',
                          fontWeight: 600,
                          color: '#1D1D1F',
                          fontSize: '0.875rem',
                        }}
                      >
                        {course['Title of the Class']}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '10px', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'SF Pro Display, sans-serif',
                          fontWeight: 600,
                          color: '#1D1D1F',
                          fontSize: '0.875rem',
                        }}
                      >
                        {course['Course Number']}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '10px', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'SF Pro Display, sans-serif',
                          fontWeight: 600,
                          color: '#1D1D1F',
                          fontSize: '0.875rem',
                        }}
                      >
                        {course['Enrollment Limit']}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '10px', textAlign: 'left' }}>
                      <ul style={{ padding: '0', listStyleType: 'none' }}>
                        {course.Priorities.split(/(\d+[a-z]{2}:\s)/).map(
                          (priority, index) =>
                            priority.trim() && (
                              <li key={index}>
                                <Typography
                                  component="span"
                                  sx={{
                                    fontFamily: 'SF Pro Display, sans-serif',
                                    color: '#1D1D1F',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                  }}
                                >
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
