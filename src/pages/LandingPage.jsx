// src/pages/LandingPage.js
import React from 'react';
import { Container, Box, Typography, TextField, Button, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const LandingPage = () => (
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
        CourseReview.
      </Typography>
      <Typography variant="h5" gutterBottom>
        AI Search Feature
      </Typography>
      <Box component="form" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Search for courses..."
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
          Search
        </Button>
      </Box>
    </Container>
  </Box>
);

export default LandingPage;
