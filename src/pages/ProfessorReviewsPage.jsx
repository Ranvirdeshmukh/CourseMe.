// src/pages/ProfessorReviewsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Alert, List, ListItem, ListItemText } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import departmentMapping from '../classstructure/departmentMapping';

const ProfessorReviewsPage = () => {
  const { department, courseId, professor } = useParams();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const sanitizedCourseId = courseId.split('_')[1]; // Get the actual course code part (e.g., COSC001)
        console.log(`Fetching reviews for document path: reviews/${sanitizedCourseId}`);
        const docRef = doc(db, 'reviews', sanitizedCourseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Document data:', data);
          setReviews(data[professor] || []);
        } else {
          console.log('No such document!');
          setError('No reviews found for this course.');
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to fetch reviews.');
      }
    };

    fetchReviews();
  }, [courseId, professor]);

  const splitReviewText = (review) => {
    const [prefix, rest] = review.match(/(.*?: .*?: )([\s\S]*)/).slice(1, 3);
    return { prefix, rest };
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E4E2DD', // Light background color
        color: '#571CE0', // Purple text color
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '20px'
      }}
    >
      <Container>
        <Typography variant="h4" gutterBottom>Reviews for {professor} in {department}_{courseId} in {departmentMapping[department]?.name || department}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {reviews.length > 0 ? (
          <List>
            {reviews.map((review, idx) => {
              const { prefix, rest } = splitReviewText(review);
              return (
                <ListItem key={idx} sx={{ backgroundColor: '#fff', margin: '10px 0', borderRadius: '8px' }}>
                  <ListItemText
                    primary={
                      <>
                        <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold' }}>
                          {prefix}
                        </Typography>{' '}
                        <Typography component="span" sx={{ color: 'black' }}>
                          {rest}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography>No reviews available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default ProfessorReviewsPage;
