import React, { useRef, useState } from 'react';
import { Container, Typography, Box, TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel, Autocomplete } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// List of common majors
const majorOptions = [
  'Computer Science',
  'Biology',
  'Economics',
  'Mathematics',
  'Engineering',
  'History',
  'English',
  'Psychology',
  'Physics',
  'Political Science',
  'Chemistry',
  'Environmental Studies',
  'Sociology',
  'Art History',
  'Music',
  'Philosophy',
  'Anthropology',
];

const CompleteProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [classYear, setClassYear] = useState('');
  const [major, setMajor] = useState('');  // State for major
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClassYearChange = (event) => {
    setClassYear(event.target.value);
  };

  const handleMajorChange = (event, newValue) => {
    setMajor(newValue);  // Update the major value
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
        padding: '40px',
      }}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '50%',
          maxWidth: '400px',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          color: '#1D1D1F',
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
                freeSolo  // Allows users to enter their own values if not in the list
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
        textAlign: 'left',  // Aligns the selected value to the left
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
      <MenuItem value={2025} sx={{ justifyContent: 'flex-start' }}>2025</MenuItem>
      <MenuItem value={2026} sx={{ justifyContent: 'flex-start' }}>2026</MenuItem>
      <MenuItem value={2027} sx={{ justifyContent: 'flex-start' }}>2027</MenuItem>
      <MenuItem value={2028} sx={{ justifyContent: 'flex-start' }}>2028</MenuItem>
      <MenuItem value={2029} sx={{ justifyContent: 'flex-start' }}>2029</MenuItem>
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
              padding: '10px 20px',
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
