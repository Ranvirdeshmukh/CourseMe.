// src/pages/CourseReviewsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Alert, List, ListItem, ListItemText } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import departmentMapping from '../classstructure/departmentMapping';

const CourseReviewsPage = () => {
  const { department, courseId } = useParams();
  const [reviews, setReviews] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Extract only the course code from the full courseId
        const sanitizedCourseId = courseId.split('_')[1]; // Get the actual course code part (e.g., COSC001)
        console.log(`Fetching reviews for document path: reviews/${sanitizedCourseId}`);
        const docRef = doc(db, 'reviews', sanitizedCourseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Document data:', data);
          setReviews(data);
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
  }, [courseId]);

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
        <Typography variant="h4" gutterBottom>Reviews for {department}_{courseId} in {departmentMapping[department]?.name || department}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {Object.keys(reviews).length > 0 ? (
          <List>
            {Object.entries(reviews).map(([instructor, reviewList], index) => (
              <React.Fragment key={index}>
                <Typography variant="h6">{instructor}</Typography>
                {reviewList.length > 0 ? (
                  reviewList.map((review, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={review} />
                    </ListItem>
                  ))
                ) : (
                  <Typography>No reviews available for this instructor</Typography>
                )}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography>No reviews available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default CourseReviewsPage;
