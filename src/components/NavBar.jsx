import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Drawer, List, ListItem, ListItemText, Snackbar, Alert } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/custom.css';

const NavBar = () => {
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
        background: isLandingPage
          ? '#F9F9F9'
          : isSpecialPageStyle
          ? '#f9f9f9'
          : 'radial-gradient(circle, #571CE0 0%, #571CE0 20%, black 55%)',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
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
          {isLandingPage ? (
            // Only show Login button on landing page if user is not logged in
            !currentUser && (
              <Typography
                component={Link}
                to="/login"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: '#571CE0',
                  textTransform: 'none',
                  textDecoration: 'none',
                  margin: '0 10px',
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
                    color: isSpecialPageStyle ? '#571CE0' : '#FFFFFF',
                    textTransform: 'none',
                    textDecoration: 'none',
                    margin: '0 10px',
                    fontWeight: 500,
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
                    color: isSpecialPageStyle ? '#571CE0' : '#FFFFFF',
                    textTransform: 'none',
                    textDecoration: 'none',
                    margin: '0 10px',
                    fontWeight: 500,
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
                    color: isSpecialPageStyle ? '#571CE0' : '#FFFFFF',
                    textTransform: 'none',
                    textDecoration: 'none',
                    margin: '0 10px',
                    fontWeight: 500,
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
    color: isSpecialPageStyle ? '#571CE0' : '#FFFFFF',
    textTransform: 'none',
    textDecoration: 'none',
    margin: '0 10px',
    fontWeight: 500,
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
                    color: isSpecialPageStyle ? '#571CE0' : '#FFFFFF',
                    textTransform: 'none',
                    textDecoration: 'none',
                    margin: '0 10px',
                    fontWeight: 500,
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
                  color: isSpecialPageStyle ? '#571CE0' : '#FFFFFF',
                  textTransform: 'none',
                  textDecoration: 'none',
                  margin: '0 10px',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                Log In
              </Typography>
            )
          )}
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

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerClose}
          PaperProps={{
            sx: {
              width: 250,
              background: '#E4E2DC',
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
                  <ListItemText primary="Log In" />
                </ListItem>
              )
            ) : (
              // Show all navigation items on other pages
              currentUser ? (
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
                  <ListItem button component={Link} to="/professors" onClick={handleDrawerClose}>
  <ListItemText primary="Professors" />
</ListItem>
                  <ListItem button component={Link} to="/profile" onClick={handleDrawerClose}>
                    <ListItemText primary="Profile" />
                  </ListItem>
                </>
              ) : (
                <ListItem button component={Link} to="/login" onClick={handleDrawerClose}>
                  <ListItemText primary="Log In" />
                </ListItem>
              )
            )}
          </List>

          <Box sx={{ textAlign: 'center', pb: 3 }}>
            <img src="/1.png" alt="CourseMe Logo" style={{ height: '25px', marginBottom: '10px' }} />
            <Typography variant="body2" sx={{ color: '#999' }}>
              © 2024 CourseMe. All Rights Reserved.
            </Typography>
          </Box>
        </Drawer>
      </Toolbar>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default NavBar;