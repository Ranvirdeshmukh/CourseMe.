import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Alert, List, ListItem, ListItemText } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

const ProfessorReviewsPage = () => {
  const { courseId, professor } = useParams();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const fetchDocument = async (path) => {
          const docRef = doc(db, path);
          const docSnap = await getDoc(docRef);
          return docSnap.exists() ? docSnap.data() : null;
        };

        let data = null;
        const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
        const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;

        if (transformedCourseId) {
          data = await fetchDocument(`reviews/${transformedCourseId}`);
        }

        if (!data) {
          const sanitizedCourseId = courseId.split('_')[1];
          data = await fetchDocument(`reviews/${sanitizedCourseId}`);
        }

        if (data) {
          setReviews(data[professor] || []);
        } else {
          setError('No reviews found for this course.');
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to fetch reviews.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [courseId, professor]);

  const splitReviewText = (review) => {
    const [prefix, rest] = review.match(/(.*?: .*?: )([\s\S]*)/).slice(1, 3);
    return { prefix, rest };
  };

  const renderReviews = () => {
    return (
      <List>
        {reviews.map((review, idx) => {
          const { prefix, rest } = splitReviewText(review);
          return (
            <ReviewItem key={idx} prefix={prefix} rest={rest} />
          );
        })}
      </List>
    );
  };

  const ReviewItem = ({ prefix, rest }) => {
    const { ref, inView } = useInView({
      triggerOnce: true,
      threshold: 0.1,
    });

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ margin: '10px 0', borderRadius: '8px', overflow: 'hidden' }}
      >
        <ListItem sx={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '10px', fontFamily: 'SF Pro Display, sans-serif' }}>
          <ListItemText
            primary={
              <>
                <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold', fontSize: '1rem' }}>
                  {prefix}
                </Typography>{' '}
                <Typography component="span" sx={{ color: 'black', fontSize: '0.9rem' }}>
                  {rest}
                </Typography>
              </>
            }
          />
        </ListItem>
      </motion.div>
    );
  };

  // Extract the course name from the courseId (assuming the format is consistent)
  const courseName = courseId.split('__')[1]?.replace(/_/g, ' ') || courseId;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start', // Align items at the top
        alignItems: 'center',
        backgroundColor: '#E4E2DD', // Light background color
        color: '#571CE0', // Purple text color
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '20px'
      }}
    >
      <Container>
        <Typography variant="h4" gutterBottom>Reviews for {professor} in Class- {courseName}</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : reviews.length > 0 ? renderReviews() : (
          <Typography>No reviews available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default ProfessorReviewsPage;
