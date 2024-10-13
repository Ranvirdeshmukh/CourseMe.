// src/pages/SignUpPage.jsx
import React, { useRef, useState } from 'react';
import { Typography, Box, TextField, InputAdornment, IconButton, Link, Button } from '@mui/material';
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


const SignUpPage = () => {
  const navigate = useNavigate();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = emailRef.current.value;
    if (!email.endsWith('@dartmouth.edu')) {
      setError('Please use your Dartmouth email address');
      return;
    }
    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      setError('Passwords do not match');
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
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #fff 100%)',
        padding: '0 10%',
        color: '#1D1D1F',
        flexDirection: { xs: 'column', md: 'row' },
        textAlign: { xs: 'center', md: 'left' },
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: '100%', md: '50%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: { xs: 'center', md: 'flex-start' },
          mb: { xs: 0, md: 0 },
          pt: { xs: 5, md: 0 },
        }}
      >
        <RouterLink to="/landing">
          <img src="/1.png" alt="CourseMe Logo" style={{ maxWidth: '60%', height: 'auto', marginBottom: '10px' }} />
        </RouterLink>
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 400,
            color: '#1D1D1F',
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
              document.getElementById('typing-fullstop').style.visibility = 'visible';
            }}
          />
          <span id="typing-fullstop" style={{ color: '#F26655', visibility: 'hidden' }}>.</span>
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: { xs: '85%', md: '400px' },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.15)',
          padding: { xs: '20px', md: '30px' },
          color: '#1D1D1F',
          marginBottom: { xs: 4, md: 0 },
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
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '48px',
                '& fieldset': {
                  borderColor: '#E0E0E0',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: '#B0B0B0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#571CE0',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#571CE0' }} />
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
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '48px',
                '& fieldset': {
                  borderColor: '#E0E0E0',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: '#B0B0B0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#571CE0',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#571CE0' }} />
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
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '48px',
                '& fieldset': {
                  borderColor: '#E0E0E0',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: '#B0B0B0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#571CE0',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#571CE0' }} />
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
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '48px',
                '& fieldset': {
                  borderColor: '#E0E0E0',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: '#B0B0B0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#571CE0',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#571CE0' }} />
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
            sx={{
              mb: 3,
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                height: '48px',
                '& fieldset': {
                  borderColor: '#E0E0E0',
                  transition: 'border-color 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: '#B0B0B0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#571CE0',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#571CE0' }} />
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
            color="textSecondary"
            sx={{
              marginBottom: '20px',
              fontFamily: 'SF Pro Display, sans-serif',
              color: '#1D1D1F',
            }}
          >
            <strong>Please Note:</strong> Sign up using your Dartmouth email ID.
          </Typography>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: '#4285F4',
              color: '#fff',
              fontWeight: 'bold',
              mb: 2,
              height: '48px',
              borderRadius: '20px',
              transition: 'transform 0.2s',
              '&:hover': {
                backgroundColor: '#357AE8',
                transform: 'scale(1.05)',
              },
            }}
          >
            Sign Up
          </Button>
          <Box
            onClick={handleGoogleSignIn}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '48px',
              backgroundColor: '#f2f2f2',
              borderRadius: '20px',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
              mb: 2,
              transition: 'background-color 0.218s, box-shadow 0.218s',
              '&:hover': {
                backgroundColor: '#e2e2e2',
                boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)',
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
          <Typography variant="body2" sx={{ mt: 3, fontSize: '1.1rem' }}>
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
  );
};

export default SignUpPage;