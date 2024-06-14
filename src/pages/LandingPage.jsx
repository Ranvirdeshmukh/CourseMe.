// src/pages/LandingPage.js
import React from 'react';
import { Container, Box, Typography, TextField, Button } from '@mui/material';

const LandingPage = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(to bottom, #571CE0, black)',
      color: '#fff',
      textAlign: 'center',
      fontFamily: 'SF Pro Display, sans-serif', // Applying the font
    }}
  >
    <Container>
      <Typography variant="h2" gutterBottom>
        College Course Review
      </Typography>
      <Typography variant="h5" gutterBottom>
        AI Search Feature
      </Typography>
      <Box component="form" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <TextField
          variant="outlined"
          placeholder="Search for courses..."
          sx={{ bgcolor: 'white', borderRadius: 1, width: '70%', marginRight: 2 }}
        />
        <Button variant="contained" color="primary" type="submit">
          Search
        </Button>
      </Box>
    </Container>
  </Box>
);

export default LandingPage;
