import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const CourseEnrollmentPriorities = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Define dark/light mode variables
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
        const cachedData = localStorage.getItem('courseEnrollmentPriorities');
        if (cachedData) {
          setDepartments(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        const coursesCollection = collection(db, 'CoursePriorities');
        const courseSnapshot = await getDocs(coursesCollection);

        if (!courseSnapshot.empty) {
          const coursesList = courseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const departmentsMap = coursesList.reduce((acc, course) => {
            const departmentName = course.Department || 'Unknown Department';
            if (!acc[departmentName]) {
              acc[departmentName] = [];
            }
            acc[departmentName].push(course);
            return acc;
          }, {});

          const departmentsArray = Object.keys(departmentsMap).map((department) => ({
            name: department,
            courses: departmentsMap[department],
          }));

          localStorage.setItem('courseEnrollmentPriorities', JSON.stringify(departmentsArray));
          setDepartments(departmentsArray);
        } else {
          setError('No course priorities found.');
        }
      } catch (err) {
        console.error('Failed to fetch course priorities:', err);
        setError('Failed to fetch course priorities.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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
          Course Enrollment Priorities for <span style={{ color: '#349966' }}>Winter 25</span>
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
          <strong>**Please note:**</strong> This page is updated every term. The information below pertains to the Winter 2025 term.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : departments.length > 0 ? (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: paperBgColor,
              marginTop: '20px',
              borderRadius: '12px',
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
                      backgroundColor: tableHeaderBgColor,
                      color: headerTextColor,
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      borderBottom: 'none',
                      paddingBottom: '15px',
                    }}
                  >
                    Sr. No.
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: tableHeaderBgColor,
                      color: headerTextColor,
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      borderBottom: 'none',
                      paddingBottom: '15px',
                    }}
                  >
                    Department
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: tableHeaderBgColor,
                      color: headerTextColor,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      borderBottom: 'none',
                      paddingBottom: '15px',
                    }}
                  >
                    Number of Courses
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((department, index) => (
                  <TableRow
                    key={index}
                    component={Link}
                    to={`/course-enrollment-priorities/${encodeURIComponent(department.name)}`}
                    sx={{
                      backgroundColor: index % 2 === 0 ? tableRowEvenBgColor : tableRowOddBgColor,
                      transition: 'transform 0.3s ease, background-color 0.3s ease',
                      '&:hover': {
                        backgroundColor: darkMode ? '#2a2a2a' : '#E9E9E9',
                        transform: 'scale(1.03)',
                        boxShadow: darkMode
                          ? '0 10px 30px rgba(255, 255, 255, 0.1)'
                          : '0 10px 30px rgba(0, 0, 0, 0.12)',
                      },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit',
                      borderRadius: '8px',
                    }}
                  >
                    <TableCell sx={{ color: textColor, padding: '15px', fontSize: '1rem', borderBottom: 'none' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ color: textColor, padding: '15px', fontSize: '1rem', borderBottom: 'none' }}>
                      {department.name}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: textColor,
                        padding: '15px',
                        fontSize: '1rem',
                        borderBottom: 'none',
                        textAlign: 'center',
                      }}
                    >
                      {department.courses.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ color: textColor }}>No departments available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default CourseEnrollmentPriorities;
