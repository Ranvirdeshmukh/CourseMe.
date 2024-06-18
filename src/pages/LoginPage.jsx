// src/pages/LoginPage.js
import React, { useRef, useState } from 'react';
import { Container, Typography, Box, TextField, Button } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const LoginPage = () => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, emailRef.current.value, passwordRef.current.value);
    } catch {
      setError('Failed to sign in');
    }
    setLoading(false);
  };

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
        <Typography variant="h4" gutterBottom>Log In</Typography>
        {error && <Typography color="error">{error}</Typography>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            variant="outlined"
            label="Email"
            inputRef={emailRef}
            required
            fullWidth
            margin="normal"
            sx={{ bgcolor: 'white', borderRadius: '5px' }}
          />
          <TextField
            variant="outlined"
            label="Password"
            type="password"
            inputRef={passwordRef}
            required
            fullWidth
            margin="normal"
            sx={{ bgcolor: 'white', borderRadius: '5px' }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{
              mt: 2,
              background: 'linear-gradient(90deg, rgba(87,28,224,1) 0%, rgba(144,19,254,1) 100%)',
              borderRadius: '25px',
            }}
          >
            Log In
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
