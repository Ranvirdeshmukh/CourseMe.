// src/pages/ProfilePage.jsx
import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
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
      }}
    >
      <Container>
        <Typography variant="h4" gutterBottom>Profile Page</Typography>
        <Typography>Welcome, {currentUser.email}!</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
          sx={{
            mt: 2,
            background: 'linear-gradient(90deg, rgba(87,28,224,1) 0%, rgba(144,19,254,1) 100%)',
            borderRadius: '25px',
          }}
        >
          Log Out
        </Button>
      </Container>
    </Box>
  );
};

export default ProfilePage;
