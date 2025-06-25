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
  'Graduate Student- MEM,Tuck,etc.'
];

// Dynamic class year generation based on current date
const generateClassYears = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based, so December is 11
  
  // If it's December or later, consider the next academic year cycle
  const academicYear = currentMonth >= 11 ? currentYear + 1 : currentYear;
  
  // Generate class years for current students (typically 4-6 years from now)
  // Include some past years for transfer students and current academic year
  const years = [];
  
  // Add previous year for any remaining students
  years.push(academicYear);
  
  // Add next 5 years for incoming freshmen through future classes
  for (let i = 1; i <= 5; i++) {
    years.push(academicYear + i);
  }
  
  return years.sort((a, b) => a - b);
};

const yearOptions = generateClassYears();

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
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : theme.palette.background.paper,
          borderRadius: '12px',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : theme.shadows[5],
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: { xs: '20px', md: '30px' }, // Adjust padding for mobile
          color: theme.palette.text.primary, // Use theme's text color
          marginBottom: { xs: 4, md: 0 },
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              : '0 10px 25px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            transform: 'translateY(-2px)',
          }
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
            PaperComponent={({ children, ...other }) => (
              <Box
                {...other}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '12px',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                  marginTop: '4px',
                  overflow: 'hidden',
                  '& .MuiAutocomplete-listbox': {
                    padding: '8px',
                    '& .MuiAutocomplete-option': {
                      borderRadius: '8px',
                      margin: '2px 0',
                      fontFamily: 'SF Pro Display, sans-serif',
                      fontSize: '15px',
                      color: theme.palette.text.primary,
                      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(139, 92, 246, 0.15)' 
                          : 'rgba(87, 28, 224, 0.08)',
                        transform: 'translateX(4px)',
                      },
                      '&[aria-selected="true"]': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(139, 92, 246, 0.2)' 
                          : 'rgba(87, 28, 224, 0.12)',
                        color: theme.palette.mode === 'dark' ? '#A78BFA' : '#4C1D95',
                        fontWeight: 500,
                      },
                    },
                  },
                }}
              >
                {children}
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Major"
                required
                sx={{
                  mb: 2,
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.03)' 
                      : theme.palette.background.default,
                    borderRadius: '12px',
                    height: '52px',
                    border: theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.08)' 
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(87, 28, 224, 0.02)',
                      border: theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.12)' 
                        : '1px solid rgba(87, 28, 224, 0.15)',
                      transform: 'translateY(-1px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                        : '0 4px 20px rgba(87, 28, 224, 0.08)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.06)' 
                        : 'rgba(87, 28, 224, 0.03)',
                      border: theme.palette.mode === 'dark' 
                        ? '1px solid rgba(87, 28, 224, 0.4)' 
                        : '1px solid rgba(87, 28, 224, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(87, 28, 224, 0.15)'
                        : '0 6px 25px rgba(87, 28, 224, 0.12), 0 0 0 3px rgba(87, 28, 224, 0.1)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                    fontFamily: 'SF Pro Display, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    '&::placeholder': {
                      color: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.5)' 
                        : 'rgba(0, 0, 0, 0.6)',
                      opacity: 1,
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolIcon sx={{ 
                        color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                        transition: 'color 0.3s ease'
                      }} />
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
            PaperComponent={({ children, ...other }) => (
              <Box
                {...other}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(30, 30, 30, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '12px',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                  marginTop: '4px',
                  overflow: 'hidden',
                  '& .MuiAutocomplete-listbox': {
                    padding: '8px',
                    '& .MuiAutocomplete-option': {
                      borderRadius: '8px',
                      margin: '2px 0',
                      fontFamily: 'SF Pro Display, sans-serif',
                      fontSize: '15px',
                      color: theme.palette.text.primary,
                      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(139, 92, 246, 0.15)' 
                          : 'rgba(87, 28, 224, 0.08)',
                        transform: 'translateX(4px)',
                      },
                      '&[aria-selected="true"]': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(139, 92, 246, 0.2)' 
                          : 'rgba(87, 28, 224, 0.12)',
                        color: theme.palette.mode === 'dark' ? '#A78BFA' : '#4C1D95',
                        fontWeight: 500,
                      },
                    },
                  },
                }}
              >
                {children}
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Class Year"
                required
                sx={{
                  mb: 2,
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.03)' 
                      : theme.palette.background.default,
                    borderRadius: '12px',
                    height: '52px',
                    border: theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255, 255, 255, 0.08)' 
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(87, 28, 224, 0.02)',
                      border: theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255, 255, 255, 0.12)' 
                        : '1px solid rgba(87, 28, 224, 0.15)',
                      transform: 'translateY(-1px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                        : '0 4px 20px rgba(87, 28, 224, 0.08)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.06)' 
                        : 'rgba(87, 28, 224, 0.03)',
                      border: theme.palette.mode === 'dark' 
                        ? '1px solid rgba(87, 28, 224, 0.4)' 
                        : '1px solid rgba(87, 28, 224, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 6px 25px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(87, 28, 224, 0.15)'
                        : '0 6px 25px rgba(87, 28, 224, 0.12), 0 0 0 3px rgba(87, 28, 224, 0.1)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                    fontFamily: 'SF Pro Display, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    '&::placeholder': {
                      color: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.5)' 
                        : 'rgba(0, 0, 0, 0.6)',
                      opacity: 1,
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ 
                        color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                        transition: 'color 0.3s ease'
                      }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Box
            sx={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(139, 92, 246, 0.1)' 
                : 'rgba(87, 28, 224, 0.08)',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(139, 92, 246, 0.2)' 
                : '1px solid rgba(87, 28, 224, 0.15)',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                color: theme.palette.text.primary,
                fontSize: '14px',
                lineHeight: 1.4,
              }}
            >
              <strong>Please Note:</strong> This information helps us personalize your experience.
            </Typography>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #8B5CF6 0%, #571CE0 100%)'
                : 'linear-gradient(135deg, #571CE0 0%, #3B0F9F 100%)',
              color: '#FFFFFF',
              fontFamily: 'SF Pro Display, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              mb: 2,
              height: '52px',
              borderRadius: '14px',
              width: '100%',
              border: 'none',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 24px rgba(87, 28, 224, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              },
              '&:hover': {
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 12px 32px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : '0 12px 32px rgba(87, 28, 224, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              },
              '&:active': {
                transform: 'translateY(-1px) scale(1.01)',
              },
              '&:disabled': {
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                color: theme.palette.text.disabled,
                boxShadow: 'none',
                transform: 'none',
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
