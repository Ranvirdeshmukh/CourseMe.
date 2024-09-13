import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// List of common majors
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
  'Women’s, Gender, and Sexuality Studies',
  'Undecided'
];


const CompleteProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [classYear, setClassYear] = useState('');
  const [major, setMajor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClassYearChange = (event) => {
    setClassYear(event.target.value);
  };

  const handleMajorChange = (event, newValue) => {
    setMajor(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      // Update user profile in Firestore
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
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle, #571CE0 0%, #571CE0 40%, black 70%)',
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '20px', // Reduced padding for mobile
      }}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '90%', // Adjusted width for mobile
          maxWidth: '400px',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          padding: { xs: '20px', md: '40px' }, // Dynamic padding for mobile and desktop
          color: '#1D1D1F',
          margin: '20px auto',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            color: '#1D1D1F',
            mb: 2,
            textAlign: 'left',
            fontSize: { xs: '1.5rem', md: '2.125rem' }, // Responsive font size
          }}
        >
          Let’s Get to Know You Better!!
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                value={major}
                onChange={handleMajorChange}
                freeSolo // Allows users to enter their own values if not in the list
                options={majorOptions}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Major"
                    required
                    fullWidth
                    sx={{
                      bgcolor: '#FFFFFF',
                      borderRadius: '8px',
                      boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        height: '48px',
                        '& fieldset': {
                          borderColor: '#E0E0E0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#B0B0B0',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#571CE0',
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="class-year-label">Class Year</InputLabel>
                <Select
                  labelId="class-year-label"
                  id="class-year"
                  value={classYear}
                  label="Class Year"
                  onChange={handleClassYearChange}
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                    textAlign: 'left',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      height: '48px',
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#B0B0B0',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#571CE0',
                      },
                    },
                  }}
                >
                  <MenuItem value={2025}>2025</MenuItem>
                  <MenuItem value={2026}>2026</MenuItem>
                  <MenuItem value={2027}>2027</MenuItem>
                  <MenuItem value={2028}>2028</MenuItem>
                  <MenuItem value={2029}>2029</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{
              mt: 3,
              background: 'linear-gradient(90deg, rgba(87,28,224,1) 0%, rgba(144,19,254,1) 100%)',
              borderRadius: '8px',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              padding: { xs: '8px 16px', md: '10px 20px' }, // Adjusted for mobile
              textTransform: 'none',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            Complete Profile
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default CompleteProfilePage;
