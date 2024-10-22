import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Drawer, List, ListItem, ListItemText, Snackbar, Alert } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/custom.css'; // Import the custom CSS

const NavBar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State for managing Drawer visibility on mobile
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState('');

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Redirect to login if the user is not logged in
  const handleLoginRedirect = () => {
    if (!currentUser) {
      navigate('/login');
      setError('You need to log in to access this content.');
      setSnackbarOpen(true);
    }
  };

  // Check if the current page is the Get Started, Login, or Sign Up page
  const isGetStartedPage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isSignUpPage = location.pathname === '/signup';

  // Check if the current page is the Landing page
  const isLandingPage = location.pathname === '/landing';

  // Helper function to determine if the current path matches any of the specific patterns
  const isSpecialPage = () => {
    const path = location.pathname;
    const specialPages = [
      '/classes',
      '/profile',
      '/layups',
      '/course-enrollment-priorities',
      '/departments', // Include department-related paths
      '/course-review', // Add course-review path to apply special styling
      '/timetable', // Include timetable path to apply special styling
    ];
    return specialPages.some((page) => path === page || path.startsWith(`${page}/`));
  };

  const isSpecialPageStyle = isSpecialPage();

  // Return null to prevent Navbar rendering on the Get Started, Login, and SignUp pages
  if (isGetStartedPage || isLoginPage || isSignUpPage) {
    return null;
  }

  return (
    <AppBar
      position="static"
      className="navbar"
      sx={{
        background: isLandingPage
          ? '#F9F9F9'
          : isSpecialPageStyle
          ? '#f9f9f9'
          : 'radial-gradient(circle, #571CE0 0%, #571CE0 20%, black 55%)',
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
            src={isLandingPage || isSpecialPageStyle ? '/1.png' : '/2.png'}
            alt="Logo"
            style={{ height: '20px', marginRight: '10px' }}
          />
        </Box>

        {/* Desktop Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
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
                onClick={handleLoginRedirect} // Ensure login check on click
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
                onClick={handleLoginRedirect} // Ensure login check on click
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
                onClick={handleLoginRedirect} // Ensure login check on click
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
                onClick={handleLoginRedirect} // Ensure login check on click
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

        {/* Mobile Hamburger Menu */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerOpen}
            sx={{ color: '#571CE0' }}  // Change the color here
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Mobile Drawer Menu */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerClose}
          PaperProps={{
            sx: {
              width: 250, // Adjust the width of the drawer
              background: '#E4E2DC', // Give it a classy Apple-like color
              display: 'flex', // Ensures footer sticks to the bottom
              flexDirection: 'column',
              justifyContent: 'space-between',
            },
          }}
          transitionDuration={500} // Smooth sliding transition
        >
          <List>
            {currentUser ? (
              <>
                <ListItem button component={Link} to="/classes" onClick={handleDrawerClose}>
                  <ListItemText primary="All Classes" />
                </ListItem>
                <ListItem button component={Link} to="/layups" onClick={handleDrawerClose}>
                  <ListItemText primary="Layups" />
                </ListItem>
                <ListItem button component={Link} to="/timetable" onClick={handleDrawerClose}>
                  <ListItemText primary="Timetable" />
                </ListItem>
                <ListItem button component={Link} to="/profile" onClick={handleDrawerClose}>
                  <ListItemText primary="Profile" />
                </ListItem>
              </>
            ) : (
              <ListItem button component={Link} to="/login" onClick={handleDrawerClose}>
                <ListItemText primary="Log In" />
              </ListItem>
            )}
          </List>

          {/* Footer Section */}
          <Box sx={{ textAlign: 'center', pb: 3 }}>
            <img src="/1.png" alt="CourseMe Logo" style={{ height: '25px', marginBottom: '10px' }} />
            <Typography variant="body2" sx={{ color: '#999' }}>
              © 2024 CourseMe. All Rights Reserved.
            </Typography>
          </Box>
        </Drawer>
      </Toolbar>

      {/* Snackbar for error messages */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default NavBar;
