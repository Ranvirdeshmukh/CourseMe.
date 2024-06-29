// src/components/NavBar.jsx
import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/custom.css';  // Import the custom CSS

const NavBar = () => {
  const { currentUser } = useAuth();

  return (
    <AppBar position="static" className="navbar">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ 
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
          {currentUser ? (
            <>
              <Button className="navbar-link" component={Link} to="/classes">
                All Classes
              </Button>
              <Button className="navbar-link" component={Link} to="/profile">
                Profile
              </Button>
            </>
          ) : (
            <Button className="navbar-link" component={Link} to="/login">
              Log In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
