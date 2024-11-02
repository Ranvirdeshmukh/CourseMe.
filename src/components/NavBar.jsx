import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Drawer, List, ListItem, ListItemText, Snackbar, Alert } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme';
import '../styles/custom.css';

const NavBar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();

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
          ? mode === 'dark' ? '#121212' : '#F9F9F9'
          : isSpecialPageStyle
          ? mode === 'dark' ? '#1E1E1E' : '#f9f9f9'
          : mode === 'dark'
          ? 'radial-gradient(circle, #7B4AFF 0%, #7B4AFF 20%, #121212 55%)'
          : 'radial-gradient(circle, #571CE0 0%, #571CE0 20%, black 55%)',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box
          component="div"
          onClick={() => navigate(currentUser ? '/landing' : '/')}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <img
            src={isLandingPage || isSpecialPageStyle ? (mode === 'dark' ? '/2.png' : '/1.png') : '/2.png'}
            alt="Logo"
            style={{ height: '20px', marginRight: '10px' }}
          />
        </Box>

        {/* Desktop Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {isLandingPage ? (
            !currentUser && (
              <Typography
                component={Link}
                to="/login"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: mode === 'dark' ? '#7B4AFF' : '#571CE0',
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
            currentUser ? (
              <>
                {['All Classes', 'Layups', 'Timetable', 'Professors', 'Profile'].map((item) => (
                  <Typography
                    key={item}
                    component={Link}
                    to={`/${item.toLowerCase().replace(' ', '')}`}
                    sx={{
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: isSpecialPageStyle
                        ? mode === 'dark' ? '#7B4AFF' : '#571CE0'
                        : mode === 'dark' ? '#FFFFFF' : '#FFFFFF',
                      textTransform: 'none',
                      textDecoration: 'none',
                      margin: '0 10px',
                      fontWeight: 500,
                      fontSize: '1rem',
                    }}
                    onClick={handleLoginRedirect}
                  >
                    {item}
                  </Typography>
                ))}
              </>
            ) : (
              <Typography
                component={Link}
                to="/login"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: isSpecialPageStyle
                    ? mode === 'dark' ? '#7B4AFF' : '#571CE0'
                    : mode === 'dark' ? '#FFFFFF' : '#FFFFFF',
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

          {/* Theme Toggle Button - Desktop */}
          <IconButton
            onClick={toggleTheme}
            sx={{
              ml: 2,
              color: isSpecialPageStyle
                ? mode === 'dark' ? '#7B4AFF' : '#571CE0'
                : '#FFFFFF',
            }}
          >
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>

        {/* Mobile Menu */}
        {(!isLandingPage || !currentUser) && (
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
            {/* Theme Toggle Button - Mobile */}
            <IconButton
              onClick={toggleTheme}
              sx={{
                mr: 1,
                color: isSpecialPageStyle
                  ? mode === 'dark' ? '#7B4AFF' : '#571CE0'
                  : '#FFFFFF',
              }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerOpen}
              sx={{ 
                color: mode === 'dark' ? '#7B4AFF' : '#571CE0'
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        {/* Drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerClose}
          PaperProps={{
            sx: {
              width: 250,
              background: mode === 'dark' ? '#1E1E1E' : '#E4E2DC',
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
                  <ListItemText 
                    primary="Log In" 
                    sx={{ 
                      color: mode === 'dark' ? '#FFFFFF' : 'inherit',
                      '& .MuiTypography-root': {
                        fontFamily: 'SF Pro Display, sans-serif',
                      }
                    }}
                  />
                </ListItem>
              )
            ) : (
              currentUser ? (
                <>
                  {['All Classes', 'Layups', 'Timetable', 'Professors', 'Profile'].map((item) => (
                    <ListItem 
                      key={item}
                      button 
                      component={Link} 
                      to={`/${item.toLowerCase().replace(' ', '')}`} 
                      onClick={handleDrawerClose}
                    >
                      <ListItemText 
                        primary={item} 
                        sx={{ 
                          color: mode === 'dark' ? '#FFFFFF' : 'inherit',
                          '& .MuiTypography-root': {
                            fontFamily: 'SF Pro Display, sans-serif',
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </>
              ) : (
                <ListItem button component={Link} to="/login" onClick={handleDrawerClose}>
                  <ListItemText 
                    primary="Log In" 
                    sx={{ 
                      color: mode === 'dark' ? '#FFFFFF' : 'inherit',
                      '& .MuiTypography-root': {
                        fontFamily: 'SF Pro Display, sans-serif',
                      }
                    }}
                  />
                </ListItem>
              )
            )}
          </List>

          <Box sx={{ textAlign: 'center', pb: 3 }}>
            <img 
              src={mode === 'dark' ? '/2.png' : '/1.png'} 
              alt="CourseMe Logo" 
              style={{ height: '25px', marginBottom: '10px' }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: mode === 'dark' ? '#FFFFFF' : '#999',
                fontFamily: 'SF Pro Display, sans-serif',
              }}
            >
              © 2024 CourseMe. All Rights Reserved.
            </Typography>
          </Box>
        </Drawer>
      </Toolbar>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert 
          onClose={handleSnackbarClose} 
          severity="error" 
          sx={{ 
            width: '100%',
            bgcolor: mode === 'dark' ? '#2D2D2D' : 'inherit',
            color: mode === 'dark' ? '#FFFFFF' : 'inherit',
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default NavBar;