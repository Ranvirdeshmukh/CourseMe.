// src/pages/EasyClassesPage.js
import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const EasyClassesPage = () => (
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
      <Typography variant="h4" gutterBottom>Easy Classes</Typography>
      <Typography>List of easy classes will be displayed here.</Typography>
    </Container>
  </Box>
);

export default EasyClassesPage;
