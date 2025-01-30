import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Alert, List, ListItem, ListItemText } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

const ProfessorReviewsPage = ({darkMode}) => {
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
    const match = review.match(/(.*?: .*?: )([\s\S]*)/);
    if (match && match.length >= 3) {
      const [prefix, rest] = match.slice(1, 3);
      return { prefix, rest };
    } else {
      // Handle the case where the pattern does not match
      // You can decide how to structure the prefix and rest in such cases
      return { prefix: 'Review:', rest: review };
    }
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
            background: darkMode 
              ? 'linear-gradient(to right, rgba(30, 30, 30, 0.8), rgba(50, 50, 50, 0.8))' // Dark mode background
              : 'linear-gradient(to right, rgba(238, 242, 255, 0.8), rgba(245, 243, 255, 0.8))', // Light mode background
            borderRadius: '12px',
            overflow: 'hidden',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(99, 102, 241, 0.1)',
            boxShadow: darkMode 
              ? '0 4px 6px -1px rgba(255, 255, 255, 0.05), 0 2px 4px -1px rgba(255, 255, 255, 0.03)' 
              : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: darkMode ? 'translateY(-2px)' : 'translateY(-2px)',
              boxShadow: darkMode 
                ? '0 6px 12px -2px rgba(255, 255, 255, 0.08), 0 3px 6px -2px rgba(255, 255, 255, 0.05)'
                : '0 6px 12px -2px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.05)',
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
                    bgcolor: darkMode ? '#571CE0' : 'primary.main', // Adjust color based on dark mode
                    borderRadius: '4px'
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    color: darkMode ? '#FFFFFF' : 'text.primary', // Text color based on dark mode
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
                  color: darkMode ? '#E0E0E0' : 'text.secondary', // Text color based on dark mode
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

  // Step 2: Define color variables based on darkMode
  const mainBgColor = darkMode 
    ? 'linear-gradient(135deg, #1C093F 0%, #0C0F33 100%)' 
    : 'linear-gradient(135deg, #F9FAFB 0%, #EEF2FF 100%)';
  const textPrimaryColor = darkMode ? '#FFFFFF' : '#333333';
  const textSecondaryColor = darkMode ? '#E0E0E0' : '#666666';
  const headerTextColor = darkMode ? '#FFFFFF' : '#34495E';
  const alertBgColor = darkMode ? '#333333' : '#F9F9F9';
  const alertTextColor = darkMode ? '#FFFFFF' : '#333333';
  const listItemBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
  const listItemBorderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)';
  const listItemShadow = darkMode 
    ? '0 4px 6px -1px rgba(255, 255, 255, 0.05), 0 2px 4px -1px rgba(255, 255, 255, 0.03)'
    : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: mainBgColor, // Apply main background color
        padding: '20px',
        fontFamily: 'SF Pro Display, sans-serif',
        color: textPrimaryColor, // Apply primary text color
        transition: 'background 0.3s ease, color 0.3s ease',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              color: headerTextColor, // Header text color based on dark mode
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
              color: darkMode ? '#34C759' : 'primary.main', // Adjust color based on dark mode
              fontWeight: 500,
              opacity: 0.9
            }}
          >
            {courseName}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: textSecondaryColor }}>
              Loading...
            </Typography>
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              backgroundColor: alertBgColor, // Alert background based on dark mode
              color: alertTextColor, // Alert text color based on dark mode
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
            <Typography sx={{ color: textSecondaryColor }}>
              No reviews available
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProfessorReviewsPage;