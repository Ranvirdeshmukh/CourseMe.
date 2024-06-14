// src/pages/ProfilePage.js
import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ProfilePage = () => (
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
    <Container>
      <Typography variant="h4" gutterBottom>Profile Page</Typography>
      <Typography>Welcome to your profile page!</Typography>
    </Container>
  </Box>
);

export default ProfilePage;
