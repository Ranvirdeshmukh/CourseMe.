import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Container, Box, Typography, TextField, Button, 
  InputAdornment, CircularProgress, Paper, Snackbar,
  Alert, Chip, LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link, useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const API_URL = 'https://coursemebot.pythonanywhere.com/api/chat';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LandingPage = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [department, setDepartment] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    setDepartment('');
    setCourseNumber('');
    setDocumentName('');

    try {
      const response = await axios.post(API_URL, 
        { question },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('API Response:', response.data);
      if (typeof response.data === 'object' && response.data.answer) {
        setAnswer(response.data.answer);
        setDepartment(response.data.department || '');
        setCourseNumber(response.data.course_number || '');
        
        // Query Firebase for course data
        if (response.data.department && response.data.course_number) {
          await fetchCourseData(response.data.department, response.data.course_number);
        }
      } else if (typeof response.data === 'string') {
        setAnswer(response.data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error fetching answer:', error);
      setError('An error occurred while fetching the answer. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseData = async (dept, course) => {
    try {
      const q = query(
        collection(db, "courses"), 
        where("department", "==", dept), 
        where("course_number", "==", course)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docName = querySnapshot.docs[0].id;
        setDocumentName(docName);
      } else {
        console.log("No matching documents in Firebase.");
      }
    } catch (error) {
      console.error("Error fetching course data from Firebase:", error);
    }
  };

  useEffect(() => {
    if (answer && !department && !courseNumber) {
      const match = answer.match(/^([A-Z]{2,4})\s*(\d+(?:\.\d+)?)/);
      if (match) {
        setDepartment(match[1]);
        setCourseNumber(match[2]);
        fetchCourseData(match[1], match[2]);
      }
    }
  }, [answer, department, courseNumber]);

  useEffect(() => {
    const handleScroll = () => {
      if (pageRef.current && documentName) {
        const scrollPosition = window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollHeight = viewportHeight * 0.05; // Reduce scroll height to 50% of viewport
        const progress = Math.min(scrollPosition / scrollHeight, 1);
        setScrollProgress(progress);
    
        if (progress >= 0.9) {
          window.removeEventListener('scroll', handleScroll);
          setTimeout(() => {
            window.scrollTo(0, 0); // Reset scroll position to the top
            navigate(`/departments/${department}/courses/${documentName}`);
          }, 300);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [department, documentName, navigate]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box
      ref={pageRef}
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
        padding: '0 20px',
      }}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          maxWidth: '800px',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 500,
            fontSize: { xs: '3rem', md: '4rem' },
            textDecoration: 'none',
            color: '#fff',
            cursor: 'pointer',
            mb: '20px',
          }}
        >
          CourseMe<span style={{ color: '#F26655' }}>.</span>
        </Typography>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 500,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            marginBottom: '30px',
            color: '#E4E2DD',
          }}
        >
          Every Course. Every Review. Every Major. All In One.
        </Typography>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about courses..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            sx={{
              bgcolor: 'white',
              borderRadius: '25px',
              width: { xs: '90%', md: '70%' },
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              '& .MuiOutlinedInput-root': {
                borderRadius: '25px',
                padding: '0 15px',
                height: '50px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#571CE0',
              },
              '& .MuiInputAdornment-root': {
                marginRight: '10px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#571CE0' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{
              background: 'linear-gradient(90deg, rgba(87,28,224,1) 0%, rgba(144,19,254,1) 100%)',
              borderRadius: '25px',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 25px',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.3)',
              },
              fontSize: { xs: '0.875rem', md: '1rem' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
          </Button>
        </Box>
        {answer && (
          <Paper 
            elevation={3} 
            sx={{ 
              mt: 4, 
              p: 3, 
              bgcolor: 'white', 
              borderRadius: 2,
              width: '100%',
              maxWidth: '800px',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            {(department || courseNumber) && (
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {department && <Chip label={`Department: ${department}`} color="primary" />}
                {courseNumber && <Chip label={`Course: ${courseNumber}`} color="secondary" />}
                {/* {documentName && <Chip label={`Document: ${documentName}`} color="default" />} */}
              </Box>
            )}
            <Typography variant="body1" sx={{ color: '#333', textAlign: 'left', mb: 2 }}>
              {(department && courseNumber) 
                ? answer.replace(new RegExp(`^${department}\\s*${courseNumber}\\s*`), '')
                : answer
              }
            </Typography>
          </Paper>
        )}
        {scrollProgress > 0 && (
          <Box 
            sx={{ 
              position: 'fixed', 
              bottom: 20, 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: '200px',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              Scroll more to view details
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={scrollProgress * 100} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#F26655'
                }
              }} 
            />
          </Box>
        )}
      </Container>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LandingPage;