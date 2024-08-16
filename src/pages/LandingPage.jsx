import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, InputAdornment, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

const LandingPage = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/chat', { question });
      setAnswer(response.data.answer);
    } catch (error) {
      console.error('Error fetching answer:', error);
      setAnswer('Sorry, an error occurred while fetching the answer.');
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
      }}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography variant="h2" gutterBottom>
          CourseMe.
        </Typography>
        <Typography variant="h5" gutterBottom>
          AI Search Feature
        </Typography>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Ask about courses..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            sx={{
              bgcolor: 'white',
              borderRadius: '25px',
              width: '70%',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              '& .MuiOutlinedInput-root': {
                borderRadius: '25px',
                padding: '0 15px',
                height: '45px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
              '& .MuiInputAdornment-root': {
                marginRight: '10px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: '#571CE0' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            sx={{
              background: 'linear-gradient(90deg, rgba(87,28,224,1) 0%, rgba(144,19,254,1) 100%)',
              borderRadius: '25px',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 20px',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
          </Button>
        </Box>
        {answer && (
          <Typography variant="body1" sx={{ mt: 4, p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
            {answer}
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default LandingPage;