import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Button, 
  FormControl,
  Autocomplete,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InputAdornment from '@mui/material/InputAdornment';
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
  const [classYear, setClassYear] = useState('');
  const [major, setMajor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      console.error('Error updating profile:', error);
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #fff 100%)',
        padding: '0 10%',
        color: '#1D1D1F',
        flexDirection: { xs: 'column', md: 'row' },
        textAlign: { xs: 'center', md: 'left' },
      }}
    >
      {/* Left section with logo and tagline */}
      <Box
        sx={{
          maxWidth: { xs: '100%', md: '50%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: { xs: 'center', md: 'flex-start' },
          mb: { xs: 0, md: 0 },
          pt: { xs: 5, md: 0 },
        }}
      >
        <RouterLink to="/landing">
          <img src="/1.png" alt="CourseMe Logo" style={{ maxWidth: '60%', height: 'auto', marginBottom: '10px' }} />
        </RouterLink>
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 400,
            color: '#1D1D1F',
            mb: 4,
          }}
        >
          Complete your profile{' '}
          <ReactTypingEffect
            text={["and personalise your experience."]}
            speed={100}
            eraseSpeed={50}
            eraseDelay={3000}
            typingDelay={1000}
            displayTextRenderer={(text, i) => {
              const isTypingComplete = i === 0 && text === "Dartmouth";
              return (
                <span style={{ color: '#00693E' }}>
                  {text}
                  {isTypingComplete && <span style={{ color: '#F26655' }}>.</span>}
                </span>
              );
            }}
          />
        </Typography>
      </Box>

      {/* Right section with form */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: { xs: '85%', md: '400px' },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.15)',
          padding: { xs: '20px', md: '30px' },
          color: '#1D1D1F',
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
                  bgcolor: '#FFFFFF',
                  borderRadius: '8px',
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                      transition: 'border-color 0.3s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: '#B0B0B0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#571CE0',
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolIcon sx={{ color: '#571CE0' }} />
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
                  bgcolor: '#FFFFFF',
                  borderRadius: '8px',
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#E0E0E0',
                      transition: 'border-color 0.3s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: '#B0B0B0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#571CE0',
                    },
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ color: '#571CE0' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              marginBottom: '20px',
              fontFamily: 'SF Pro Display, sans-serif',
              color: '#1D1D1F',
            }}
          >
            <strong>Please Note:</strong> This information helps us personalize your experience.
          </Typography>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#4285F4',
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
            Complete Profile
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CompleteProfilePage;