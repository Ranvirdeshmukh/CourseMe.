import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Container, Box, Typography, TextField, Button, 
  InputAdornment, CircularProgress, Paper, Snackbar,
  Alert, Chip, LinearProgress, ButtonBase
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import ReactTypingEffect from 'react-typing-effect';

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
  const [showScrollMessage, setShowScrollMessage] = useState(false); // New state for scroll message
  const navigate = useNavigate();
  const pageRef = useRef(null);

  // Typing effect messages
  const typingMessages = [
    "Simplify Your Major, Amplify Your College Life.",
    "Find Easy Courses in Seconds.",
    "Plan Your Perfect Schedule Today."
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    setDepartment('');
    setCourseNumber('');
    setDocumentName('');
    setShowScrollMessage(false); // Reset scroll message

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

      // Display scroll message if department and course number are available
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
        background: '#f9f9f9', 
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
          flexGrow: 1,
          textAlign: 'center',
        }}
      >

         {/* Typing effect for the main heading */}
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
          <ReactTypingEffect
            text={typingMessages}
            typingDelay={1000}
            speed={100}
            eraseSpeed={50}
            eraseDelay={3000}
          />
        </Typography>

        
        <Box 
  sx={{
    display: 'flex',
    flexDirection: 'row',                    
    gap: { xs: 1, md: 2 },                   
    width: '100%',
    justifyContent: 'center',                
    alignItems: 'center',                    
    mb: 4,
    overflowX: 'auto',                       
    padding: { xs: '10px 0', md: 0 },        
  }}
>
  {/* Classes Box */}
  <ButtonBase
    onClick={() => navigate('/classes')}
    sx={{
      width: { xs: '140px', sm: '160px', md: '200px' },   // Increased width slightly
      height: { xs: '150px', sm: '170px', md: '180px' },   // Increased height for spacing
      backgroundColor: '#f9f9f9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.3s ease, background-color 0.3s ease',
      padding: '10px',  // Added padding for breathing room
      '&:hover': {
        backgroundColor: '#ececec',
        transform: 'translateY(-5px)',
      },
    }}
  >
    <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: '8px' }}>📚</Typography>
    <Typography variant="h6" sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, fontWeight: '600', textAlign: 'center' }}>Classes</Typography>
    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: '#666', mt: '4px', textAlign: 'center' }}>
      Explore the courses and their reviews at <span style={{ color: '#00693e' }}>Dartmouth</span><span style={{ color: '#F26655' }}>.</span>
    </Typography>
  </ButtonBase>

  {/* Layups Box */}
  <ButtonBase
    onClick={() => navigate('/layups')}
    sx={{
      width: { xs: '140px', sm: '160px', md: '200px' },   
      height: { xs: '150px', sm: '170px', md: '180px' },   
      backgroundColor: '#f9f9f9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      padding: '10px',
      transition: 'transform 0.3s ease, background-color 0.3s ease',
      '&:hover': {
        backgroundColor: '#ececec',
        transform: 'translateY(-5px)',
      },
    }}
  >
    <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: '8px' }}>🎯</Typography>
    <Typography variant="h6" sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, fontWeight: '600', textAlign: 'center' }}>Layups</Typography>
    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: '#666', mt: '4px', textAlign: 'center' }}>
      Find your easy A<span style={{ color: '#F26655' }}>.</span>
    </Typography>
  </ButtonBase>

  {/* Timetable Box */}
  <ButtonBase
    onClick={() => navigate('/timetable')}
    sx={{
      width: { xs: '140px', sm: '160px', md: '200px' },   
      height: { xs: '150px', sm: '170px', md: '180px' },   
      backgroundColor: '#f9f9f9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      padding: '10px',
      transition: 'transform 0.3s ease, background-color 0.3s ease',
      '&:hover': {
        backgroundColor: '#ececec',
        transform: 'translateY(-5px)',
      },
    }}
  >
    <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: '8px' }}>🗓️</Typography>
    <Typography variant="h6" sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, fontWeight: '600', textAlign: 'center' }}>Timetable</Typography>
    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: '#666', mt: '4px', textAlign: 'center' }}>
      Plan your schedule in one Click<span style={{ color: '#F26655' }}>.</span>
    </Typography>
  </ButtonBase>

  {/* Profile Box */}
  <ButtonBase
    onClick={() => navigate('/profile')}
    sx={{
      width: { xs: '140px', sm: '160px', md: '200px' },   
      height: { xs: '150px', sm: '170px', md: '180px' },   
      backgroundColor: '#f9f9f9',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '12px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      padding: '10px',
      transition: 'transform 0.3s ease, background-color 0.3s ease',
      '&:hover': {
        backgroundColor: '#ececec',
        transform: 'translateY(-5px)',
      },
    }}
  >
    <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: '8px' }}>👤</Typography>
    <Typography variant="h6" sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, fontWeight: '600', textAlign: 'center' }}>Profile</Typography>
    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: '#666', mt: '4px', textAlign: 'center' }}>
      Organize everything here<span style={{ color: '#F26655' }}>.</span>
    </Typography>
  </ButtonBase>
</Box>


       
        {/* Search bar */}
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask anything about courses..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            sx={{
              bgcolor: '#f9f9f9',
              borderRadius: '25px',
              width: { xs: '90%', md: '60%' },
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
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
            disableElevation
            sx={{
              backgroundColor: '#000',
              borderRadius: '25px',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 30px',
              transition: 'background-color 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: '#571CEO',
              },
              '&:active': {
                backgroundColor: '#571CEO',
              },
              fontSize: { xs: '0.875rem', md: '1rem' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
          </Button>
        </Box>

        {/* Answer section */}
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

            {/* New note below the AI response */}
            <Typography variant="body2" sx={{ color: '#888', mt: 2 }}>
              Note: This AI chatbot is in its very early stage of development, and we are actively working on improving it.
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Scroll message effect */}
      {showScrollMessage && (
        <Box 
          sx={{ 
            position: 'fixed', 
            bottom: 80,
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

      {/* Footer Section */}
<Box 

>
  <Typography 
    variant="body2" 
    sx={{ 
      color: '#333', 
      fontSize: '0.875rem',  // Slightly smaller text
      fontFamily: 'SF Pro Display, sans-serif',  // Keeping it consistent with Apple-like font
      mb: 1 
    }}
  >
    © 2024 CourseMe. All Rights Reserved.
  </Typography>
  <Typography 
    variant="body2" 
    sx={{ 
      color: '#666', 
      fontSize: '0.85rem', 
      fontFamily: 'SF Pro Display, sans-serif',
      fontWeight: 400, 
    }}
  >
  Built with <span style={{ color: '#FF5A5F' }}>❤️</span> in Dartmouth Dorms, just for you.
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
