import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, List, ListItem, ListItemText, Alert } from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const DepartmentCoursesPage = () => {
  const { department } = useParams();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'courses'), where('department', '==', department));
        const querySnapshot = await getDocs(q);
        const coursesData = querySnapshot.docs.map(doc => doc.data());
        setCourses(coursesData);
      } catch (error) {
        setError('Failed to fetch courses.');
        console.error('Error fetching courses:', error);
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
        background: 'radial-gradient(circle, #571CE0 0%, #571CE0 40%, black 70%)',
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
      }}
    
    >
      <Container>
        <Typography variant="h4" gutterBottom>Courses in {department}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {courses.length > 0 ? (
          <List>
            {courses.map((course, index) => (
              <ListItem key={index}>
                <ListItemText primary={`${course.name} (Layup: ${course.layup})`} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No courses available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default DepartmentCoursesPage;
