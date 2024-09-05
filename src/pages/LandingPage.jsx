import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Container, Box, Typography, TextField, Button, 
  InputAdornment, CircularProgress, Paper, Snackbar,
  Alert, Chip, LinearProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
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
  const [showScrollMessage, setShowScrollMessage] = useState(false);
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
    setShowScrollMessage(false);

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
        
        if (response.data.department && response.data.course_number) {
          await fetchCourseData(response.data.department, response.data.course_number);
        }
      } else if (typeof response.data === 'string') {
        setAnswer(response.data);
      } else {
        throw new Error('Unexpected response format');
      }
      if (response.data.department && response.data.course_number) {
        setShowScrollMessage(true);
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
        const scrollHeight = viewportHeight * 0.05;
        const progress = Math.min(scrollPosition / scrollHeight, 1);
        setScrollProgress(progress);
    
        if (progress >= 0.9) {
          window.removeEventListener('scroll', handleScroll);
          setTimeout(() => {
            window.scrollTo(0, 0);
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
        background: '#f9f9f9', // Change this line to set the background color
        color: '#000',
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
          flexGrow: 1, // Ensures this container grows to take up available space
          textAlign: 'center',
        }}
      >
        {/* Main heading with clean and simple design */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '2rem', md: '3rem' },
            color: '#000',
            mb: '40px',
            letterSpacing: '0.04rem',
          }}
        >
          Simplify Your Major, Amplify Your College Life<span style={{ color: '#F26655' }}>.</span>
        </Typography>

        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 2 }}>
  <TextField
    fullWidth
    variant="outlined"
    placeholder="Ask anything about courses..."
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    sx={{
      bgcolor: '#f9f9f9',
      borderRadius: '25px',  // Subtle rounded corners
      width: { xs: '90%', md: '60%' }, // Reduced width for a more compact feel
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)', // Softer shadow for a sleek look
      '& .MuiOutlinedInput-root': {
        borderRadius: '25px',
        padding: '0 20px',
        height: '50px',
        transition: 'all 0.3s ease-in-out',
        '& fieldset': {
          borderColor: 'transparent',
        },
        '&:hover fieldset': {
          borderColor: '#bbb',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#000',
          boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
        },
      },
      '& .MuiInputAdornment-root': {
        marginRight: '10px',
      },
    }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon sx={{ color: '#888', fontSize: '24px' }} />
        </InputAdornment>
      ),
    }}
  />
  <Button
    variant="contained"
    type="submit"
    disabled={loading}
    sx={{
      background: '#000',
      borderRadius: '25px',
      boxShadow: 'none', // Remove heavy shadow for a flat design
      color: 'white',
      fontWeight: 'bold',
      padding: '10px 30px', // Increased padding for more elegance
      transition: 'background-color 0.3s ease-in-out',
      '&:hover': {
        backgroundColor: '#333', // Slight color change on hover
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
              bgcolor: '#f9f9f9', 
              borderRadius: 2,
              width: '100%',
              maxWidth: '800px',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            {(department || courseNumber) && (
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {department && <Chip label={`Department: ${department}`} color="primary" />}
                {courseNumber && <Chip label={`Course: ${courseNumber}`} color="secondary" />}
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
        {showScrollMessage && (
  <Box 
    sx={{ 
      position: 'fixed', 
      bottom: 80, /* Increased the bottom margin from 20 to 80 */
      left: '50%', 
      transform: 'translateX(-50%)',
      width: '200px',
      textAlign: 'center'
    }}
  >
    <Typography variant="body2" sx={{ mb: 1, color: '#333' }}>
      Scroll more to view details
    </Typography>
    <LinearProgress 
      variant="determinate" 
      value={scrollProgress * 100} 
      sx={{ 
        height: 10, 
        borderRadius: 5,
        backgroundColor: '#f0f0f0',
        '& .MuiLinearProgress-bar': {
          backgroundColor: '#000'
        }
      }} 
    />
  </Box>
)}

      </Container>

      {/* Footer Section */}
      <Box sx={{ width: '100%', textAlign: 'center', mt: 'auto', pb: 5 }}> {/* `mt: auto` pushes it to the bottom */}
        <Typography variant="body2" sx={{ color: '#999' }}>
          © 2024 CourseMe. All Rights Reserved.
        </Typography>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LandingPage;
