// MobileLoginPage.jsx

import React, { useRef, useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  InputAdornment,
  Link,
  IconButton,
  Snackbar,
  Alert,
  Container,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const MobileLoginPage = ({ darkMode }) => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const navigate = useNavigate();
  const theme = useTheme();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailRef.current.value,
        passwordRef.current.value
      );
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
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
    } catch (err) {
      setError('Failed to sign in');
      setSnackbarOpen(true);
      console.error('Sign in error:', err);
    }
    setLoading(false);
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
      console.error('Error signing in with Google:', error);
    }
  };

  const handleForgotPassword = async () => {
    const email = emailRef.current.value;

    if (!email) {
      setError('Please enter your email first');
      setSnackbarOpen(true);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError('');
      setSnackbarOpen(true);
    } catch (error) {
      setError('Failed to send password reset email');
      setSnackbarOpen(true);
      console.error('Password reset error:', error);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', 
          width: '100%',
        }}
      >
        {/* Logo with subtle background effect */}
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            mb: 4,
            mt: 2,
            overflow: 'hidden',
            position: 'relative',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
            animation: 'fadeInDown 0.8s ease-out',
            '@keyframes fadeInDown': {
              '0%': {
                opacity: 0,
                transform: 'translateY(-20px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)'
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: theme.palette.mode === 'dark' 
                ? 'radial-gradient(circle, rgba(87,28,224,0.15) 0%, rgba(0,0,0,0) 70%)'
                : 'radial-gradient(circle, rgba(87,28,224,0.08) 0%, rgba(255,255,255,0) 70%)',
              zIndex: -1,
            }
          }}
        >
          <RouterLink to="/landing" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <img
              src={theme.palette.mode === 'dark' ? '/2.png' : '/1.png'}
              alt="CourseMe Logo"
              style={{ 
                width: 'auto', 
                height: 'auto', 
                maxWidth: '220px',
                objectFit: 'contain',
                filter: `drop-shadow(0px 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'})`,
              }}
            />
          </RouterLink>
        </Box>

        {/* Animated tagline */}
        <Box sx={{ 
          mb: 3,
          overflow: 'hidden',
          width: '100%',
          textAlign: 'center'
        }}>
          <Typography
            variant="h6"
            align="center"
            sx={{
              fontFamily: 'SF Pro Display, sans-serif',
              fontWeight: 500,
              color: theme.palette.text.primary,
              opacity: 1,
              animation: 'fadeIn 1.5s ease-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 }
              }
            }}
          >
            Unlock your academic edge, starting at
          </Typography>
          
          <Box sx={{ 
            mt: 0.5,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2px'
          }}>
            <Typography
              variant="h6"
              component="span"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                fontWeight: 500,
                color: '#00693e', // Dartmouth green
                display: 'inline-block',
                position: 'relative',
                animation: 'revealText 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
                '@keyframes revealText': {
                  '0%': {
                    transform: 'translateY(20px)',
                    opacity: 0,
                    filter: 'blur(12px)'
                  },
                  '100%': {
                    transform: 'translateY(0)',
                    opacity: 1,
                    filter: 'blur(0)'
                  }
                }
              }}
            >
              Dartmouth
            </Typography>
            <Typography
              component="span"
              variant="h6"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                color: '#F26655',
                display: 'inline-block',
                position: 'relative',
                fontWeight: 500,
                animation: 'pulseDot 3s ease-in-out infinite',
                '@keyframes pulseDot': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    opacity: 1
                  },
                  '50%': {
                    transform: 'scale(1.2)',
                    opacity: 0.8
                  }
                }
              }}
            >
              .
            </Typography>
          </Box>
        </Box>

        {/* Login form */}
        <Box
          sx={{
            width: '100%',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : theme.palette.background.paper,
            borderRadius: '16px',
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : theme.shadows[3],
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            p: 3,
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
            <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}
          
          {resetEmailSent && (
            <Typography color="success.main" sx={{ mb: 2, textAlign: 'center' }}>
              Password reset email sent successfully
            </Typography>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              variant="outlined"
              placeholder="Email"
              inputRef={emailRef}
              required
              fullWidth
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.03)' 
                    : theme.palette.background.default,
                  borderRadius: '12px',
                  height: '48px',
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
              fullWidth
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.03)' 
                    : theme.palette.background.default,
                  borderRadius: '12px',
                  height: '48px',
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
                        color: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.7)' 
                          : 'rgba(0, 0, 0, 0.6)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571ce0',
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(139, 92, 246, 0.1)' 
                            : 'rgba(87, 28, 224, 0.05)',
                        }
                      }}
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Link
                sx={{
                  color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571CE0',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'SF Pro Display, sans-serif',
                  fontSize: '14px',
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  '&:hover': {
                    color: theme.palette.mode === 'dark' ? '#A78BFA' : '#4338CA',
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(139, 92, 246, 0.1)' 
                      : 'rgba(87, 28, 224, 0.05)',
                    transform: 'translateY(-1px)',
                  },
                }}
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </Link>
            </Box>
            
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                fontFamily: 'SF Pro Display, sans-serif',
                fontSize: '14px',
                lineHeight: 1.5,
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.7)' 
                  : 'rgba(0, 0, 0, 0.7)',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(139, 92, 246, 0.05)' 
                  : 'rgba(87, 28, 224, 0.03)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(139, 92, 246, 0.15)' 
                  : '1px solid rgba(87, 28, 224, 0.1)',
                textAlign: 'center',
              }}
            >
              <strong style={{ 
                color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571CE0',
                fontWeight: 600 
              }}>Please Note:</strong> Log in using your Dartmouth email ID.
            </Typography>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                  : 'linear-gradient(135deg, #571CE0 0%, #4338CA 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontFamily: 'SF Pro Display, sans-serif',
                fontSize: '16px',
                mb: 2,
                height: '48px',
                borderRadius: '14px',
                border: 'none',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 25px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                  : '0 8px 25px rgba(87, 28, 224, 0.25), 0 0 0 1px rgba(87, 28, 224, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
                  borderRadius: '14px 14px 0 0',
                },
                '&:hover': {
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)'
                    : 'linear-gradient(135deg, #6366F1 0%, #571CE0 100%)',
                  transform: 'translateY(-2px) scale(1.02)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 12px 35px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                    : '0 12px 35px rgba(87, 28, 224, 0.35), 0 0 0 1px rgba(87, 28, 224, 0.15)',
                },
                '&:active': {
                  transform: 'translateY(-1px) scale(1.01)',
                },
                '&:disabled': {
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(139, 92, 246, 0.3)'
                    : 'rgba(87, 28, 224, 0.3)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  transform: 'none',
                },
              }}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </Button>

            <Box
              onClick={handleGoogleSignIn}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '48px',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : theme.palette.background.default,
                borderRadius: '14px',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                  : '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
                cursor: 'pointer',
                mb: 2,
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fontFamily: 'SF Pro Display, sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                color: theme.palette.text.primary,
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)'
                    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%)',
                  borderRadius: '14px 14px 0 0',
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.06)' 
                    : 'rgba(66, 133, 244, 0.02)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.15)' 
                    : '1px solid rgba(66, 133, 244, 0.15)',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                    : '0 8px 30px rgba(66, 133, 244, 0.15), 0 0 0 1px rgba(66, 133, 244, 0.1)',
                },
                '&:active': {
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="20px"
                  height="20px"
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
                <span style={{ fontSize: '0.9rem' }}>Continue with Google</span>
              </Box>
            </Box>

            <Typography 
              variant="body2" 
              sx={{ 
                mt: 3, 
                textAlign: 'center',
                fontSize: '15px',
                fontFamily: 'SF Pro Display, sans-serif',
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.7)' 
                  : 'rgba(0, 0, 0, 0.7)',
              }}
            >
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/signup"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#8B5CF6' : '#571CE0',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontFamily: 'SF Pro Display, sans-serif',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  '&:hover': {
                    color: theme.palette.mode === 'dark' ? '#A78BFA' : '#4338CA',
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(139, 92, 246, 0.1)' 
                      : 'rgba(87, 28, 224, 0.05)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={resetEmailSent ? "success" : "error"} sx={{ width: '100%' }}>
          {resetEmailSent ? "Password reset email sent successfully" : error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MobileLoginPage; 