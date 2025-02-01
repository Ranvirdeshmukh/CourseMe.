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
import { useTheme } from '@mui/material/styles';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const DepartmentCoursesWithPriorities = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark'; // Determine dark mode from the theme
  const { department } = useParams(); // Extract department from URL
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define color variables based on darkMode
  const mainBgColor = darkMode
    ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
    : '#F9F9F9';
  const paperBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
  const tableHeaderBgColor = darkMode ? '#333333' : '#f0f0f0';
  const tableRowEvenBgColor = darkMode ? '#1C1F43' : '#F8F8F8';
  const tableRowOddBgColor = darkMode ? '#24273c' : '#FFFFFF';
  const textColor = darkMode ? '#FFFFFF' : '#333333';
  const headerTextColor = darkMode ? '#FFFFFF' : '#571CE0';

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
            .filter(
              (course) =>
                course.Department === decodeURIComponent(department)
            );

          // Cache the courses data in localStorage
          localStorage.setItem(
            `courses-${department}`,
            JSON.stringify(coursesList)
          );
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
        background: mainBgColor,
        padding: '30px',
        fontFamily: 'SF Pro Display, sans-serif',
        color: textColor,
        transition: 'background-color 0.3s ease, color 0.3s ease',
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
            color: headerTextColor,
          }}
        >
          Courses in {decodeURIComponent(department)}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            marginBottom: '24px',
            fontFamily: 'SF Pro Display, sans-serif',
            color: textColor,
            lineHeight: 1.5,
          }}
        >
          Explore the courses offered under the {decodeURIComponent(department)}{' '}
          department. Ensure you are aware of the enrollment priorities and limits
          for effective planning.
        </Typography>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : courses.length > 0 ? (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: paperBgColor,
              marginTop: '20px',
              borderRadius: '15px',
              boxShadow: darkMode
                ? '0 6px 16px rgba(255, 255, 255, 0.1)'
                : '0 6px 16px rgba(0, 0, 0, 0.08)',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: headerTextColor,
                      backgroundColor: tableHeaderBgColor,
                      paddingBottom: '15px',
                      borderBottom: 'none',
                    }}
                  >
                    Course Name
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: headerTextColor,
                      backgroundColor: tableHeaderBgColor,
                      paddingBottom: '15px',
                      borderBottom: 'none',
                    }}
                  >
                    Course Number
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: headerTextColor,
                      backgroundColor: tableHeaderBgColor,
                      paddingBottom: '15px',
                      borderBottom: 'none',
                    }}
                  >
                    Enrollment Limit
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: headerTextColor,
                      backgroundColor: tableHeaderBgColor,
                      paddingBottom: '15px',
                      borderBottom: 'none',
                    }}
                  >
                    Priorities
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor:
                        index % 2 === 0
                          ? tableRowEvenBgColor
                          : tableRowOddBgColor,
                      transition:
                        'transform 0.4s ease, background-color 0.4s ease, box-shadow 0.4s ease',
                      '&:hover': {
                        backgroundColor: darkMode ? '#2a2a2a' : '#E9E9E9',
                        transform: 'scale(1.03)',
                        boxShadow: darkMode
                          ? '0 10px 30px rgba(255, 255, 255, 0.1)'
                          : '0 10px 30px rgba(0, 0, 0, 0.12)',
                      },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      borderRadius: '10px',
                    }}
                  >
                    <TableCell sx={{ padding: '15px', textAlign: 'left' }}>
                      <Typography
                        sx={{
                          fontFamily: 'SF Pro Display, sans-serif',
                          fontWeight: 600,
                          color: textColor,
                          fontSize: '0.875rem',
                        }}
                      >
                        {course['Title of the Class']}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '15px', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'SF Pro Display, sans-serif',
                          fontWeight: 600,
                          color: textColor,
                          fontSize: '0.875rem',
                        }}
                      >
                        {course['Course Number']}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '15px', textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontFamily: 'SF Pro Display, sans-serif',
                          fontWeight: 600,
                          color: textColor,
                          fontSize: '0.875rem',
                        }}
                      >
                        {course['Enrollment Limit']}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '15px', textAlign: 'left' }}>
                      <ul style={{ padding: 0, listStyleType: 'none', margin: 0 }}>
                        {course.Priorities.split(/(\d+[a-z]{2}:\s)/).map(
                          (priority, idx) =>
                            priority.trim() && (
                              <li key={idx}>
                                <Typography
                                  component="span"
                                  sx={{
                                    fontFamily: 'SF Pro Display, sans-serif',
                                    color: textColor,
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
