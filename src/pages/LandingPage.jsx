import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import ReactTypingEffect from 'react-typing-effect';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { Lock, OpenInNew, AccessTime, CloudOutlined, LocationOn } from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import MobileNavigation from '../Mobileversion/MobileNavigation';
import MobileLandingPage from '../Mobileversion/MobileLandingPage';
import RefreshIcon from '@mui/icons-material/Refresh';

import { 
  Container, Box, Typography, TextField, Button, 
  InputAdornment, CircularProgress, Paper, Snackbar,
  Alert, Chip, LinearProgress, ButtonBase, Tooltip, Fade, IconButton
} from '@mui/material';

// ----------------------------------------------------------------------------------
// 1) Revert to the original PythonAnywhere endpoint
// ----------------------------------------------------------------------------------
const API_URL = 'https://coursemebot.pythonanywhere.com/api/chat';

// ----------------------------------------------------------------------------------
// 2) Firebase config
// ----------------------------------------------------------------------------------
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

const LandingPage = ({ darkMode }) => {
  // --------------------------------------------------------------------------------
  // 3) State management
  // --------------------------------------------------------------------------------
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
  const [extendPage, setExtendPage] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState({ temp: null, icon: null, desc: null });

  // Difficulty & Sentiment
  const [difficulty, setDifficulty] = useState(null);
  const [sentiment, setSentiment] = useState(null);

  // State for fade-in transition
  const [fadeIn, setFadeIn] = useState(false);

  const pageRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // --------------------------------------------------------------------------------
  // 4) UI constants
  // --------------------------------------------------------------------------------
  const [typingMessages, setTypingMessages] = useState([
    "Unlock Your Academic Edge.",
    "Find Easy Courses in Seconds.",
    "Plan Your Perfect Schedule Today."
  ]);

  // Update the typing messages when user logs in
  useEffect(() => {
    const defaultMessages = [
      "All of Dartmouth uses it, don't you?",
      "Unlock Your Academic Edge.",
      "Find Easy Courses in Seconds.", 
      "Plan Your Perfect Schedule Today."
    ];

    const fetchUserName = async () => {
      if (currentUser) {
        let firstName = '';
        // First try to get name from Auth profile
        if (currentUser.displayName) {
          firstName = currentUser.displayName.split(' ')[0];
          updateTypingMessages(firstName);
        } else {
          // If not available, try to get it from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists() && userDoc.data().firstName) {
              firstName = userDoc.data().firstName;
              updateTypingMessages(firstName);
            } else {
              // Fallback to just "Welcome" without name
              updateTypingMessages('');
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            updateTypingMessages('');
          }
        }
      } else {
        // Reset to default messages if no user
        setTypingMessages(defaultMessages);
      }
    };

    const updateTypingMessages = (firstName) => {
      // Check if this is the first login for the user
      const isFirstLogin = !localStorage.getItem(`hasLoggedIn_${currentUser.uid}`);
      if (isFirstLogin) {
        // Set a flag for this user to track that they've logged in before
        localStorage.setItem(`hasLoggedIn_${currentUser.uid}`, 'true');
        
        // Set first-time welcome message
        if (firstName) {
          setTypingMessages([
            `Welcome aboard, ${firstName}!`,
            ...defaultMessages.slice(1) // Skip the first message for logged-in users
          ]);
        } else {
          setTypingMessages([
            "Welcome aboard!",
            ...defaultMessages.slice(1) // Skip the first message for logged-in users
          ]);
        }
      } else {
        // Regular welcome back message for returning users
        if (firstName) {
          setTypingMessages([
            `Welcome back, ${firstName}.`,
            ...defaultMessages.slice(1) // Skip the first message for logged-in users
          ]);
        } else {
          // Use generic welcome if no name is available
          setTypingMessages([
            "Welcome back.",
            ...defaultMessages.slice(1) // Skip the first message for logged-in users
          ]);
        }
      }
    };

    fetchUserName();
  }, [currentUser]);

  // Color scheme based on darkMode (just as reference if needed)
  const navBoxBgColor = darkMode ? '#333333' : '#f9f9f9';
  const navBoxHoverBgColor = darkMode ? '#444444' : '#ececec';
  const navBoxTextColor = darkMode ? '#FFFFFF' : '#000000';
  const navBoxDescriptionColor = darkMode ? '#CCCCCC' : '#666666';
  const drawerBgColor = darkMode ? '#333333' : '#E4E2DC';
  const footerTextColor = darkMode ? '#CCCCCC' : '#333333';

  // --------------------------------------------------------------------------------
  // 5) The function that hits the PythonAnywhere API and sets answer/department/etc.
  // --------------------------------------------------------------------------------
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
      const response = await axios.post(
        API_URL,
        { question },    // <--- "question" key for the pythonanywhere endpoint
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('API Response:', response.data);

      // The older logic expected an object: { answer, department, course_number, difficulty, sentiment, ... }
      if (typeof response.data === 'object' && response.data.answer) {
        setAnswer(response.data.answer);
        setDepartment(response.data.department || '');
        setCourseNumber(response.data.course_number || '');
        setDifficulty(response.data.difficulty || null);
        setSentiment(response.data.sentiment || null);

        // If the chatbot gave us a department + course number, fetch the doc from Firestore
        if (response.data.department && response.data.course_number) {
          await fetchCourseData(response.data.department, response.data.course_number);
          setShowScrollMessage(true);
        }
      } else if (typeof response.data === 'string') {
        // The fallback, if the API returns just a string answer
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

  // --------------------------------------------------------------------------------
  // 6) Helper functions for difficulty & sentiment
  // --------------------------------------------------------------------------------
  const getDifficultyLevel = (score) => {
    if (score < -0.5) return "Very Challenging";
    if (score < -0.2) return "Challenging";
    if (score < 0.2)  return "Moderate";
    if (score < 0.5)  return "Easy";
    return "Very Easy";
  };

  const getSentimentLevel = (score) => {
    if (score < -0.5) return "Strongly Dislike";
    if (score < -0.2) return "Dislike";
    if (score < 0.2)  return "Neutral";
    if (score < 0.5)  return "Like";
    return "Love";
  };

  const getColor = (score) => {
    if (score < -0.5) return "#ff4d4d";
    if (score < -0.2) return "#ff9933";
    if (score <  0.2) return "#ffff66";
    if (score <  0.5) return "#99ff66";
    return "#66ff66";
  };

  const ScaleMeter = ({ value, title, getLevelFunc }) => (
    <Tooltip
      title={`${getLevelFunc(value)} (${value.toFixed(2)})`}
      placement="top"
      arrow
    >
      <Box sx={{ width: 150, mr: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: 10,
            bgcolor: '#e0e0e0',
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
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

  // --------------------------------------------------------------------------------
  // 7) Firebase logic to fetch a document if department/course number is found
  // --------------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------------
  // 8) If the answer text might contain something like "COSC 1" at the start,
  //    parse it out and do the fetch in case the chatbot didn't explicitly
  //    return department/courseNumber
  // --------------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------------
  // 9) Scroll detection: if we have a documentName, we wait until the user
  //    scrolls 90% of the way, then redirect them to the course page
  // --------------------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      if (pageRef.current && documentName) {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        const scrollableDistance = documentHeight - windowHeight;
        const scrollPercentage = scrollPosition / scrollableDistance;
        setScrollProgress(Math.min(scrollPercentage, 1));
    
        // Trigger navigation when scrolled 90%
        if (scrollPercentage >= 0.9) {
          window.removeEventListener('scroll', handleScroll);
          setTimeout(() => {
            window.scrollTo(0, 0);
            navigate(`/departments/${department}/courses/${documentName}`);
          }, 300);
        }
      }
    };

    if (documentName) {
      window.addEventListener('scroll', handleScroll);
      // Force a small scroll offset to ensure content is scrollable
      if (pageRef.current) {
        const minScrollHeight = window.innerHeight * 1.2;
        pageRef.current.style.minHeight = `${minScrollHeight}px`;
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [department, documentName, navigate]);

  // Extend the page if we have the "scroll more" chips
  useEffect(() => {
    setExtendPage(!!(department && courseNumber && showScrollMessage));
  }, [department, courseNumber, showScrollMessage]);

  // --------------------------------------------------------------------------------
  // 10) Format the AI answer with markdown
  // --------------------------------------------------------------------------------
  const formatAnswer = (text) => {
    const customRenderers = {
      p: ({ children }) => (
        <Typography
          variant="body1"
          sx={{
            color: darkMode ? '#ffffff' : '#333333',
            textAlign: 'left',
            mb: 2,
          }}
        >
          {children}
        </Typography>
      ),
      strong: ({ children }) => (
        <Box component="span" sx={{ fontWeight: 'bold' }}>
          {children}
        </Box>
      ),
    };
  
    return (
      <ReactMarkdown components={customRenderers} remarkPlugins={[remarkGfm]}>
        {text}
      </ReactMarkdown>
    );
  };

  // --------------------------------------------------------------------------------
  // 11) Popups: Beta and "Review Popup" - Removed
  // --------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------
  // 12) If user is not logged in, redirect them to login
  // --------------------------------------------------------------------------------
  const handleLoginRedirect = () => {
    if (!currentUser) {
      navigate('/login');
    }
  };

  // --------------------------------------------------------------------------------
  // 13) Snackbar close
  // --------------------------------------------------------------------------------
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Create a common button style object
  const buttonBaseStyle = {
    width: { xs: '140px', sm: '160px', md: '200px' },
    height: { xs: '150px', sm: '170px', md: '180px' },
    backgroundColor: darkMode ? 'rgba(28, 9, 63, 0.6)' : '#f9f9f9',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '16px',
    border: darkMode 
      ? '1px solid rgba(87, 28, 224, 0.2)' 
      : '1px solid rgba(0, 0, 0, 0.05)',
    padding: '10px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: darkMode 
      ? '0 8px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(87, 28, 224, 0.08)' 
      : '0 8px 16px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.02)',
    background: darkMode 
      ? 'linear-gradient(145deg, rgba(44, 25, 79, 0.55), rgba(28, 9, 63, 0.55))' 
      : 'linear-gradient(145deg, #ffffff, #f7f7f7)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: darkMode ? 'rgba(44, 25, 79, 0.7)' : '#f1f1f1',
      transform: 'scale(1.02)',
      boxShadow: darkMode 
        ? '0 10px 25px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(87, 28, 224, 0.25)' 
        : '0 10px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
      border: darkMode 
        ? '1px solid rgba(87, 28, 224, 0.35)' 
        : '1px solid rgba(0, 0, 0, 0.08)',
      '& .button-icon': {
        transform: 'scale(1.05)',
      },
      '& .button-glow': {
        opacity: darkMode ? 0.8 : 0.6,
        transform: 'scale(1.02)',
      }
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        // OpenWeatherMap API for the actual weather data
        const apiKey = 'bd5e378503939ddaee76f12ad7a97608'; // Free OpenWeatherMap API key
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
        );
        
        if (response.data) {
          // Store the raw temperature value without formatting it
          const rawTemp = response.data.main.temp;
          
          console.log('Weather fetched:', new Date().toLocaleString(), 
            'Temp:', rawTemp, '°F');
          
          setWeatherData({
            temp: rawTemp, // Store the raw temperature
            tempDisplay: Math.round(rawTemp), // Rounded for display, but without calibration
            icon: response.data.weather[0].icon,
            desc: response.data.weather[0].description,
            city: response.data.name,
            lat: response.data.coord.lat,
            lon: response.data.coord.lon
          });
          
          // Store successful weather data in localStorage for future use
          localStorage.setItem('weatherData', JSON.stringify({
            temp: rawTemp, // Store raw temperature
            tempDisplay: Math.round(rawTemp), // Rounded for display, but without calibration
            icon: response.data.weather[0].icon,
            desc: response.data.weather[0].description,
            city: response.data.name,
            lat: response.data.coord.lat,
            lon: response.data.coord.lon,
            timestamp: new Date().getTime() // Add timestamp
          }));
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        // Set fallback weather data from localStorage or default values
        const savedWeather = localStorage.getItem('weatherData');
        if (savedWeather) {
          const parsed = JSON.parse(savedWeather);
          setWeatherData(parsed);
        } else {
          setWeatherData({ 
            temp: 72,
            tempDisplay: 72,
            icon: '01d', 
            desc: 'clear sky',
            city: 'Hanover',
            lat: 43.7044,
            lon: -72.2887
          });
        }
      }
    };
    
    // Get weather data without asking for precise location permission
    const getWeatherData = () => {
      // Always try to use IP-based geolocation first (doesn't require permission)
      const fetchLocationByIP = async () => {
        try {
          // Use IP-based geolocation (this doesn't require permission)
          const response = await axios.get('https://ipapi.co/json/');
          if (response.data && response.data.latitude && response.data.longitude) {
            fetchWeather(response.data.latitude, response.data.longitude);
            
            // Store coordinates in localStorage for future use
            localStorage.setItem('userLat', response.data.latitude);
            localStorage.setItem('userLon', response.data.longitude);
            localStorage.setItem('userCity', response.data.city);
          } else {
            throw new Error('IP geolocation failed');
          }
        } catch (error) {
          console.error('IP geolocation error:', error);
          // Use saved coordinates or fallback to Dartmouth
          const storedLat = localStorage.getItem('userLat');
          const storedLon = localStorage.getItem('userLon');
          
          if (storedLat && storedLon) {
            fetchWeather(parseFloat(storedLat), parseFloat(storedLon));
          } else {
            // Last resort fallback to Dartmouth College
            fetchWeather(43.7044, -72.2887);
          }
        }
      };

      // First show cached data immediately if available
      const cachedWeather = localStorage.getItem('weatherData');
      if (cachedWeather) {
        // Use cached data temporarily while fetching fresh data
        setWeatherData(JSON.parse(cachedWeather));
      }
      
      // Then fetch fresh data using IP-based geolocation (no permission needed)
      fetchLocationByIP();
    };

    // Call our new function instead of getUserLocation()
    getWeatherData();
    
    // Expose these functions to the component scope for manual refreshing
    window.weatherUtils = {
      fetchWeather,
      getWeatherData
    };
    
    return () => {
      // Clean up the global reference
      delete window.weatherUtils;
    };
  }, []);

  // Determine which weather service to open based on device
  const handleWeatherClick = () => {
    if (!weatherData.lat || !weatherData.lon) return;
    
    try {
      // Direct user to Bing/MSN Weather for the location
      // Format for MSN Weather URL
      const cityParam = weatherData.city ? encodeURIComponent(weatherData.city) : 'YourLocation';
      let msnWeatherUrl;
      
      // Primary format: Try using city + coordinates
      if (weatherData.city) {
        msnWeatherUrl = `https://www.msn.com/en-us/weather/forecast/in-${cityParam}?loc=${weatherData.lat},${weatherData.lon}`;
      } else {
        // Fallback to direct coordinates URL
        msnWeatherUrl = `https://www.msn.com/en-us/weather/forecast?lat=${weatherData.lat}&lon=${weatherData.lon}`;
      }
      
      // Open in new tab
      window.open(msnWeatherUrl, '_blank');
    } catch (error) {
      console.error("Error opening weather link:", error);
      
      // Fallback to Bing search for weather if MSN direct link fails
      const cityName = weatherData.city ? `weather in ${encodeURIComponent(weatherData.city)}` : 
                      `weather ${weatherData.lat},${weatherData.lon}`;
      window.open(`https://www.bing.com/search?q=${encodeURIComponent(cityName)}`, '_blank');
    }
  };
  
  // Format time as HH:MM:SS AM/PM (with seconds)
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };
  
  // Format date as Day, Month Date, Year with ordinal indicator (e.g. 1st, 2nd, 3rd)
  const formatDate = (date) => {
    // Get day number and add ordinal suffix
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    
    // Use toLocaleDateString for basic format then customize
    const rawDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Replace the day number with day + ordinal suffix
    return rawDate.replace(
      new RegExp(`${day},`), 
      `${day}${ordinalSuffix},`
    );
  };
  
  // Helper function to get ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Style with CSS keyframes for time pulse animation
  const styles = {
    '@keyframes timePulse': {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.9 },
      '100%': { opacity: 1 }
    },
    '@keyframes subtleFade': {
      '0%': { opacity: 0.7 },
      '50%': { opacity: 0.9 },
      '100%': { opacity: 0.7 }
    }
  };

  // Add this new function near the other weather-related functions
  const refreshWeather = () => {
    console.log('Manual weather refresh triggered');
    // Clear any locally cached coordinates to force a full refresh
    const storedLat = localStorage.getItem('userLat');
    const storedLon = localStorage.getItem('userLon');
    
    if (storedLat && storedLon && window.weatherUtils) {
      // If we have coordinates, fetch fresh weather data
      window.weatherUtils.fetchWeather(parseFloat(storedLat), parseFloat(storedLon));
    } else if (window.weatherUtils) {
      // Otherwise restart the location detection process
      window.weatherUtils.getWeatherData();
    } else {
      console.error('Weather utilities not available');
    }
  };

  // Check if coming from intro page and trigger fade-in effect
  useEffect(() => {
    const isComingFromIntro = sessionStorage.getItem('comingFromIntro') === 'true';
    
    if (isComingFromIntro) {
      // Start with opacity 0
      setFadeIn(false);
      
      // Remove the flag from sessionStorage
      sessionStorage.removeItem('comingFromIntro');
      
      // Trigger fade-in after a small delay
      setTimeout(() => {
        setFadeIn(true);
      }, 50);
    } else {
      // If not coming from intro, set to fully visible
      setFadeIn(true);
    }
  }, []);

  // --------------------------------------------------------------------------------
  // 14) Return the UI
  // --------------------------------------------------------------------------------
  return (
    <Box
      ref={pageRef}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: darkMode
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
          : '#f9f9f9',
        color: darkMode ? '#FFF' : '#000',
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '0 20px',
        paddingBottom: extendPage ? '200px' : '0',
        transition: 'padding-bottom 0.3s ease, opacity 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
        opacity: fadeIn ? 1 : 0,
        ...styles, // Add the keyframes styles
      }}
    >
      {/* For mobile devices - show the mobile landing page component */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, width: '100%' }}>
        <MobileLandingPage 
          darkMode={darkMode}
          handleSearch={handleSearch}
          question={question}
          setQuestion={setQuestion}
          loading={loading}
          answer={answer}
          department={department}
          courseNumber={courseNumber}
          documentName={documentName}
          showScrollMessage={showScrollMessage}
          scrollProgress={scrollProgress}
          difficulty={difficulty}
          sentiment={sentiment}
          getDifficultyLevel={getDifficultyLevel}
          getSentimentLevel={getSentimentLevel}
          getColor={getColor}
          currentUser={currentUser}
          handleLoginRedirect={handleLoginRedirect}
          typingMessages={typingMessages}
          currentTime={currentTime}
          formatTime={formatTime}
          formatDate={formatDate}
          weatherData={weatherData}
        />
      </Box>

      {/* For tablets and larger - show the desktop version */}
      <Container
        sx={{
          display: { xs: 'none', sm: 'flex' }, // Hide on mobile, show on sm and up
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flexGrow: 1,
          textAlign: 'center',
        }}
      >
        {/* Current Time & Weather Display - Centered at the top */}
        {currentUser && (
          <Box
            sx={{
              position: 'fixed',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9,
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: darkMode 
                ? 'rgba(21, 8, 47, 0.3)' 
                : 'rgba(255, 255, 255, 0.4)',
              padding: '3px 10px',  // Reduced horizontal padding
              borderRadius: '10px',
              boxShadow: darkMode 
                ? '0 2px 8px rgba(0, 0, 0, 0.08)' 
                : '0 1px 2px rgba(0, 0, 0, 0.03)',
              backdropFilter: 'blur(10px)',
              border: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.03)' 
                : '1px solid rgba(240, 240, 240, 0.7)',
              transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
              width: 'auto',
              minWidth: '240px',  // Reduced minimum width
              '&:hover': {
                transform: 'translateX(-50%) translateY(-1px)',
                boxShadow: darkMode 
                  ? '0 4px 12px rgba(0, 0, 0, 0.12)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.04)',
                bgcolor: darkMode 
                  ? 'rgba(21, 8, 47, 0.4)' 
                  : 'rgba(255, 255, 255, 0.5)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: darkMode
                  ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(150, 150, 255, 0.05), transparent)'
              }
            }}
          >
            {/* Time and Weather Row */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              width: '100%',
              py: 0.5,
              px: 0.5 // Reduce horizontal padding
            }}>
              {/* Time Display - Completely restructured */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'flex-start',
                  flex: 1,
                  gap: 1.5
                }}
              >
                {/* Clock Icon */}
                <Box sx={{ mt: 0.3 }}>
                  <AccessTime 
                    sx={{ 
                      fontSize: '0.8rem',
                      color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                      opacity: 0.9
                    }} 
                  />
                </Box>
                
                {/* Time and Date Container */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}>
                  {/* Time Display */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"SF Pro Display", system-ui, sans-serif',
                      fontWeight: 400,
                      fontSize: '0.85rem',
                      color: darkMode ? '#FFFFFF' : '#000000',
                      letterSpacing: '0.01rem',
                      animation: 'timePulse 4s infinite',
                      display: 'flex',
                      alignItems: 'center',
                      lineHeight: 1.2,
                      '& .colon': {
                        display: 'inline-block',
                        animation: 'subtleFade 2s infinite',
                        opacity: 0.8,
                        mx: 0.1,
                        fontWeight: 300,
                      }
                    }}
                  >
                    {formatTime(currentTime).split(' ').map((part, index) => {
                      if (index === 0) {
                        // Format the time parts with subtle colons
                        const [hours, minutes, seconds] = part.split(':');
                        return (
                          <React.Fragment key={index}>
                            {hours}
                            <span className="colon">:</span>
                            {minutes}
                            <span className="colon">:</span>
                            {seconds}
                          </React.Fragment>
                        );
                      }
                      return (
                        <span key={index} style={{ 
                          marginLeft: '3px', 
                          fontSize: '0.6rem', 
                          opacity: 0.9,
                          fontWeight: 300,
                        }}>
                          {part}
                        </span>
                      );
                    })}
                  </Typography>
                  
                  {/* Date Display */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    alignItems: 'center' 
                  }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'SF Pro Display, system-ui, sans-serif',
                        fontSize: '0.55rem',
                        color: darkMode ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)',
                        textTransform: 'capitalize',
                        fontWeight: 400,
                        lineHeight: 1.1
                      }}
                    >
                      {formatDate(currentTime).split(',')[0]},
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'SF Pro Display, system-ui, sans-serif',
                        fontSize: '0.55rem',
                        color: darkMode ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)',
                        fontWeight: 400,
                        lineHeight: 1.1,
                        ml: 0.3
                      }}
                    >
                      {formatDate(currentTime).split(',')[1]?.trim()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Weather Section */}
              {weatherData.temp && (
                <Tooltip 
                  title="Click for detailed forecast" 
                  placement="bottom" 
                  arrow
                  enterDelay={300}
                  sx={{
                    '& .MuiTooltip-arrow': {
                      color: darkMode ? '#333' : '#f5f5f5',
                    },
                    '& .MuiTooltip-tooltip': {
                      bgcolor: darkMode ? '#333' : '#f5f5f5',
                      color: darkMode ? '#fff' : '#333',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                      fontFamily: 'SF Pro Display, system-ui, sans-serif',
                      fontSize: '0.65rem',
                      fontWeight: 400,
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'flex-end',
                      borderLeft: darkMode 
                        ? '1px solid rgba(255, 255, 255, 0.05)' 
                        : '1px solid rgba(0, 0, 0, 0.03)',
                      pl: 0.6, // Reduced from 1.2
                      ml: 0, // Reduced from 0.5
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.19, 1, 0.22, 1)',
                      minWidth: '60px', // Reduced minimum width
                      '&:hover': {
                        transform: 'scale(1.02) translateX(-2px)',
                      }
                    }}
                    onClick={handleWeatherClick}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                      <Box
                        sx={{
                          position: 'relative', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img 
                          src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} 
                          alt={weatherData.desc}
                          style={{ 
                            width: '20px', 
                            height: '20px',
                            filter: darkMode ? 'brightness(1.2) contrast(0.95)' : 'contrast(0.9)',
                            transition: 'transform 0.5s ease'
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'SF Pro Display, system-ui, sans-serif',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          color: darkMode ? '#FFFFFF' : '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          lineHeight: 1.2,
                          ml: 0.8  // Added margin-left to move temperature to the right
                        }}
                      >
                        {weatherData.tempDisplay || Math.round(weatherData.temp)}°
                      </Typography>
                      
                      {/* Refresh Button */}
                      <Tooltip title="Refresh weather data" placement="top" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent click handler
                            refreshWeather();
                            
                            // Visual feedback animation
                            const target = e.currentTarget;
                            target.style.animation = 'spin 1s linear 1';
                            
                            setTimeout(() => {
                              target.style.animation = 'none';
                            }, 1000);
                          }}
                          sx={{
                            ml: 0.5,
                            padding: '2px',
                            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                            '&:hover': {
                              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            },
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        >
                          <RefreshIcon sx={{ fontSize: '0.7rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'SF Pro Display, system-ui, sans-serif',
                        fontSize: '0.55rem',
                        color: darkMode ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)',
                        textTransform: 'capitalize',
                        fontWeight: 400,
                        mt: '-2px',
                        lineHeight: 1.1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        letterSpacing: '0.02em',
                        px: 0.3,
                        py: 0.1,
                        borderRadius: '3px',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <LocationOn 
                        sx={{ 
                          fontSize: '0.7rem', 
                          mr: 0.3,
                          opacity: 0.9,
                          color: darkMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.6)'
                        }} 
                      />
                      {weatherData.city || weatherData.desc}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'flex-end', 
                      width: '100%',
                      mt: '1px'
                    }}>
                      
                    </Box>
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}
        
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
            eraseDelay={currentUser ? 2000 : 3000}
            displayTextRenderer={(text, i) => {
              const isWelcomeMessage = currentUser && i === 0;
              const isFirstLogin = localStorage.getItem(`hasLoggedIn_${currentUser?.uid}`) === 'true' && 
                                  !localStorage.getItem(`hasSeenWelcome_${currentUser?.uid}`);
              const isJoinPrompt = !currentUser && i === 0 && text.includes('Join them');
              const isSecondSentence = !currentUser ? i === 1 : i === 1;
              
              // Set color based on message type
              const sentenceColor = darkMode
                ? '#FFFFFF'
                : isJoinPrompt
                ? '#e91e63' // Hot pink for "Join them?" prompt
                : isWelcomeMessage && isFirstLogin
                ? '#ff5722' // Exciting orange for first-time users
                : isWelcomeMessage
                ? '#00693e' // Green for returning users
                : isSecondSentence
                ? '#571ce0' // Purple for second sentence
                : '#000000'; // Black for other sentences
              
              // After displaying the welcome message, mark that the user has seen it
              if (currentUser && isWelcomeMessage && isFirstLogin && !localStorage.getItem(`hasSeenWelcome_${currentUser.uid}`)) {
                localStorage.setItem(`hasSeenWelcome_${currentUser.uid}`, 'true');
              }
              
              const hasFullStop = text.endsWith('.');
              const hasExclamation = text.endsWith('!');
              const hasQuestion = text.endsWith('?');
              const textWithoutEnding = hasFullStop ? text.slice(0, -1) : 
                                         hasExclamation ? text.slice(0, -1) : 
                                         hasQuestion ? text.slice(0, -1) : text;
              const ending = hasFullStop ? '.' : 
                             hasExclamation ? '!' : 
                             hasQuestion ? '?' : '';
  
              return (
                <span>
                  <span
                    style={{
                      color: sentenceColor,
                      fontFamily: 'SF Pro Display, sans-serif',
                      fontWeight: '600',
                    }}
                  >
                    {textWithoutEnding}
                  </span>
                  {ending && <span style={{ color: ending === '?' ? '#e91e63' : '#F26655' }}>{ending}</span>}
                </span>
              );
            }}
          />
        </Typography>

        {/* DESKTOP ONLY - Traditional Quick Nav Buttons - hidden on mobile screens */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' }, // Hide on mobile, show on sm and up
            flexDirection: 'row',
            gap: { xs: 1, md: 2 },
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 4,
            overflowX: 'auto',
            padding: { xs: '16px 0', md: '16px 0' },
            marginTop: '16px',
            '&::-webkit-scrollbar': {
              display: 'none', // Hide scrollbar for Chrome, Safari, and newer Edge
            },
            msOverflowStyle: 'none', // Hide scrollbar for IE and older Edge
            scrollbarWidth: 'none', // Hide scrollbar for Firefox
          }}
        >
          {/* Classes */}
          <ButtonBase
            onClick={() => (currentUser ? navigate('/classes') : handleLoginRedirect())}
            sx={buttonBaseStyle}
          >
            <Box 
              className="button-glow" 
              sx={{ 
                position: 'absolute', 
                width: '150%', 
                height: '150%', 
                background: darkMode
                  ? 'radial-gradient(circle, rgba(87, 28, 224, 0.18) 0%, rgba(0, 0, 0, 0) 70%)'
                  : 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 70%)', 
                top: '-25%', 
                left: '-25%',
                opacity: 0,
                transition: 'opacity 0.3s ease, transform 0.4s ease',
                pointerEvents: 'none',
                filter: darkMode ? 'blur(8px)' : 'blur(12px)',
              }} 
            />
            <Typography
              variant="h3"
              className="button-icon"
              sx={{
                fontSize: '1.5rem',
                mb: '8px',
                color: darkMode ? '#FFFFFF' : '#000000',
                transition: 'transform 0.3s ease',
              }}
            >
              📚
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' },
                fontWeight: '600',
                textAlign: 'center',
                color: darkMode ? '#FFFFFF' : '#000000',
              }}
            >
              Classes
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                mt: '4px',
                textAlign: 'center',
              }}
            >
              Explore the courses and their reviews at{' '}
              <span style={{ color: '#00693e' }}>Dartmouth</span>
              <span style={{ color: '#F26655' }}>.</span>
            </Typography>
          </ButtonBase>

          {/* Layups */}
          <ButtonBase
            onClick={() => (currentUser ? navigate('/layups') : handleLoginRedirect())}
            sx={buttonBaseStyle}
          >
            <Box 
              className="button-glow" 
              sx={{ 
                position: 'absolute', 
                width: '150%', 
                height: '150%', 
                background: darkMode
                  ? 'radial-gradient(circle, rgba(87, 28, 224, 0.18) 0%, rgba(0, 0, 0, 0) 70%)'
                  : 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 70%)', 
                top: '-25%', 
                left: '-25%',
                opacity: 0,
                transition: 'opacity 0.3s ease, transform 0.4s ease',
                pointerEvents: 'none',
                filter: darkMode ? 'blur(8px)' : 'blur(12px)',
              }} 
            />
            <Typography
              variant="h3"
              className="button-icon"
              sx={{
                fontSize: '1.5rem',
                mb: '8px',
                color: darkMode ? '#FFFFFF' : '#000000',
                transition: 'transform 0.3s ease',
              }}
            >
              🎯
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' },
                fontWeight: '600',
                textAlign: 'center',
                color: darkMode ? '#FFFFFF' : '#000000',
              }}
            >
              Layups
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                mt: '4px',
                textAlign: 'center',
              }}
            >
              Find your easy A<span style={{ color: '#F26655' }}>.</span>
            </Typography>
          </ButtonBase>

          {/* Professors */}
          <ButtonBase
            onClick={() => (currentUser ? navigate('/professors') : handleLoginRedirect())}
            sx={buttonBaseStyle}
          >
            <Box 
              className="button-glow" 
              sx={{ 
                position: 'absolute', 
                width: '150%', 
                height: '150%', 
                background: darkMode
                  ? 'radial-gradient(circle, rgba(87, 28, 224, 0.18) 0%, rgba(0, 0, 0, 0) 70%)'
                  : 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 70%)', 
                top: '-25%', 
                left: '-25%',
                opacity: 0,
                transition: 'opacity 0.3s ease, transform 0.4s ease',
                pointerEvents: 'none',
                filter: darkMode ? 'blur(8px)' : 'blur(12px)',
              }} 
            />
            <Typography
              variant="h3"
              className="button-icon"
              sx={{
                fontSize: '1.5rem',
                mb: '8px',
                color: darkMode ? '#FFFFFF' : '#000000',
                transition: 'transform 0.3s ease',
              }}
            >
              👨‍🏫
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' },
                fontWeight: '600',
                textAlign: 'center',
                color: darkMode ? '#FFFFFF' : '#000000',
              }}
            >
              Professors
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                mt: '4px',
                textAlign: 'center',
              }}
            >
              AI-powered professor insights
              <span style={{ color: '#F26655' }}>.</span>
            </Typography>
          </ButtonBase>

          {/* Timetable */}
          <ButtonBase
            onClick={() => (currentUser ? navigate('/timetable') : handleLoginRedirect())}
            sx={buttonBaseStyle}
          >
            <Box 
              className="button-glow" 
              sx={{ 
                position: 'absolute', 
                width: '150%', 
                height: '150%', 
                background: darkMode
                  ? 'radial-gradient(circle, rgba(87, 28, 224, 0.18) 0%, rgba(0, 0, 0, 0) 70%)'
                  : 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 70%)', 
                top: '-25%', 
                left: '-25%',
                opacity: 0,
                transition: 'opacity 0.3s ease, transform 0.4s ease',
                pointerEvents: 'none',
                filter: darkMode ? 'blur(8px)' : 'blur(12px)',
              }} 
            />
            <Typography
              variant="h3"
              className="button-icon"
              sx={{
                fontSize: '1.5rem',
                mb: '8px',
                color: darkMode ? '#FFFFFF' : '#000000',
                transition: 'transform 0.3s ease',
              }}
            >
              🗓️
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' },
                fontWeight: '600',
                textAlign: 'center',
                color: darkMode ? '#FFFFFF' : '#000000',
              }}
            >
              Timetable
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                mt: '4px',
                textAlign: 'center',
              }}
            >
              Smart scheduling, seamless sync
              <span style={{ color: '#F26655' }}>.</span>
            </Typography>
          </ButtonBase>

          {/* CORA 1.0 Beta */}
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            {/* Ribbon */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: '12px', sm: '20px' },
                left: { xs: '-5px', sm: '-10px' },
                transform: 'rotate(-45deg)',
                background: darkMode
                  ? 'linear-gradient(45deg, #FF4081, #F50057)'
                  : 'linear-gradient(45deg, #F50057, #FF4081)',
                color: '#fff',
                px: 1,
                py: 0.5,
                borderRadius: '8px',
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                fontWeight: 'bold',
                border: '1px solid #fff',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                zIndex: 1,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'rotate(-45deg) scale(1)' },
                  '50%': { transform: 'rotate(-45deg) scale(1.1)' },
                  '100%': { transform: 'rotate(-45deg) scale(1)' },
                },
                width: { xs: '70px', sm: '80px' },
                height: { xs: '18px', sm: '20px' },
                textAlign: 'center',
              }}
            >
              Beta
            </Box>

            <ButtonBase
              onClick={() => (currentUser ? navigate('/major-tracker') : handleLoginRedirect())}
              sx={buttonBaseStyle}
            >
              <Box 
                className="button-glow" 
                sx={{ 
                  position: 'absolute', 
                  width: '150%', 
                  height: '150%', 
                  background: darkMode
                    ? 'radial-gradient(circle, rgba(87, 28, 224, 0.18) 0%, rgba(0, 0, 0, 0) 70%)'
                    : 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 70%)', 
                  top: '-25%', 
                  left: '-25%',
                  opacity: 0,
                  transition: 'opacity 0.3s ease, transform 0.4s ease',
                  pointerEvents: 'none',
                  filter: darkMode ? 'blur(8px)' : 'blur(12px)',
                }} 
              />
              <Typography
                variant="h3"
                className="button-icon"
                sx={{
                  fontSize: '1.5rem',
                  mb: '8px',
                  color: darkMode ? '#FFFFFF' : '#000000',
                  transition: 'transform 0.3s ease',
                }}
              >
                🤖
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' },
                  fontWeight: '600',
                  textAlign: 'center',
                  color: darkMode ? '#FFFFFF' : '#000000',
                }}
              >
                CORA 1.0
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                  mt: '4px',
                  textAlign: 'center',
                }}
              >
                Your AI college advisor and major planning tool<span style={{ color: '#F26655' }}>.</span>
              </Typography>
            </ButtonBase>
          </Box>

          

          {/* Profile */}
          <ButtonBase
            onClick={() => (currentUser ? navigate('/profile') : handleLoginRedirect())}
            sx={buttonBaseStyle}
          >
            <Box 
              className="button-glow" 
              sx={{ 
                position: 'absolute', 
                width: '150%', 
                height: '150%', 
                background: darkMode
                  ? 'radial-gradient(circle, rgba(87, 28, 224, 0.18) 0%, rgba(0, 0, 0, 0) 70%)'
                  : 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 70%)', 
                top: '-25%', 
                left: '-25%',
                opacity: 0,
                transition: 'opacity 0.3s ease, transform 0.4s ease',
                pointerEvents: 'none',
                filter: darkMode ? 'blur(8px)' : 'blur(12px)',
              }} 
            />
            <Typography
              variant="h3"
              className="button-icon"
              sx={{
                fontSize: '1.5rem',
                mb: '8px',
                color: darkMode ? '#FFFFFF' : '#000000',
                transition: 'transform 0.3s ease',
              }}
            >
              👤
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' },
                fontWeight: '600',
                textAlign: 'center',
                color: darkMode ? '#FFFFFF' : '#000000',
              }}
            >
              Profile
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666',
                mt: '4px',
                textAlign: 'center',
              }}
            >
              Organize everything here
              <span style={{ color: '#F26655' }}>.</span>
            </Typography>
          </ButtonBase>
        </Box>

        {/* Search bar */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask anything about courses..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            sx={{
              bgcolor: darkMode ? '#0C0F33' : '#f9f9f9',
              borderRadius: '25px',
              width: { xs: '90%', md: '60%' },
              boxShadow: darkMode
                ? '0px 2px 8px rgba(255, 255, 255, 0.1)'
                : '0px 2px 8px rgba(0, 0, 0, 0.1)',
              '& .MuiOutlinedInput-root': {
                borderRadius: '25px',
                padding: '0 20px',
                height: '50px',
                transition: 'all 0.3s ease-in-out',
                '& fieldset': {
                  borderColor: darkMode ? '#555555' : 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? '#777777' : '#bbb',
                },
                '&.Mui-focused fieldset': {
                  borderColor: darkMode ? '#bb86fc' : '#000000',
                  boxShadow: darkMode
                    ? '0px 4px 15px rgba(187, 134, 252, 0.3)'
                    : '0px 4px 15px rgba(0, 0, 0, 0.1)',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: darkMode ? '#bbbbbb' : '#888888',
                      fontSize: '24px',
                    }}
                  />
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
              backgroundColor: darkMode ? '#bb86fc' : '#000000',
              borderRadius: '25px',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 30px',
              transition: 'background-color 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: darkMode ? '#9b6efc' : '#571CE0',
              },
              '&:active': {
                backgroundColor: darkMode ? '#9b6efc' : '#571CE0',
              },
              fontSize: { xs: '0.875rem', md: '1rem' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
          </Button>
        </Box>

        {/* AI answer section */}
        {answer && (
          <Paper
            elevation={3}
            sx={{
              mt: 4,
              p: 3,
              bgcolor: darkMode ? 'rgba(12, 15, 51, 0.8)' : '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '800px',
              boxShadow: darkMode
                ? '0px 8px 20px rgba(0, 0, 0, 0.2)'
                : '0px 8px 20px rgba(0, 0, 0, 0.08)',
              border: darkMode 
                ? '1px solid rgba(87, 28, 224, 0.2)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
              color: darkMode ? '#ffffff' : '#333333',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top bar with Google-like styling */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2,
                mb: 2,
                borderBottom: darkMode 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#4285F4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                  }}
                >
                  C
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: darkMode ? '#ffffff' : '#202124',
                  }}
                >
                  CourseMe Results
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.8rem',
                }}
              >
                Results generated in {(Math.random() * 0.5 + 0.2).toFixed(2)}s
              </Typography>
            </Box>

            {/* Chips & scale meters at the top (only show if we have department/course) */}
            {(department || courseNumber || difficulty !== null || sentiment !== null) && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  mb: 2,
                  p: 1,
                  backgroundColor: darkMode 
                    ? 'rgba(255, 255, 255, 0.03)' 
                    : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '8px',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  {department && (
                    <Chip
                      label={`Department: ${department}`}
                      color={darkMode ? 'default' : 'primary'}
                      sx={{
                        bgcolor: darkMode ? 'rgba(66, 133, 244, 0.2)' : '#E8F0FE',
                        color: darkMode ? '#90CAF9' : '#1967D2',
                        fontWeight: '500',
                        border: darkMode 
                          ? '1px solid rgba(66, 133, 244, 0.4)' 
                          : '1px solid #DADCE0',
                      }}
                    />
                  )}
                  {courseNumber && (
                    <Chip
                      label={`Course: ${courseNumber}`}
                      color={darkMode ? 'default' : 'secondary'}
                      sx={{
                        bgcolor: darkMode ? 'rgba(0, 105, 62, 0.2)' : '#E6F4EA',
                        color: darkMode ? '#81C784' : '#137333',
                        fontWeight: '500',
                        border: darkMode 
                          ? '1px solid rgba(0, 105, 62, 0.4)' 
                          : '1px solid #DADCE0',
                      }}
                    />
                  )}
                  {difficulty !== null && (
                    <ScaleMeter
                      value={difficulty}
                      title="Layup Meter"
                      getLevelFunc={getDifficultyLevel}
                    />
                  )}
                  {sentiment !== null && (
                    <ScaleMeter
                      value={sentiment}
                      title="Quality Meter"
                      getLevelFunc={getSentimentLevel}
                    />
                  )}
                </Box>

                {/* Scroll message chip if we have a course docName */}
                {showScrollMessage && documentName && (
                  <Tooltip title="Click or scroll down to see more course details" placement="top">
                    <Fade in={showScrollMessage}>
                      <Box
                        onClick={() =>
                          documentName && navigate(`/departments/${department}/courses/${documentName}`)
                        }
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          ml: 2,
                          bgcolor: darkMode ? 'rgba(66, 66, 66, 0.3)' : 'rgba(240, 248, 255, 0.8)',
                          p: 1,
                          borderRadius: 2,
                          boxShadow: darkMode
                            ? '0 2px 5px rgba(0, 0, 0, 0.2)'
                            : '0 2px 5px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          border: darkMode
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.05)',
                          '&:hover': {
                            bgcolor: darkMode ? 'rgba(85, 85, 85, 0.4)' : 'rgba(230, 243, 255, 0.9)',
                            transform: 'translateY(-2px)',
                            boxShadow: darkMode
                              ? '0 4px 8px rgba(0, 0, 0, 0.25)'
                              : '0 4px 8px rgba(0, 0, 0, 0.15)',
                          },
                          '&:active': {
                            transform: 'translateY(0)',
                            boxShadow: darkMode
                              ? '0 2px 5px rgba(0, 0, 0, 0.2)'
                              : '0 2px 5px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 1,
                            color: darkMode ? '#bb86fc' : '#1976d2',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                          }}
                        >
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
                              bgcolor: darkMode ? 'rgba(187, 134, 252, 0.2)' : '#E8F0FE',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: darkMode ? '#bb86fc' : '#4285F4',
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Fade>
                  </Tooltip>
                )}
              </Box>
            )}

            {/* Render the chatbot's answer with markdown */}
            <Box 
              sx={{ 
                textAlign: 'left', 
                mb: 2,
                px: 1,
                pb: 2, 
                borderBottom: darkMode 
                  ? '1px solid rgba(255, 255, 255, 0.05)' 
                  : '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              {formatAnswer(
                department && courseNumber
                  ? answer.replace(new RegExp(`^${department}\\s*${courseNumber}\\s*`), '')
                  : answer
              )}
            </Box>

            {/* Footer with AI info */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              pt: 1
            }}>
              <Typography
                variant="body2"
                sx={{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.75rem',
                  fontStyle: 'italic'
                }}
              >
                AI-powered by CourseMe
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  sx={{
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    minWidth: 'auto',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                    }
                  }}
                  onClick={() => {
                    setQuestion('');
                    setAnswer('');
                  }}
                >
                  New Search
                </Button>
                
                {documentName && (
                  <Button
                    size="small"
                    sx={{
                      color: darkMode ? '#90CAF9' : '#1967D2', 
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      minWidth: 'auto',
                      borderRadius: '12px',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(66, 133, 244, 0.1)' : 'rgba(66, 133, 244, 0.05)'
                      }
                    }}
                    onClick={() => navigate(`/departments/${department}/courses/${documentName}`)}
                  >
                    View Full Details
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Container>

      {/* Footer Section - Desktop Only */}
      <Box sx={{ mt: 4, textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
        <Typography
          variant="body2"
          sx={{
            color: darkMode ? '#ffffff' : '#333333',
            fontSize: '0.875rem',
            fontFamily: 'SF Pro Display, sans-serif',
            mb: 1,
          }}
        >
          © 2025 CourseMe. All Rights Reserved.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: darkMode ? '#cccccc' : '#666666',
            fontSize: '0.85rem',
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 400,
          }}
        >
          Built with <span>💚</span> in Dartmouth Dorms, just for you.
        </Typography>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LandingPage;
