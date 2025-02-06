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
    <Box
      sx={{
        background: darkMode ? '#1C1F43' : '#f9f9f9',
        padding: '40px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: '32px',
          backgroundColor: darkMode ? '#24273c' : '#FFFFFF',
          borderRadius: '16px',
          border: darkMode ? '1px solid #44475a' : '1px solid #D1D1D6',
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            color: darkMode ? '#FFFFFF' : '#1D1D1F',
            marginBottom: '24px',
          }}
        >
          Write a Review for {courseId.split('_')[1]}
        </Typography>
        {error && (
          <Alert
            severity="error"
            sx={{
              marginBottom: '16px',
              backgroundColor: darkMode ? '#8B0000' : undefined,
              color: darkMode ? '#FFF' : undefined,
            }}
          >
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            fullWidth
            margin="normal"
            required
            placeholder="e.g., 24F"
            InputProps={{
              sx: {
                backgroundColor: darkMode ? '#333' : '#F2F2F7',
                color: darkMode ? '#FFF' : '#1D1D1F',
                borderRadius: '12px',
                '&:hover': {
                  backgroundColor: darkMode ? '#444' : '#E5E5EA',
                },
                '&.Mui-focused': {
                  backgroundColor: darkMode ? '#444' : '#E5E5EA',
                },
              },
            }}
            InputLabelProps={{
              sx: {
                color: darkMode ? '#BBB' : '#8E8E93',
              },
            }}
          />
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
                label="Professor"
                margin="normal"
                required
                placeholder="Select or type a professor"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    backgroundColor: darkMode ? '#333' : '#F2F2F7',
                    color: darkMode ? '#FFF' : '#1D1D1F',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: darkMode ? '#444' : '#E5E5EA',
                    },
                    '&.Mui-focused': {
                      backgroundColor: darkMode ? '#444' : '#E5E5EA',
                    },
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: darkMode ? '#BBB' : '#8E8E93',
                  },
                }}
              />
            )}
          />
          <TextField
            label="Review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={4}
            required
            placeholder="Write your review here..."
            InputProps={{
              sx: {
                backgroundColor: darkMode ? '#333' : '#F2F2F7',
                color: darkMode ? '#FFF' : '#1D1D1F',
                borderRadius: '12px',
                '&:hover': {
                  backgroundColor: darkMode ? '#444' : '#E5E5EA',
                },
                '&.Mui-focused': {
                  backgroundColor: darkMode ? '#444' : '#E5E5EA',
                },
              },
            }}
            InputLabelProps={{
              sx: {
                color: darkMode ? '#BBB' : '#8E8E93',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                fontWeight: 500,
                borderRadius: '12px',
                boxShadow: 'none',
                backgroundColor: darkMode ? '#571CE0' : '#571CE0',
                '&:hover': {
                  backgroundColor: darkMode ? '#684ACD' : '#7E55CC',
                },
                textTransform: 'none',
                paddingX: 4,
                paddingY: 1.5,
              }}
            >
              Submit Review
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddReviewForm;
