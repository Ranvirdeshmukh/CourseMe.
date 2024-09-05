import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/custom.css'; // Import the custom CSS

const NavBar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if the current page is the Get Started page
  const isGetStartedPage = location.pathname === '/';

  // Check if the current page is the Landing page
  const isLandingPage = location.pathname === '/landing';

  // Helper function to determine if the current path matches any of the specific patterns
  const isSpecialPage = () => {
    const path = location.pathname;

    // List of paths that should have the specific style
    const specialPages = [
      '/classes',
      '/profile',
      '/layups',
      '/course-enrollment-priorities',
      '/departments', // Include department-related paths
      '/course-review', // Add course-review path to apply special styling
      '/timetable', // Include timetable path to apply special styling
    ];

    // Check if the path matches any special pages or starts with a special prefix
    return specialPages.some((page) => path === page || path.startsWith(`${page}/`));
  };

  const isSpecialPageStyle = isSpecialPage();

  // Return null to prevent Navbar rendering on the Get Started page
  if (isGetStartedPage) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
      </Box>
    );
  }

  return (
    <AppBar
      position="static"
      className="navbar"
      sx={{
        background: isLandingPage
          ? '#F9F9F9' // Set to #F9F9F9 for the landing page
          : isSpecialPageStyle
          ? '#E4E2DD' // Match the background color for special pages
          : 'radial-gradient(circle, #571CE0 0%, #571CE0 20%, black 55%)', // Original background gradient
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo display logic */}
        <Box
          component="div"
          onClick={() => navigate(currentUser ? '/landing' : '/')}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <img
            src={isLandingPage || isSpecialPageStyle ? '/1.png' : '/2.png'} // Always use 1.png for landing page
            alt="Logo"
            style={{ height: '20px', marginRight: '10px' }} // Decreased height for a smaller image
          />
        </Box>
        <Box>
          {currentUser ? (
            <>
              <Typography
                component={Link}
                to="/classes"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: isSpecialPageStyle || isLandingPage ? '#571CE0' : '#FFFFFF',
                  textTransform: 'none',
                  textDecoration: 'none',
                  margin: '0 10px',
                  fontWeight: 500,
                  fontSize: '1rem',
                }}
              >
                All Classes
              </Typography>
              <Typography
                component={Link}
                to="/layups"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: isSpecialPageStyle || isLandingPage ? '#571CE0' : '#FFFFFF',
                  textTransform: 'none',
                  textDecoration: 'none',
                  margin: '0 10px',
                  fontWeight: 500,
                  fontSize: '1rem',
                }}
              >
                Layups
              </Typography>
              <Typography
                component={Link}
                to="/timetable"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: isSpecialPageStyle || isLandingPage ? '#571CE0' : '#FFFFFF',
                  textTransform: 'none',
                  textDecoration: 'none',
                  margin: '0 10px',
                  fontWeight: 500,
                  fontSize: '1rem',
                }}
              >
                Timetable
              </Typography>
              <Typography
                component={Link}
                to="/profile"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: isSpecialPageStyle || isLandingPage ? '#571CE0' : '#FFFFFF',
                  textTransform: 'none',
                  textDecoration: 'none',
                  margin: '0 10px',
                  fontWeight: 500,
                  fontSize: '1rem',
                }}
              >
                Profile
              </Typography>
            </>
          ) : (
            <Typography
              component={Link}
              to="/login"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                color: isSpecialPageStyle || isLandingPage ? '#571CE0' : '#FFFFFF',
                textTransform: 'none',
                textDecoration: 'none',
                margin: '0 10px',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Log In
            </Typography>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
