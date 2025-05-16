import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Alert,
  Autocomplete,
  createFilterOptions,
  Box,
  Paper,
} from '@mui/material';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const AddReviewForm = ({ onReviewAdded, darkMode }) => {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const [term, setTerm] = useState('');
  const [professor, setProfessor] = useState('');
  const [review, setReview] = useState('');
  const [error, setError] = useState(null);
  const [professorsList, setProfessorsList] = useState([]);

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        let data = null;
        const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
        const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
        const sanitizedCourseId = courseId.split('_')[1];

        const fetchDocument = async (path) => {
          const docRef = doc(db, path);
          const docSnap = await getDoc(docRef);
          return docSnap.exists() ? docSnap.data() : null;
        };

        if (transformedCourseId) {
          data = await fetchDocument(`reviews/${transformedCourseId}`);
        }

        if (!data) {
          data = await fetchDocument(`reviews/${sanitizedCourseId}`);
        }

        if (data) {
          const professors = Object.keys(data);
          setProfessorsList(professors);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching professors:', error);
      }
    };

    fetchProfessors();
  }, [courseId]);

  const sanitizeFieldPath = (path) => {
    return path.replace(/\./g, '_');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!term || !professor || !review) {
      setError('All fields are required');
      return;
    }

    try {
      const sanitizedProfessor = sanitizeFieldPath(professor);
      const reviewData = `${term} with ${professor}: ${review}`;

      let data = null;
      const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
      const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
      const sanitizedCourseId = courseId.split('_')[1];

      const courseDocRef = doc(db, 'reviews', transformedCourseId || sanitizedCourseId);
      const courseDocSnap = await getDoc(courseDocRef);

      if (!courseDocSnap.exists()) {
        await setDoc(courseDocRef, { [sanitizedProfessor]: [] });
      }

      await updateDoc(courseDocRef, {
        [sanitizedProfessor]: arrayUnion(reviewData),
      });

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        reviews: arrayUnion({
          courseId: transformedCourseId || sanitizedCourseId,
          term,
          professor,
          review,
        }),
      });

      if (!professorsList.includes(professor)) {
        setProfessorsList([...professorsList, professor]);
      }

      onReviewAdded();
      setTerm('');
      setProfessor('');
      setReview('');
      setError(null);
    } catch (error) {
      console.error('Error adding review:', error.message);
      setError('Failed to add review. Error: ' + error.message);
    }
  };

  const filterOptions = createFilterOptions({
    matchFrom: 'start',
    stringify: (option) => option,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Box
        sx={{
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          background: darkMode 
            ? 'rgba(30, 35, 61, 0.6)' 
            : 'rgba(248, 249, 251, 0.7)',
          padding: { xs: '24px', sm: '32px', md: '40px' },
          borderRadius: '24px',
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          border: darkMode 
            ? '1px solid rgba(255, 255, 255, 0.08)' 
            : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: darkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.2)' 
            : '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        <Box sx={{ position: 'relative', mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              mb: 1,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-12px',
                width: '4px',
                height: '28px',
                borderRadius: '2px',
                background: darkMode 
                  ? 'linear-gradient(to bottom, #FF9F0A, #FF7D0A)' 
                  : 'linear-gradient(to bottom, #FF9500, #FF7D00)',
                boxShadow: darkMode ? '0 0 8px rgba(255, 159, 10, 0.5)' : 'none',
              }
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
                fontWeight: 700,
                color: darkMode ? '#FFFFFF' : '#1D1D1F',
                fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' },
                letterSpacing: '-0.02em',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
              }}
            >
              Write a Review
            </Typography>
          </Box>
          <Typography
            variant="body1"
            sx={{
              fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              fontSize: { xs: '0.9rem', sm: '0.95rem' },
              ml: 0.5,
              letterSpacing: '-0.01em',
              fontWeight: 400,
            }}
          >
            for {courseId.split('_')[1].replace(/_/g, ' ')}
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              marginBottom: '24px',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: darkMode ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)',
              color: darkMode ? '#FF3B30' : '#FF3B30',
              border: darkMode ? '1px solid rgba(255, 59, 48, 0.2)' : '1px solid rgba(255, 59, 48, 0.15)',
              padding: '12px 16px',
              '& .MuiAlert-icon': {
                color: darkMode ? '#FF3B30' : '#FF3B30',
              },
              '& .MuiAlert-message': {
                fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem',
                fontWeight: 600,
                mb: 1,
                letterSpacing: '-0.01em',
                ml: 0.5,
              }}
            >
              Term
            </Typography>
            <TextField
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              fullWidth
              required
              placeholder="e.g., 24F"
              variant="outlined"
              size="medium"
              InputProps={{
                sx: {
                  backgroundColor: darkMode ? 'rgba(30, 35, 61, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                  color: darkMode ? '#FFFFFF' : '#1D1D1F',
                  borderRadius: '12px',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  height: '56px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                  letterSpacing: '-0.01em',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(40, 45, 71, 0.8)' : 'rgba(248, 249, 251, 0.9)',
                    boxShadow: darkMode ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(0, 0, 0, 0.08)',
                  },
                  '&.Mui-focused': {
                    boxShadow: darkMode ? '0 0 0 3px rgba(10, 132, 255, 0.3)' : '0 0 0 3px rgba(0, 113, 227, 0.2)',
                  }
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem',
                fontWeight: 600,
                mb: 1,
                letterSpacing: '-0.01em',
                ml: 0.5,
              }}
            >
              Professor
            </Typography>
            <Autocomplete
              options={professorsList}
              filterOptions={filterOptions}
              getOptionLabel={(option) => option}
              freeSolo
              value={professor}
              onChange={(event, newValue) => {
                setProfessor(newValue);
              }}
              onInputChange={(event, newInputValue) => {
                setProfessor(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  placeholder="Select or type a professor"
                  fullWidth
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    ...params.InputProps,
                    sx: {
                      backgroundColor: darkMode ? 'rgba(30, 35, 61, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                      borderRadius: '12px',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s ease',
                      height: '56px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                      letterSpacing: '-0.01em',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(40, 45, 71, 0.8)' : 'rgba(248, 249, 251, 0.9)',
                        boxShadow: darkMode ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        boxShadow: darkMode ? '0 0 0 3px rgba(10, 132, 255, 0.3)' : '0 0 0 3px rgba(0, 113, 227, 0.2)',
                      }
                    },
                  }}
                />
              )}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem',
                fontWeight: 600,
                mb: 1,
                letterSpacing: '-0.01em',
                ml: 0.5,
              }}
            >
              Review
            </Typography>
            <TextField
              value={review}
              onChange={(e) => setReview(e.target.value)}
              fullWidth
              multiline
              rows={5}
              required
              placeholder="Write your review here..."
              variant="outlined"
              InputProps={{
                sx: {
                  backgroundColor: darkMode ? 'rgba(30, 35, 61, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                  color: darkMode ? '#FFFFFF' : '#1D1D1F',
                  borderRadius: '12px',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                  fontSize: '0.95rem',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.6,
                  padding: '16px',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(40, 45, 71, 0.8)' : 'rgba(248, 249, 251, 0.9)',
                    boxShadow: darkMode ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(0, 0, 0, 0.08)',
                  },
                  '&.Mui-focused': {
                    boxShadow: darkMode ? '0 0 0 3px rgba(10, 132, 255, 0.3)' : '0 0 0 3px rgba(0, 113, 227, 0.2)',
                  }
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                variant="contained"
                sx={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                  fontWeight: 600,
                  borderRadius: '12px',
                  boxShadow: darkMode 
                    ? '0 4px 16px rgba(10, 132, 255, 0.3)' 
                    : '0 4px 16px rgba(0, 113, 227, 0.2)',
                  background: darkMode 
                    ? 'linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)' 
                    : 'linear-gradient(135deg, #0071E3 0%, #0058B0 100%)',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
                  letterSpacing: '-0.01em',
                  textTransform: 'none',
                  transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  '&:hover': {
                    background: darkMode 
                      ? 'linear-gradient(135deg, #0091FF 0%, #0077E6 100%)' 
                      : 'linear-gradient(135deg, #0077ED 0%, #0062C4 100%)',
                    boxShadow: darkMode 
                      ? '0 6px 20px rgba(10, 132, 255, 0.4)' 
                      : '0 6px 20px rgba(0, 113, 227, 0.3)',
                  }
                }}
              >
                Submit Review
              </Button>
            </motion.div>
          </Box>
        </form>
      </Box>
    </motion.div>
  );
};

export default AddReviewForm;
