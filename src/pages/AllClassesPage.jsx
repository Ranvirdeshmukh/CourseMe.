import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AllClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const coursesData = querySnapshot.docs.map(doc => doc.data());
        setClasses(coursesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        fetchData();
      } else {
        setError('User not authenticated');
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
        {loading ? (
          <CircularProgress color="inherit" />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            {classes.length > 0 ? (
              <ul>
                {classes.map((course, index) => (
                  <li key={index}>{course.className} - {course.distributives} (Reviews: {course.numReviews}, Quality: {course.quality})</li>
                ))}
              </ul>
            ) : (
              <Typography>No classes available</Typography>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default AllClassesPage;
