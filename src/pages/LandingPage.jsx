import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import ReactTypingEffect from 'react-typing-effect';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from '@mui/icons-material'; // Import the lock icon from Material-UI


import { 
  Container, Box, Typography, TextField, Button, 
  InputAdornment, CircularProgress, Paper, Snackbar,
  Alert, Chip, LinearProgress, ButtonBase, Tooltip, Fade
} from '@mui/material';

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
  const [extendPage, setExtendPage] = useState(false);
  const { currentUser } = useAuth(); // Get current user status


  const [difficulty, setDifficulty] = useState(null);
  const [sentiment, setSentiment] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    setDepartment('');
    setCourseNumber('');
    setDocumentName('');
    setShowScrollMessage(false);
    setDifficulty(null);
    setSentiment(null);

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
        setDifficulty(response.data.difficulty || null);
        setSentiment(response.data.sentiment || null);
        
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


  const getDifficultyLevel = (score) => {
    if (score < -0.5) return "Very Challenging";
    if (score < -0.2) return "Challenging";
    if (score < 0.2) return "Moderate";
    if (score < 0.5) return "Easy";
    return "Very Easy";
  };

  const getSentimentLevel = (score) => {
    if (score < -0.5) return "Strongly Dislike";
    if (score < -0.2) return "Dislike";
    if (score < 0.2) return "Neutral";
    if (score < 0.5) return "Like";
    return "Love";
  };

  const getColor = (score) => {
    if (score < -0.5) return "#ff4d4d";
    if (score < -0.2) return "#ff9933";
    if (score < 0.2) return "#ffff66";
    if (score < 0.5) return "#99ff66";
    return "#66ff66";
  };

  const ScaleMeter = ({ value, title, getLevelFunc }) => (
    <Tooltip title={`${getLevelFunc(value)} (${value.toFixed(2)})`} placement="top" arrow>
      <Box sx={{ width: 150, mr: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{title}</Typography>
        <Box sx={{ width: '100%', height: 10, bgcolor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
          <Box
            sx={{
              width: `${((value + 1) / 2) * 100}%`,
              height: '100%',
              bgcolor: getColor(value),
              transition: 'width 0.5s ease-in-out',
            }}
          />
        </Box>
      </Box>
    </Tooltip>
  );

  // Redirect to login if the user isn't logged in
const handleLoginRedirect = () => {
  if (!currentUser) {
    navigate('/login');
  }
};

  // Typing effect messages
  const typingMessages = [
    "Simplify Your Major, Amplify Your College Life.",
    "Find Easy Courses in Seconds.",
    "Plan Your Perfect Schedule Today."
  ];

  const formatAnswer = (text) => {
    const customRenderers = {
      p: ({ children }) => <Typography variant="body1" sx={{ color: '#333', textAlign: 'left', mb: 2 }}>{children}</Typography>,
      strong: ({ children }) => <Box component="span" sx={{ fontWeight: 'bold' }}>{children}</Box>,
    };
  
    return (
      <ReactMarkdown components={customRenderers}>
        {text}
      </ReactMarkdown>
    );
  };
  // turn on for line breaks
  // const formatAnswer = (text) => {
  //   const customRenderers = {
  //     p: ({ children }) => <Typography variant="body1" sx={{ color: '#333', textAlign: 'left', mb: 2 }}>{children}</Typography>,
  //     strong: ({ children }) => <Box component="span" sx={{ fontWeight: 'bold' }}>{children}</Box>,
  //   };
  
  //   // Replace \n with <br /> for line breaks
  //   const formattedText = text.replace(/\n/g, '  \n');
  
  //   return (
  //     <ReactMarkdown 
  //       components={customRenderers}
  //       remarkPlugins={[remarkGfm]}
  //     >
  //       {formattedText}
  //     </ReactMarkdown>
  //   );
  // };
  useEffect(() => {
    // Set extendPage to true when course chips and scroll message are shown
    setExtendPage(!!(department && courseNumber && showScrollMessage));
  }, [department, courseNumber, showScrollMessage]);

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
        const scrollHeight = viewportHeight * 0.2;
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
        paddingBottom: extendPage ? '200px' : '0',
        transition: 'padding-bottom 0.3s ease',
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
  displayTextRenderer={(text, i) => {
    const isSecondSentence = i === 1;
    const sentenceColor = isSecondSentence ? '#571ce0' : '#000'; // Choose sentence color
    const hasFullStop = text.endsWith('.'); // Check if the sentence has a full stop
    const textWithoutStop = hasFullStop ? text.slice(0, -1) : text; // Remove the full stop if present
    const fullStop = hasFullStop ? '.' : ''; // Keep only the full stop for separate rendering

    return (
      <span>
        {/* Render the typed sentence */}
        <span style={{ color: sentenceColor, fontFamily: 'SF Pro Display, sans-serif', fontWeight: '600' }}>
          {textWithoutStop}
        </span>
        {/* Render the full stop only after the text has finished typing */}
        {fullStop && (
          <span style={{ color: '#F26655' }}>
            {fullStop}
          </span>
        )}
      </span>
    );
  }}
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
  onClick={() => currentUser ? navigate('/classes') : handleLoginRedirect()} // Check if user is logged in
  sx={{
      width: { xs: '140px', sm: '160px', md: '200px' },   // Increased width slightly
      height: { xs: '150px', sm: '170px', md: '180px' },   // Increased height for spacing
      margin: '20px 0', // Add some margin to the top and bottom

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
  onClick={() => currentUser ? navigate('/layups') : handleLoginRedirect()} // Check if user is logged in
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
  onClick={() => currentUser ? navigate('/timetable') : handleLoginRedirect()} // Check if user is logged in
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
      Add your courses to your calendar in one Click<span style={{ color: '#F26655' }}>.</span>
    </Typography>
  </ButtonBase>

  {/* Profile Box */}
  <ButtonBase
  onClick={() => currentUser ? navigate('/profile') : handleLoginRedirect()} // Check if user is logged in
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
  {/* New Feature Box */}
  {/* Notifications Box */}
<ButtonBase
  onClick={() => currentUser ? navigate('/timetable') : handleLoginRedirect()} // Check if user is logged in
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
  <Typography variant="h3" sx={{ fontSize: '1.5rem', mb: '8px' }}>🔔</Typography>
  <Typography variant="h6" sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' }, fontWeight: '600', textAlign: 'center' }}>Notifications</Typography>

  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: '#666', mt: '4px', textAlign: 'center' }}>
    Get notified when a spot opens up during the add/drop period<span style={{ color: '#F26655' }}>.</span>
  </Typography>
  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' }, color: '#666', mt: '4px', textAlign: 'center' }}>
    Beta is ready<span style={{ color: '#F26655' }}>.</span> Try it out!
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
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              mb: 2
            }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {department && <Chip label={`Department: ${department}`} color="primary" />}
                {courseNumber && <Chip label={`Course: ${courseNumber}`} color="secondary" />}
                {difficulty !== null && (
                  <ScaleMeter value={difficulty} title="Layup Meter" getLevelFunc={getDifficultyLevel} />
                )}
                {sentiment !== null && (
                  <ScaleMeter value={sentiment} title="Quality Meter" getLevelFunc={getSentimentLevel} />
                )}
              </Box>
              
              {/* Enhanced Scroll message effect */}
              {showScrollMessage && (
                <Tooltip title="Scroll down to see more course details" placement="top">
                  <Fade in={showScrollMessage}>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        ml: 2,
                        bgcolor: '#f0f8ff',
                        p: 1,
                        borderRadius: 2,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: '#e6f3ff',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        Scroll for Details
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={scrollProgress * 100} 
                          sx={{ 
                            height: 8,
                            borderRadius: 4,
                            width: '100px',
                            bgcolor: '#bbdefb',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#1976d2',
                            },
                          }} 
                        />
                      </Box>
                    </Box>
                  </Fade>
                </Tooltip>
              )}
            </Box>

            <Box sx={{ color: '#333', textAlign: 'left', mb: 2 }}>
              {formatAnswer((department && courseNumber) 
                ? answer.replace(new RegExp(`^${department}\\s*${courseNumber}\\s*`), '')
                : answer
              )}
            </Box>

            {/* New note below the AI response */}
            <Typography variant="body2" sx={{ color: '#888', mt: 2 }}>
              Note: This AI chatbot is in its very early stage of development, and we are actively working on improving it.
            </Typography>
          </Paper>
        )}
      </Container>

      

      {/* Scroll message effect */}
      {/* {showScrollMessage && (
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
      )} */}

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
  Built with <span>💚</span> in Dartmouth Dorms, just for you.
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

const styles = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-3px);
    }
  }
`;

export default () => (
  <>
    <style>{styles}</style>
    <LandingPage />
  </>
);