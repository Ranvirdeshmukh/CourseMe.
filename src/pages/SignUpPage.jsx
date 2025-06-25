// src/pages/SignUpPage.jsx

import React, { useRef, useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Link,
  Button,
  Snackbar,
  Alert,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ReactTypingEffect from 'react-typing-effect';
import MobileSignUpPage from '../Mobileversion/MobileSignUpPage';

const SignUpPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme(); // Access the current theme
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Check if device is mobile
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false); // If needed

  // If it's a mobile device, render the mobile version
  if (isMobile) {
    return <MobileSignUpPage darkMode={darkMode} />;
  }
  
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = emailRef.current.value;
    if (!email.endsWith('@dartmouth.edu')) {
      setError('Please use your Dartmouth email address');
      setSnackbarOpen(true);
      return;
    }
    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      setError('Passwords do not match');
      setSnackbarOpen(true);
      return;
    }
    try {
      setError('');
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, emailRef.current.value, passwordRef.current.value);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        email: user.email,
        createdAt: new Date(),
      });
      navigate('/complete-profile');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please try logging in.');
      } else {
        setError('Failed to create an account');
      }
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          firstName: user.displayName.split(' ')[0],
          lastName: user.displayName.split(' ')[1],
          email: user.email,
          createdAt: new Date(),
        });
        navigate('/complete-profile');
      } else {
        const userData = userDoc.data();
        if (!userData.major || !userData.classYear) {
          navigate('/complete-profile');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setError('Failed to sign in with Google');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.palette.background.default, // Use theme's background
        padding: '0 10%',
        color: theme.palette.text.primary, // Use theme's text color
        flexDirection: { xs: 'column', md: 'row' }, // Stack vertically on mobile
        textAlign: { xs: 'center', md: 'left' }, // Center text on mobile, align left on desktop
      }}
    >
      {/* Logo and tagline section */}
      <Box
        sx={{
          maxWidth: { xs: '100%', md: '50%' }, // Adjust width for mobile and desktop
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start', // Align content to the top
          alignItems: { xs: 'center', md: 'flex-start' }, // Center the logo on mobile, left-align on desktop
          mb: { xs: 0, md: 0 }, // Add margin for mobile spacing
          pt: { xs: 5, md: 0 }, // Add padding-top on mobile to push content down
        }}
      >
        <RouterLink to="/landing">
          <img
            src={theme.palette.mode === 'dark' ? '/2.png' : '/1.png'} // Conditional image based on theme
            alt="CourseMe Logo"
            style={{ maxWidth: '60%', height: 'auto', marginBottom: '10px' }}
          />
        </RouterLink>
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 400,
            color: theme.palette.text.primary,
            mb: 4,
          }}
        >
          Create your new account and{' '}
          <ReactTypingEffect
            text={["unlock your academic edge"]}
            speed={100}
            eraseSpeed={50}
            eraseDelay={3000}
            typingDelay={1000}
            displayTextRenderer={(text, i) => (
              <span style={{ color: '#00693E' }}>{text}</span>
            )}
            onComplete={() => {
              const fullStop = document.getElementById('typing-fullstop');
              if (fullStop) {
                fullStop.style.visibility = 'visible';
              }
            }}
          />
          <span id="typing-fullstop" style={{ color: '#F26655', visibility: 'hidden' }}>.</span>
        </Typography>
      </Box>

      {/* Sign Up form section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: { xs: '85%', md: '400px' }, // Adjust width for mobile
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : theme.palette.background.paper,
          borderRadius: '12px',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : theme.shadows[5],
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: { xs: '20px', md: '30px' }, // Adjust padding for mobile
          color: theme.palette.text.primary, // Use theme's text color
          marginBottom: { xs: 4, md: 0 },
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              : '0 10px 25px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            transform: 'translateY(-2px)',
          }
        }}
      >
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
          <TextField
            variant="outlined"
            placeholder="First Name"
            inputRef={firstNameRef}
            required
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : theme.palette.background.default,
                borderRadius: '12px',
                height: '52px',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(87, 28, 224, 0.02)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.12)' 
                    : '1px solid rgba(87, 28, 224, 0.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                    : '0 4px 20px rgba(87, 28, 224, 0.08)',
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.06)' 
                    : 'rgba(87, 28, 224, 0.03)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(87, 28, 224, 0.4)' 
                    : '1px solid rgba(87, 28, 224, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 25px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(87, 28, 224, 0.15)'
                    : '0 6px 25px rgba(87, 28, 224, 0.12), 0 0 0 3px rgba(87, 28, 224, 0.1)',
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
                fontFamily: 'SF Pro Display, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                '&::placeholder': {
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.5)' 
                    : 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ 
                    color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                    transition: 'color 0.3s ease'
                  }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Last Name"
            inputRef={lastNameRef}
            required
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : theme.palette.background.default,
                borderRadius: '12px',
                height: '52px',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(87, 28, 224, 0.02)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.12)' 
                    : '1px solid rgba(87, 28, 224, 0.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                    : '0 4px 20px rgba(87, 28, 224, 0.08)',
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.06)' 
                    : 'rgba(87, 28, 224, 0.03)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(87, 28, 224, 0.4)' 
                    : '1px solid rgba(87, 28, 224, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 25px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(87, 28, 224, 0.15)'
                    : '0 6px 25px rgba(87, 28, 224, 0.12), 0 0 0 3px rgba(87, 28, 224, 0.1)',
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
                fontFamily: 'SF Pro Display, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                '&::placeholder': {
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.5)' 
                    : 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ 
                    color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                    transition: 'color 0.3s ease'
                  }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Email"
            inputRef={emailRef}
            required
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : theme.palette.background.default,
                borderRadius: '12px',
                height: '52px',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(87, 28, 224, 0.02)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.12)' 
                    : '1px solid rgba(87, 28, 224, 0.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                    : '0 4px 20px rgba(87, 28, 224, 0.08)',
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.06)' 
                    : 'rgba(87, 28, 224, 0.03)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(87, 28, 224, 0.4)' 
                    : '1px solid rgba(87, 28, 224, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 25px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(87, 28, 224, 0.15)'
                    : '0 6px 25px rgba(87, 28, 224, 0.12), 0 0 0 3px rgba(87, 28, 224, 0.1)',
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
                fontFamily: 'SF Pro Display, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                '&::placeholder': {
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.5)' 
                    : 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ 
                    color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                    transition: 'color 0.3s ease'
                  }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            inputRef={passwordRef}
            required
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : theme.palette.background.default,
                borderRadius: '12px',
                height: '52px',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(87, 28, 224, 0.02)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.12)' 
                    : '1px solid rgba(87, 28, 224, 0.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                    : '0 4px 20px rgba(87, 28, 224, 0.08)',
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.06)' 
                    : 'rgba(87, 28, 224, 0.03)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(87, 28, 224, 0.4)' 
                    : '1px solid rgba(87, 28, 224, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 25px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(87, 28, 224, 0.15)'
                    : '0 6px 25px rgba(87, 28, 224, 0.12), 0 0 0 3px rgba(87, 28, 224, 0.1)',
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
                fontFamily: 'SF Pro Display, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                '&::placeholder': {
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.5)' 
                    : 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ 
                    color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                    transition: 'color 0.3s ease'
                  }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            variant="outlined"
            placeholder="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            inputRef={confirmPasswordRef}
            required
            sx={{
              mb: 3,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : theme.palette.background.default,
                borderRadius: '12px',
                height: '52px',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(87, 28, 224, 0.02)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.12)' 
                    : '1px solid rgba(87, 28, 224, 0.15)',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                    : '0 4px 20px rgba(87, 28, 224, 0.08)',
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.06)' 
                    : 'rgba(87, 28, 224, 0.03)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(87, 28, 224, 0.4)' 
                    : '1px solid rgba(87, 28, 224, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 25px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(87, 28, 224, 0.15)'
                    : '0 6px 25px rgba(87, 28, 224, 0.12), 0 0 0 3px rgba(87, 28, 224, 0.1)',
                },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.text.primary,
                fontFamily: 'SF Pro Display, sans-serif',
                fontSize: '16px',
                fontWeight: 400,
                '&::placeholder': {
                  color: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.5)' 
                    : 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ 
                    color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                    transition: 'color 0.3s ease'
                  }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleClickShowConfirmPassword}
                    edge="end"
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box
            sx={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(139, 92, 246, 0.1)' 
                : 'rgba(87, 28, 224, 0.08)',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(139, 92, 246, 0.2)' 
                : '1px solid rgba(87, 28, 224, 0.15)',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                color: theme.palette.text.primary,
                fontSize: '14px',
                lineHeight: 1.4,
              }}
            >
              <strong>Please Note:</strong> Sign up using your Dartmouth email ID.
            </Typography>
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #8B5CF6 0%, #571CE0 100%)'
                : 'linear-gradient(135deg, #571CE0 0%, #3B0F9F 100%)',
              color: '#FFFFFF',
              fontFamily: 'SF Pro Display, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              mb: 2,
              height: '52px',
              borderRadius: '14px',
              border: 'none',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 24px rgba(87, 28, 224, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              },
              '&:hover': {
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 12px 32px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : '0 12px 32px rgba(87, 28, 224, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              },
              '&:active': {
                transform: 'translateY(-1px) scale(1.01)',
              },
              '&:disabled': {
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                color: theme.palette.text.disabled,
                boxShadow: 'none',
                transform: 'none',
              },
            }}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </Button>

          <Box
            onClick={handleGoogleSignIn}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '52px',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : theme.palette.background.default,
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '14px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : theme.shadows[2],
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              cursor: 'pointer',
              mb: 2,
              fontFamily: 'SF Pro Display, sans-serif',
              fontWeight: 500,
              fontSize: '16px',
              color: theme.palette.text.primary,
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.02)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.15)' 
                  : '1px solid rgba(0, 0, 0, 0.12)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 6px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  : theme.shadows[4],
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.15)'
                  : theme.shadows[1],
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                pl: 2,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="24px"
                height="24px"
                style={{ display: 'block', marginRight: '8px' }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span>Continue with Google</span>
            </Box>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 3, 
              fontSize: '1.1rem',
              fontFamily: 'SF Pro Display, sans-serif',
              textAlign: 'center',
            }}
          >
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571CE0',
                fontWeight: 500,
                textDecoration: 'none',
                position: 'relative',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(139, 92, 246, 0.1)' 
                    : 'rgba(87, 28, 224, 0.08)',
                  color: theme.palette.mode === 'dark' ? '#A78BFA' : '#4C1D95',
                  transform: 'translateY(-1px)',
                },
                '&:hover': {
                  color: '#3A0DAF',
                  textDecoration: 'underline',
                },
              }}
            >
              Log In
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignUpPage;
