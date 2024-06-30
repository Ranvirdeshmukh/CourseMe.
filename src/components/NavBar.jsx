// src/components/NavBar.jsx
import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/custom.css';  // Import the custom CSS

const NavBar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const isAllClassesPage = location.pathname === '/classes';

  return (
    <AppBar
      position="static"
      className="navbar"
      sx={{
        background: isAllClassesPage ? '#E4E2DD' : 'radial-gradient(circle, #571CE0 0%, #571CE0 20%, black 55%)',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ 
            fontFamily: 'SF Pro Display, sans-serif',
            fontStyle: 'bold',
            textDecoration: 'none',
            color: isAllClassesPage ? '#571CE0' : 'inherit',
            cursor: 'pointer'
          }}
        >
          CourseReview.
        </Typography>
        <Box>
          {currentUser ? (
            <>
              <Button
                className="navbar-link"
                component={Link}
                to="/classes"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  // color: isAllClassesPage ? '#571CE0' : '#FFFFFF',
                }}
              >
                All Classes
              </Button>
              <Button
                className="navbar-link"
                component={Link}
                to="/profile"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  
                }}
              >
                Profile
              </Button>
            </>
          ) : (
            <Button
              className="navbar-link"
              component={Link}
              to="/login"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                color: isAllClassesPage ? '#571CE0' : '#FFFFFF',
              }}
            >
              Log In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
