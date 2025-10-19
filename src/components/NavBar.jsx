// NavBar.js

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Tooltip,
  Button
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/custom.css';

// Import icons for theme modes
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import DesktopMacIcon from '@mui/icons-material/DesktopMac';

const NavBar = ({ darkMode, themeMode, setThemeMode }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState('');

  const handleDrawerOpen = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);
  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleLoginRedirect = () => {
    if (!currentUser) {
      navigate('/login');
      setError('You need to log in to access this content.');
      setSnackbarOpen(true);
    }
  };

  // Cycle through the theme modes: system → light → dark → system...
  const handleThemeToggle = () => {
    if (themeMode === 'system') {
      setThemeMode('light');
    } else if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    }
  };

  // Choose the appropriate icon based on the current theme mode
  let themeIcon;
  if (themeMode === 'system') {
    themeIcon = <DesktopMacIcon />;
  } else if (themeMode === 'light') {
    themeIcon = <LightModeIcon />;
  } else if (themeMode === 'dark') {
    themeIcon = <DarkModeIcon />;
  }

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
      '/major-tracking',
    ];
    return specialPages.some(page => path === page || path.startsWith(`${page}/`));
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
        // Use your existing background logic
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
                  ? '/2.png'
                  : '/1.png'
                : '/2.png'
            }
            alt="Logo"
            style={{ height: '20px', marginRight: '10px' }}
          />
        </Box>

        {/* Desktop Navigation Links and Theme Icon */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 2,
          }}
        >
          {isLandingPage ? (
            // On Landing page: show only Log In (if not logged in)
            !currentUser && (
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
          ) : (
            // Otherwise, show full navigation if logged in
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

          {/* Collaborate Button */}
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            {/* Pulsing dot indicator */}
            <Box
              sx={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #F26655, #571CE0)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.3)', opacity: 0.7 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
                zIndex: 1,
                boxShadow: '0 0 6px rgba(242, 102, 85, 0.5)',
              }}
            />
            
            <Box
              sx={{
                background: 'linear-gradient(135deg, rgba(242, 102, 85, 0.6), rgba(87, 28, 224, 0.6))',
                borderRadius: '20px',
                padding: '2px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(242, 102, 85, 0.25)',
                },
              }}
            >
              <Button
                onClick={() => navigate('/collaborate')}
                variant="text"
                size="small"
                sx={{
                  background: darkMode 
                    ? 'rgba(28, 9, 63, 0.7)'
                    : 'rgba(255, 255, 255, 0.85)',
                  color: darkMode ? '#ffffff' : '#333333',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  px: 2.5,
                  py: 0.8,
                  borderRadius: '18px',
                  textTransform: 'none',
                  fontFamily: 'SF Pro Display, sans-serif',
                  border: 'none',
                  width: '100%',
                  height: '100%',
                  minHeight: 'auto',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: darkMode 
                      ? 'linear-gradient(135deg, rgba(242, 102, 85, 0.12), rgba(87, 28, 224, 0.12))'
                      : 'linear-gradient(135deg, rgba(242, 102, 85, 0.06), rgba(87, 28, 224, 0.06))',
                  },
                }}
              >
                Collaborate
              </Button>
            </Box>
          </Box>

          {/* Theme Mode Icon Button */}
          <Tooltip title={`Theme: ${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} (click to change)`}>
            <IconButton onClick={handleThemeToggle} sx={{ color: darkMode ? 'inherit' : 'black' }}>
              {themeIcon}
            </IconButton>
          </Tooltip>

        </Box>

        {/* Mobile Hamburger Menu */}
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
              background: darkMode ? '#333' : '#E4E2DC',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            },
          }}
          transitionDuration={500}
        >
          <List>
            {isLandingPage ? (
              !currentUser && (
                <ListItem button component={Link} to="/login" onClick={handleDrawerClose}>
                  <ListItemText primary="Log In" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                </ListItem>
              )
            ) : (
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
                  <ListItem button component={Link} to="/collaborate" onClick={handleDrawerClose}>
                    <ListItemText primary="Collaborate" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                  </ListItem>
                </>
              ) : (
                <ListItem button component={Link} to="/login" onClick={handleDrawerClose}>
                  <ListItemText primary="Log In" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }} />
                </ListItem>
              )
            )}
            {/* Theme Icon in Mobile Drawer */}
            <ListItem>
  <IconButton onClick={() => { handleThemeToggle(); handleDrawerClose(); }} sx={{ color: darkMode ? 'inherit' : 'black' }}>
    {themeIcon}
  </IconButton>
  <Typography variant="body2" sx={{ ml: 1, fontFamily: 'SF Pro Display, sans-serif' }}>
    {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
  </Typography>
</ListItem>

          </List>

          {/* Drawer Footer */}
          <Box sx={{ textAlign: 'center', pb: 3 }}>
            <img
              src={darkMode ? '/2.png' : '/1.png'}
              alt="CourseMe Logo"
              style={{ height: '25px', marginBottom: '10px' }}
            />
            <Typography variant="body2" sx={{ color: darkMode ? '#CCCCCC' : '#999' }}>
              © 2025 CourseMe. All Rights Reserved.
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
