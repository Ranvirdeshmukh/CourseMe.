// src/pages/CompleteProfilePage.jsx

import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  Autocomplete,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReactTypingEffect from 'react-typing-effect';

const majorOptions = [
  'African and African American Studies',
  'Anthropology',
  'Art History',
  'Asian Societies, Cultures, and Languages',
  'Biology',
  'Biochemistry',
  'Biomedical Engineering',
  'Chemistry',
  'Chinese Language and Literature',
  'Classical Languages and Literature',
  'Classical Studies',
  'Cognitive Science',
  'Comparative Literature',
  'Computer Science',
  'Earth Sciences',
  'Economics',
  'Education',
  'Engineering',
  'English',
  'Environmental Studies',
  'Film and Media Studies',
  'French',
  'Geography',
  'German Studies',
  'Government',
  'History',
  'Human-Centered Design',
  'Italian Studies',
  'Japanese Language and Literature',
  'Jewish Studies',
  'Linguistics',
  'Mathematics',
  'Middle Eastern Studies',
  'Music',
  'Native American Studies',
  'Neuroscience',
  'Philosophy',
  'Physics',
  'Political Science',
  'Psychological and Brain Sciences',
  'Religion',
  'Russian Language and Literature',
  'Sociology',
  'Spanish',
  'Theater',
  'Womens, Gender, and Sexuality Studies',
  'Undecided',
  'Graduate Student- MEM, etc.'
];

const yearOptions = [2025, 2026, 2027, 2028, 2029];

const CompleteProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme(); // Access the current theme
  const [classYear, setClassYear] = useState('');
  const [major, setMajor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        major: major,
        classYear: classYear,
      });
      navigate('/');
    } catch (error) {
      setError('Failed to update profile');
      setSnackbarOpen(true);
      console.error('Error updating profile:', error);
    }
    setLoading(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.palette.background.default, // Use theme's background
        padding: '0 10%',
        color: theme.palette.text.primary, // Use theme's text color
        flexDirection: { xs: 'column', md: 'row' }, // Stack vertically on mobile
        textAlign: { xs: 'center', md: 'left' }, // Center text on mobile, align left on desktop
      }}
    >
      {/* Logo and tagline section */}
      <Box
        sx={{
          maxWidth: { xs: '100%', md: '50%' }, // Adjust width for mobile and desktop
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start', // Align content to the top
          alignItems: { xs: 'center', md: 'flex-start' }, // Center the logo on mobile, left-align on desktop
          mb: { xs: 0, md: 0 }, // Add margin for mobile spacing
          pt: { xs: 5, md: 0 }, // Add padding-top on mobile to push content down
        }}
      >
        <RouterLink to="/landing">
          <img
            src={theme.palette.mode === 'dark' ? '/2.png' : '/1.png'} // Conditional image based on theme
            alt="CourseMe Logo"
            style={{ maxWidth: '60%', height: 'auto', marginBottom: '10px' }}
          />
        </RouterLink>
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 400,
            color: theme.palette.text.primary,
            mb: 4,
          }}
        >
          Complete your profile{' '}
          <ReactTypingEffect
            text={['and personalise your experience.']}
            speed={100}
            eraseSpeed={50}
            eraseDelay={3000}
            typingDelay={1000}
            displayTextRenderer={(text, i) => {
              // Check if the typing is complete
              const isTypingComplete = i === 0 && text === 'and personalise your experience.';

              return (
                <span style={{ color: '#00693E' }}>
                  {text}
                  {/* Conditionally show the full stop when typing is complete */}
                  {isTypingComplete && <span style={{ color: '#F26655' }}>.</span>}
                </span>
              );
            }}
          />
        </Typography>
      </Box>

      {/* Profile form section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: { xs: '85%', md: '400px' }, // Adjust width for mobile
          backgroundColor: theme.palette.background.paper, // Use theme's paper background
          borderRadius: '12px',
          boxShadow: theme.shadows[5],
          padding: { xs: '20px', md: '30px' }, // Adjust padding for mobile
          color: theme.palette.text.primary, // Use theme's text color
          marginBottom: { xs: 4, md: 0 },
        }}
      >
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
          <Autocomplete
            value={major}
            onChange={(event, newValue) => setMajor(newValue)}
            options={majorOptions}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Major"
                required
                sx={{
                  mb: 2,
                  bgcolor: theme.palette.background.default,
                  borderRadius: '8px',
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    height: '48px',
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                      transition: 'border-color 0.3s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: theme.palette.text.secondary,
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolIcon sx={{ color: '#571ce0' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Autocomplete
            value={classYear}
            onChange={(event, newValue) => setClassYear(newValue)}
            options={yearOptions}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Class Year"
                required
                sx={{
                  mb: 2,
                  bgcolor: theme.palette.background.default,
                  borderRadius: '8px',
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    height: '48px',
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                      transition: 'border-color 0.3s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: theme.palette.text.secondary,
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ color: '#571ce0' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Typography
            variant="body2"
            sx={{
              marginBottom: '20px',
              fontFamily: 'SF Pro Display, sans-serif',
              color: theme.palette.text.primary,
            }}
          >
            <strong>Please Note:</strong> This information helps us personalize your experience.
          </Typography>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#000080', // Google Blue
              color: '#fff',
              fontWeight: 'bold',
              mb: 2,
              height: '48px',
              borderRadius: '20px',
              width: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                backgroundColor: '#357AE8',
                transform: 'scale(1.05)',
              },
            }}
          >
            {loading ? 'Completing...' : 'Complete Profile'}
          </Button>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompleteProfilePage;
