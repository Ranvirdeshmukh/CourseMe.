import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Box, Typography, TextField, Button, 
  InputAdornment, CircularProgress, Paper, Snackbar,
  Alert, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const API_URL = 'https://coursemebot.pythonanywhere.com/api/chat';

const LandingPage = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [department, setDepartment] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    setDepartment('');
    setCourseNumber('');

    try {
      const response = await axios.post(API_URL, 
        { question },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('API Response:', response.data); // Log the response for debugging
      if (typeof response.data === 'object' && response.data.answer) {
        setAnswer(response.data.answer);
        setDepartment(response.data.department || '');
        setCourseNumber(response.data.course_number || '');
      } else if (typeof response.data === 'string') {
        setAnswer(response.data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error fetching answer:', error);
      setError('An error occurred while fetching the answer. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Extract department and course number from the answer if not already set
    if (answer && !department && !courseNumber) {
      const match = answer.match(/^([A-Z]{2,4})\s*(\d+(?:\.\d+)?)/);
      if (match) {
        setDepartment(match[1]);
        setCourseNumber(match[2]);
      }
    }
  }, [answer, department, courseNumber]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
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
        fontFamily: 'SF Pro Display, sans-serif',
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
          <Typography variant="h2" align="center" gutterBottom>
            CourseMe.
          </Typography>
          <Typography variant="h5" align="center" gutterBottom>
            AI Search Feature
          </Typography>
          <Box component="form" onSubmit={handleSearch} sx={{ mt: 4 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask about courses..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              sx={{
                bgcolor: 'white',
                borderRadius: '25px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '25px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#571CE0' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                mt: 2,
                background: 'linear-gradient(90deg, rgba(87,28,224,1) 0%, rgba(144,19,254,1) 100%)',
                borderRadius: '25px',
                color: 'white',
                fontWeight: 'bold',
                padding: '10px 20px',
                '&:hover': {
                  background: 'linear-gradient(90deg, rgba(87,28,224,0.8) 0%, rgba(144,19,254,0.8) 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
            </Button>
          </Box>
          {answer && (
            <Paper elevation={2} sx={{ mt: 4, p: 3, bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2 }}>
              {(department || courseNumber) && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {department && <Chip label={`Department: ${department}`} color="primary" />}
                  {courseNumber && <Chip label={`Course: ${courseNumber}`} color="secondary" />}
                </Box>
              )}
              <Typography variant="body1">
                {(department && courseNumber) 
                  ? answer.replace(new RegExp(`^${department}\\s*${courseNumber}\\s*`), '')
                  : answer
                }
              </Typography>
            </Paper>
          )}
        </Paper>
      </Container>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LandingPage;