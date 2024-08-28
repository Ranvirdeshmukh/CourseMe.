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
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const CourseEnrollmentPriorities = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Check if data is available in localStorage
        const cachedData = localStorage.getItem('courseEnrollmentPriorities');
        if (cachedData) {
          setDepartments(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        // If not, fetch from Firestore
        const coursesCollection = collection(db, 'CoursePriorities');
        const courseSnapshot = await getDocs(coursesCollection);

        if (!courseSnapshot.empty) {
          const coursesList = courseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Group courses by department
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

          // Cache the data in localStorage
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
        backgroundColor: '#E4E2DD',
        padding: '40px', // Consistent padding for all pages
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3" // Match variant with LayupsPage for consistency
          gutterBottom
          align="left"
          sx={{
            fontWeight: 600,
            marginBottom: '16px', // Improved spacing
            fontFamily: 'SF Pro Display, sans-serif',
            color: '#571CE0', // Consistent heading color
          }}
        >
          Course Enrollment Priorities for <span style={{ color: 'green' }}>Fall 24</span>
        </Typography>

        <Typography
          variant="body1" // Adjust size for better readability
          color="textSecondary"
          sx={{
            marginBottom: '24px', // Consistent spacing with LayupsPage
            fontFamily: 'SF Pro Display, sans-serif',
            color: '#1D1D1F',
            lineHeight: 1.5,
          }}
        >
          <strong>**Please note:**</strong> This page is updated every term. The information below pertains to the Fall 2024 term.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : departments.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3, borderRadius:'12px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Sr. No.</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Department</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Number of Courses</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((department, index) => (
                  <TableRow
                    key={index}
                    component={Link}
                    to={`/course-enrollment-priorities/${encodeURIComponent(department.name)}`}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <TableCell sx={{ color: 'BLACK', padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ color: 'BLACK', padding: isMobile ? '5px' : '10px', textAlign: 'left' }}>
                      {department.name}
                    </TableCell>
                    <TableCell sx={{ color: 'BLACK', padding: isMobile ? '5px' : '10px', textAlign: 'center' }}>
                      {department.courses.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No departments available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default CourseEnrollmentPriorities;
