import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Drawer, List, ListItem, ListItemText, Snackbar, Alert,Switch } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/custom.css';

const NavBar = ({ darkMode, setDarkMode }) =>{
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleLoginRedirect = () => {
    if (!currentUser) {
      navigate('/login');
      setError('You need to log in to access this content.');
      setSnackbarOpen(true);
    }
  };

  const isGetStartedPage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isSignUpPage = location.pathname === '/signup';
  const isCompleteProfilePage = location.pathname === '/complete-profile';
  const isLandingPage = location.pathname === '/landing';

  const isSpecialPage = () => {
    const path = location.pathname;
    const specialPages = [
      '/classes',
      '/profile',
      '/layups',
      '/course-enrollment-priorities',
      '/departments',
      '/course-review',
      '/timetable',
      '/professors',
    ];
    return specialPages.some((page) => path === page || path.startsWith(`${page}/`));
  };

  const isSpecialPageStyle = isSpecialPage();

  if (isGetStartedPage || isLoginPage || isSignUpPage || isCompleteProfilePage) {
    return null;
  }

  return (
    <AppBar
  position="static"
  className="navbar"
  sx={{
    boxShadow: 'none',

    // Only apply the inline background logic if NOT in dark mode:
    ...(darkMode
      ? {}
      : {
          background: isLandingPage
            ? '#F9F9F9'
            : isSpecialPageStyle
            ? '#f9f9f9'
            : 'radial-gradient(circle, #571CE0 0%, #571CE0 20%, black 55%)',
        }),
  }}
>
<Toolbar sx={{ justifyContent: 'space-between' }}>
  <Box
    component="div"
    onClick={() => navigate(currentUser ? '/landing' : '/')}
    sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
  >
    <img
      src={
        isLandingPage || isSpecialPageStyle
          ? darkMode
            ? '/2.png' // Dark mode logo
            : '/1.png' // Light mode logo
          : '/2.png' // Default logo for other pages
      }
      alt="Logo"
      style={{ height: '20px', marginRight: '10px' }}
    />
  </Box>

        {/* Desktop Navigation Links and Dark Mode Switch */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center', // Centers items vertically
            gap: 2, // Adds uniform spacing between items
          }}
        >
          {isLandingPage ? (
            // Only show Login button on landing page if user is not logged in
            !currentUser && (
              <Typography
                component={Link}
                to="/login"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: darkMode ? '#FFFFFF' : '#571CE0', // White in dark mode
                  textTransform: 'none',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                Log In
              </Typography>
            )
          ) : (
            // Show all navigation items on other pages
            currentUser ? (
              <>
                <Typography
                  component={Link}
                  to="/classes"
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#FFFFFF' : (isSpecialPageStyle ? '#571CE0' : '#FFFFFF'),
                    textTransform: 'none',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                  onClick={handleLoginRedirect}
                >
                  All Classes
                </Typography>
                <Typography
                  component={Link}
                  to="/layups"
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#FFFFFF' : (isSpecialPageStyle ? '#571CE0' : '#FFFFFF'),
                    textTransform: 'none',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                  onClick={handleLoginRedirect}
                >
                  Layups
                </Typography>
                <Typography
                  component={Link}
                  to="/timetable"
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#FFFFFF' : (isSpecialPageStyle ? '#571CE0' : '#FFFFFF'),
                    textTransform: 'none',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                  onClick={handleLoginRedirect}
                >
                  Timetable
                </Typography>
                <Typography
                  component={Link}
                  to="/professors"
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#FFFFFF' : (isSpecialPageStyle ? '#571CE0' : '#FFFFFF'),
                    textTransform: 'none',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                  onClick={handleLoginRedirect}
                >
                  Professors
                </Typography>
                <Typography
                  component={Link}
                  to="/profile"
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#FFFFFF' : (isSpecialPageStyle ? '#571CE0' : '#FFFFFF'),
                    textTransform: 'none',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                  onClick={handleLoginRedirect}
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
                  color: darkMode ? '#FFFFFF' : '#571CE0',
                  textTransform: 'none',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                Log In
              </Typography>
            )
          )}

          {/* Dark Mode Switch */}
          <Switch
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
            color="secondary"
          />
        </Box>

        {/* Mobile Hamburger Menu - Hidden on Landing Page when logged in */}
        {(!isLandingPage || !currentUser) && (
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerOpen}
              sx={{ color: '#571CE0' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerClose}
          PaperProps={{
            sx: {
              width: 250,
              background: darkMode ? '#333' : '#E4E2DC', // Dark background in dark mode
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            },
          }}
          transitionDuration={500}
        >
          <List>
            {isLandingPage ? (
              // Only show Login in drawer on landing page if user is not logged in
              !currentUser && (
                <ListItem button component={Link} to="/login" onClick={handleDrawerClose}>
                  <ListItemText primary="Log In" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                </ListItem>
              )
            ) : (
              // Show all navigation items on other pages
              currentUser ? (
                <>
                  <ListItem button component={Link} to="/classes" onClick={handleDrawerClose}>
                    <ListItemText primary="All Classes" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                  </ListItem>
                  <ListItem button component={Link} to="/layups" onClick={handleDrawerClose}>
                    <ListItemText primary="Layups" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                  </ListItem>
                  <ListItem button component={Link} to="/timetable" onClick={handleDrawerClose}>
                    <ListItemText primary="Timetable" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                  </ListItem>
                  <ListItem button component={Link} to="/professors" onClick={handleDrawerClose}>
                    <ListItemText primary="Professors" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                  </ListItem>
                  <ListItem button component={Link} to="/profile" onClick={handleDrawerClose}>
                    <ListItemText primary="Profile" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                  </ListItem>
                </>
              ) : (
                <ListItem button component={Link} to="/login" onClick={handleDrawerClose}>
                  <ListItemText primary="Log In" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                </ListItem>
              )
            )}
            {/* Dark Mode Switch in Drawer */}
            <ListItem>
              <ListItemText primary="Dark Mode" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                color="secondary"
              />
            </ListItem>
          </List>

          {/* Drawer Footer */}
          <Box sx={{ textAlign: 'center', pb: 3 }}>
            <img src={darkMode ? '/2.png' : '/1.png'} alt="CourseMe Logo" style={{ height: '25px', marginBottom: '10px' }} />
            <Typography variant="body2" sx={{ color: darkMode ? '#CCCCCC' : '#999' }}>
              © 2024 CourseMe. All Rights Reserved.
            </Typography>
          </Box>
        </Drawer>
      </Toolbar>

      {/* Snackbar for Error Messages */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default NavBar;