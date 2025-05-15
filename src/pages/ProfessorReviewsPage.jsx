import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Alert, List, ListItem, Paper, Divider } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';

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
      return { prefix: 'Review:', rest: review };
    }
  };
  
  const ReviewItem = ({ prefix, rest }) => {
    const { ref, inView } = useInView({
      threshold: 0.1,
      triggerOnce: true
    });

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ width: '100%' }}
      >
        <Paper
          elevation={0}
          sx={{
            my: 2.5,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: darkMode 
              ? 'rgba(30, 35, 60, 0.65)'
              : 'rgba(255, 255, 255, 0.65)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: darkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.2)' 
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode 
                ? '0 12px 40px rgba(0, 0, 0, 0.3)' 
                : '0 12px 40px rgba(0, 0, 0, 0.12)',
            }
          }}
        >
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, alignItems: 'flex-start' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              mb: 1.5,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-12px',
                top: '2px',
                height: '24px',
                width: '4px',
                borderRadius: '4px',
                background: darkMode 
                  ? 'linear-gradient(to bottom, #0A84FF, #0066CC)' 
                  : 'linear-gradient(to bottom, #0071E3, #0058B0)',
                boxShadow: darkMode ? '0 0 8px rgba(10, 132, 255, 0.5)' : 'none',
              }
            }}>
              <Typography
                component="span"
                sx={{
                  color: darkMode ? '#FFFFFF' : '#1D1D1F',
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                  fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                  lineHeight: 1.3,
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                {prefix}
              </Typography>
            </Box>
            <Typography
              component="p"
              sx={{
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                pl: '16px',
                lineHeight: 1.6,
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                letterSpacing: '-0.011em',
                fontWeight: 400,
                position: 'relative',
              }}
            >
              {rest}
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    );
  };

  const renderReviews = () => (
    <List sx={{ width: '100%', p: 0 }}>
      <AnimatePresence>
        {reviews.map((review, idx) => {
          const { prefix, rest } = splitReviewText(review);
          return <ReviewItem key={idx} prefix={prefix} rest={rest} />;
        })}
      </AnimatePresence>
    </List>
  );

  const courseName = courseId.split('__')[1]?.replace(/_/g, ' ') || courseId;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: darkMode 
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)' 
          : '#F9F9F9',
        padding: '20px',
        fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        color: darkMode ? '#FFFFFF' : '#000000',
        transition: 'background 0.3s ease, color 0.3s ease',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Box sx={{ mb: 4, mt: 2 }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                color: darkMode ? '#FFFFFF' : '#000000',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                mb: 1.5,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '2.75rem' }
              }}
            >
              {professor}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: '6px',
                  height: '26px',
                  background: darkMode ? '#0384fc' : '#0066CC',
                  borderRadius: '3px',
                  mr: 2
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                  color: darkMode ? '#34C759' : '#00693E',
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {courseName}
              </Typography>
            </Box>
            
            <Divider 
              sx={{ 
                mb: 4, 
                mt: 2, 
                opacity: darkMode ? 0.1 : 0.08,
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
              }} 
            />
          </Box>
        </motion.div>

       

        {loading ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: darkMode ? 'rgba(30, 35, 60, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            padding: 3
          }}>
            <Typography sx={{ 
              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500
            }}>
              Loading reviews...
            </Typography>
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              backgroundColor: darkMode ? 'rgba(40, 40, 45, 0.65)' : 'rgba(255, 255, 255, 0.65)',
              color: darkMode ? '#FFFFFF' : '#000000',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
              '& .MuiAlert-message': {
                fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500
              },
              '& .MuiAlert-icon': {
                color: darkMode ? '#FF3B30' : '#FF3B30'
              }
            }}
          >
            {error}
          </Alert>
        ) : reviews.length > 0 ? (
          renderReviews()
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: darkMode ? 'rgba(30, 35, 60, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            padding: 3 
          }}>
            <Typography sx={{ 
              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500
            }}>
              No reviews available for this professor
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProfessorReviewsPage;