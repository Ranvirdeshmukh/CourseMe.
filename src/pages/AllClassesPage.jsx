// src/pages/AllClassesPage.js
import React, { useEffect, useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const AllClassesPage = () => {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "courses"));
      const coursesData = querySnapshot.docs.map(doc => doc.data());
      setClasses(coursesData);
    };

    fetchData();
  }, []);

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
        <Typography variant="h4" gutterBottom>All Classes Sorted by Department</Typography>
        {classes.length > 0 ? (
          <ul>
            {classes.map((course, index) => (
              <li key={index}>{course.name} - {course.department} (Difficulty: {course.difficulty})</li>
            ))}
          </ul>
        ) : (
          <Typography>No classes available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default AllClassesPage;
