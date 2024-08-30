import React, { useState } from 'react';
import axios from 'axios';
import { 
  Container, Box, Typography, TextField, Button, 
  InputAdornment, CircularProgress, Paper, Snackbar,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const API_URL = 'https://coursemebot.pythonanywhere.com/api/chat';

const LandingPage = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await axios.post(API_URL, 
        { question },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setAnswer(response.data.answer);
    } catch (error) {
      console.error('Error fetching answer:', error.response ? error.response.data : error.message);
      setError('An error occurred while fetching the answer. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };


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
              <Typography variant="body1">
                {answer}
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