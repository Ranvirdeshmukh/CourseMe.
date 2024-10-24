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
        // Check if data for the department is available in localStorage
        const cachedData = localStorage.getItem(`courses-${department}`);
        if (cachedData) {
          setCourses(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        // If not, fetch from Firestore (for the first time)
        const coursesCollection = collection(db, 'CoursePriorities');
        const courseSnapshot = await getDocs(coursesCollection);
        if (!courseSnapshot.empty) {
          const coursesList = courseSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((course) => course.Department === decodeURIComponent(department));

          // Cache the courses data in localStorage
          localStorage.setItem(`courses-${department}`, JSON.stringify(coursesList));

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
        backgroundColor: '#F9F9F9', // Sleek, modern background color
        padding: '30px', // Consistent padding for all pages
        fontFamily: 'SF Pro Display, sans-serif', // Apple-like typography
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
            color: '#571CE0', // Consistent heading color
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
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : courses.length > 0 ? (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: '#FFFFFF', // Clean, white background for table
              marginTop: '20px',
              borderRadius: '12px', // Rounded edges for modern look
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)', // Soft shadow for elevation
            }}
          >
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
                  <TableCell sx={{ textAlign: 'left', fontWeight: 'bold', color: '#571CE0' }}>
                    Priorities
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#F8F8F8' : '#FFFFFF', // Alternating row colors
                      '&:hover': {
                        backgroundColor: '#E9E9E9', // Subtle hover effect
                        transform: 'scale(1.03)', // Slight scaling effect on hover
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)', // Soft shadow for hover effect
                      },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      borderRadius: '8px', // Rounded row corners
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
