// src/pages/AllClassesPage.js
import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AllClassesPage = () => (
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
      <Typography variant="h4" gutterBottom>All Classes Sorted by Department</Typography>
      <Typography>List of all classes sorted by department will be displayed here.</Typography>
    </Container>
  </Box>
);

export default AllClassesPage;
