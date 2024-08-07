// src/pages/LandingPage.js
import React from 'react';
import { Container, Box, Typography, TextField, Button, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom'; // Import Link for navigation

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
      padding: '0 20px', // Ensure padding for smaller screens
    }}
  >
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        maxWidth: '800px', // Limit the maximum width for better readability
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h6"
        component={Link}
        to="/"
        sx={{
          fontFamily: 'SF Pro Display, sans-serif',
          fontWeight: 500, // Bold font weight
          fontSize: { xs: '3rem', md: '4rem' }, // Responsive font size
          textDecoration: 'none',
          color: '#fff', // White color for the main heading
          cursor: 'pointer',
          mb: '20px', // Margin below the main heading
        }}
      >
        CourseMe<span style={{ color: '#F26655' }}>.</span>
        </Typography>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 500,
          fontSize: { xs: '1.25rem', md: '1.5rem' }, // Responsive font size
          marginBottom: '30px', // Add space between the heading and search
          color: '#E4E2DD', // Slightly softer color for subheading
        }}
      >
        Every Course. Every Review. Every Major. All In One.
      </Typography>
      <Box component="form" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Search for courses..."
          sx={{
            bgcolor: 'white',
            borderRadius: '25px',
            width: { xs: '90%', md: '70%' }, // Responsive width
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              padding: '0 15px',
              height: '50px', // Slightly increased height for better visibility
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#571CE0', // Highlight on hover
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
            padding: '10px 25px', // Slightly increased padding for a balanced look
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)',
            },
            fontSize: { xs: '0.875rem', md: '1rem' }, // Responsive font size
          }}
        >
          Search
        </Button>
      </Box>
    </Container>
  </Box>
);

export default LandingPage;
