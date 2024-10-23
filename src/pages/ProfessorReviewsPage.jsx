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

  const ReviewItem = ({ prefix, rest }) => {
    const { ref, inView } = useInView({
      threshold: 0.1,
    });

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%' }}
      >
        <Box
          sx={{
            my: 3,
            background: 'linear-gradient(to right, rgba(238, 242, 255, 0.8), rgba(245, 243, 255, 0.8))',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.05)',
            }
          }}
        >
          <ListItem sx={{ p: 4 }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: '4px',
                    height: '24px',
                    bgcolor: 'primary.main',
                    borderRadius: '4px'
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    fontSize: '1rem'
                  }}
                >
                  {prefix}
                </Typography>
              </Box>
              <Typography
                component="p"
                sx={{
                  color: 'text.secondary',
                  pl: '28px',
                  lineHeight: 1.7,
                  fontSize: '0.95rem'
                }}
              >
                {rest}
              </Typography>
            </Box>
          </ListItem>
        </Box>
      </motion.div>
    );
  };

  const renderReviews = () => (
    <List sx={{ width: '100%', p: 0 }}>
      {reviews.map((review, idx) => {
        const { prefix, rest } = splitReviewText(review);
        return <ReviewItem key={idx} prefix={prefix} rest={rest} />;
      })}
    </List>
  );

  const courseName = courseId.split('__')[1]?.replace(/_/g, ' ') || courseId;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F9FAFB 0%, #EEF2FF 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              mb: 1
            }}
          >
            Reviews for {professor}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              opacity: 0.9
            }}
          >
            {courseName}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Loading...
            </Typography>
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: '0.95rem'
              }
            }}
          >
            {error}
          </Alert>
        ) : reviews.length > 0 ? (
          renderReviews()
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              No reviews available
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProfessorReviewsPage;