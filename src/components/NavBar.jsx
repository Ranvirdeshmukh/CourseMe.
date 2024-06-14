// src/components/NavBar.js
import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const NavBar = () => (
  <AppBar
    position="static"
    sx={{
      background: 'radial-gradient(circle, #571CE0 0%, #571CE0 20%, black 55%)',
      boxShadow: 'none',
    }}
  >
    <Toolbar>
      <Typography
        variant="h6"
        component={Link}
        to="/"
        sx={{ 
          flexGrow: 1, 
          fontFamily: 'SF Pro Display, sans-serif',
          fontStyle: 'bold',
          textDecoration: 'none',
          color: 'inherit',
          cursor: 'pointer'
        }}
      >
        CourseReview.
      </Typography>
      <Box>
        <Button color="inherit" component={Link} to="/profile" sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>
          Profile
        </Button>
        <Button color="inherit" component={Link} to="/classes" sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>
          All Classes
        </Button>
        <Button color="inherit" component={Link} to="/easy-classes" sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>
          Easy Classes
        </Button>
      </Box>
    </Toolbar>
  </AppBar>
);

export default NavBar;
