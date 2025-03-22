import React, { useRef, useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Link,
  Snackbar,
  Alert,
  Container,
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

const MobileSignUpPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
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
            Create your new account and
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
              unlock your academic edge
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

        {/* Sign Up Form */}
        <Box
          sx={{
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            borderRadius: '12px',
            boxShadow: theme.shadows[3],
            p: 3,
          }}
        >
          {error && (
            <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              variant="outlined"
              placeholder="First Name"
              inputRef={firstNameRef}
              required
              fullWidth
              sx={{
                mb: 2,
                bgcolor: theme.palette.background.default,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#571ce0' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              variant="outlined"
              placeholder="Last Name"
              inputRef={lastNameRef}
              required
              fullWidth
              sx={{
                mb: 2,
                bgcolor: theme.palette.background.default,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#571ce0' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              variant="outlined"
              placeholder="Email"
              inputRef={emailRef}
              required
              fullWidth
              sx={{
                mb: 2,
                bgcolor: theme.palette.background.default,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#571ce0' }} />
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
                bgcolor: theme.palette.background.default,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#571ce0' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
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
              fullWidth
              sx={{
                mb: 2,
                bgcolor: theme.palette.background.default,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#571ce0' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                fontFamily: 'SF Pro Display, sans-serif',
                color: theme.palette.text.primary,
                textAlign: 'center',
              }}
            >
              <strong>Please Note:</strong> Sign up using your Dartmouth email ID.
            </Typography>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                backgroundColor: '#000080',
                color: '#FFFFFF',
                fontWeight: 'bold',
                mb: 2,
                height: '45px',
                borderRadius: '20px',
                '&:hover': {
                  backgroundColor: '#0000CD',
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
                height: '45px',
                backgroundColor: theme.palette.background.default,
                borderRadius: '20px',
                boxShadow: theme.shadows[1],
                cursor: 'pointer',
                mb: 2,
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

            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: '#571CE0',
                  fontWeight: 'bold',
                  textDecoration: 'none',
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
    </Container>
  );
};

export default MobileSignUpPage; 