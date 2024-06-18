// src/pages/LoginPage.js
import React, { useRef, useState } from 'react';
import { Container, Typography, Box, TextField, Button, InputAdornment } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

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
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography variant="h2" gutterBottom>
          CourseReview.
        </Typography>
        <Typography variant="h5" gutterBottom>
          Log In
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Email"
            inputRef={emailRef}
            required
            sx={{
              bgcolor: 'white',
              borderRadius: '25px',
              width: '70%',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              '& .MuiOutlinedInput-root': {
                borderRadius: '25px',
                padding: '0 15px',
                height: '45px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon style={{ color: '#571CE0' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Password"
            type="password"
            inputRef={passwordRef}
            required
            sx={{
              bgcolor: 'white',
              borderRadius: '25px',
              width: '70%',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              '& .MuiOutlinedInput-root': {
                borderRadius: '25px',
                padding: '0 15px',
                height: '45px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon style={{ color: '#571CE0' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{
              mt: 2,
              background: 'linear-gradient(90deg, rgba(87,28,224,1) 0%, rgba(144,19,254,1) 100%)',
              borderRadius: '25px',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              padding: '8px 16px',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)',
              },
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
