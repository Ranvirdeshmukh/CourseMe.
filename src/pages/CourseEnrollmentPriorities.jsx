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
  useMediaQuery
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
        const coursesCollection = collection(db, 'CoursePriorities');
        const courseSnapshot = await getDocs(coursesCollection);

        if (!courseSnapshot.empty) {
          const coursesList = courseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
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
            courses: departmentsMap[department]
          }));

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
        padding: '40px'
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          gutterBottom
          align="left"
          color="primary"
          sx={{ fontWeight: 'bold', mb: 1 }}
        >
          Course Enrollment Priorities for <span style={{ color: 'green' }}>Fall 24</span>
        </Typography>
        <Typography
          variant="subtitle1"
          gutterBottom
          align="left"
          sx={{ mb: 4, color: '#333' }} // Styling for the subtitle
        >
          **Please note:** This page is updated every term. The information below pertains to the Fall 2024 term.
        </Typography>

        {loading ? (
          <CircularProgress color="primary" />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : departments.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3 }}>
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
                      color: 'inherit'
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
