import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import ParticleTextCarousel from '../components/ParticleTextCarousel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { Lock, OpenInNew, CalendarMonthOutlined, CloseFullscreen, OpenInFull, Close } from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import MobileNavigation from '../Mobileversion/MobileNavigation';
import MobileLandingPage from '../Mobileversion/MobileLandingPage';
import ScheduleVisualization from './timetablepages/ScheduleVisualization';
import Slide from '@mui/material/Slide';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Divider from '@mui/material/Divider';

import { 
  Container, Box, Typography, TextField, Button, 
  InputAdornment, CircularProgress, Paper, Snackbar,
  Alert, Chip, LinearProgress, ButtonBase, Tooltip, Fade, IconButton,
  List, ListItem, ListItemText, ClickAwayListener
} from '@mui/material';

import { recordAnalyticsView, logAnalyticsSession } from '../services/analyticsService';

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

  // Difficulty & Sentiment
  const [difficulty, setDifficulty] = useState(null);
  const [sentiment, setSentiment] = useState(null);

  // State for fade-in transition
  const [fadeIn, setFadeIn] = useState(false);

  // Add state for schedule visualization
  const [miniScheduleOpen, setMiniScheduleOpen] = useState(false);
  const [miniScheduleExpanded, setMiniScheduleExpanded] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState([]);

  // New state for search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [popularSearches, setPopularSearches] = useState([]);
  const searchInputRef = useRef(null);

  const pageRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Track landing page views for analytics
  const [viewStartTime, setViewStartTime] = useState(null);

  useEffect(() => {
    // Set the view start time for session duration tracking
    setViewStartTime(new Date());
    
    // Record that a user is viewing the landing page
    if (currentUser) {
      recordAnalyticsView(
        currentUser.uid, 
        'landing_page', 
        'landing_page_view',
        location.pathname
      );
    }
    
    // When component unmounts, log the session duration
    return () => {
      if (currentUser && viewStartTime) {
        const sessionDuration = new Date() - viewStartTime;
        if (sessionDuration > 1000) { // Only log sessions longer than 1 second
          logAnalyticsSession(
            currentUser.uid,
            'landing_page',
            'landing_page_view',
            sessionDuration
          );
        }
      }
    };
  }, [currentUser, location.pathname]);

  // --------------------------------------------------------------------------------
  // 4) UI constants
  // --------------------------------------------------------------------------------
  const [typingMessages, setTypingMessages] = useState([
    "Unlock Your Academic Edge.",
    "Find Easy Courses in Seconds.",
    "Plan Your Perfect Schedule Today."
  ]);

  // Time-based greeting functionality
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Good morning";
    } else if (hour >= 12 && hour < 18) {
      return "Good afternoon";
    } else if (hour >= 18 && hour < 22) {
      return "Good evening";
    } else {
      return "Good night";
    }
  };

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
              // Fallback to just time-based greeting without name
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
      // Get appropriate time-based greeting
      const greeting = getTimeBasedGreeting();
      
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
        // Regular time-based greeting for returning users
        if (firstName) {
          setTypingMessages([
            `${greeting}, ${firstName}.`,
            ...defaultMessages.slice(1) // Skip the first message for logged-in users
          ]);
        } else {
          // Use generic greeting if no name is available
          setTypingMessages([
            `${greeting}.`,
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
    
    // Don't search if question is empty
    if (!question.trim()) return;
    
    // Save this search to history
    saveSearchToHistory(question);
    
    // Hide suggestions
    setShowSuggestions(false);
    
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
      
      // After successful search, also update recent searches for immediate use
      if (currentUser) {
        const updatedRecentSearches = [
          { id: Date.now().toString(), query: question, timestamp: new Date().toISOString() },
          ...recentSearches
        ].slice(0, 5); // Keep only the 5 most recent
        
        setRecentSearches(updatedRecentSearches);
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

  // Replace the handleOpenMiniSchedule function with this navigate function
  const navigateToTimetableWithVisualization = () => {
    // Navigate to timetable with state parameter to open visualization
    navigate('/timetable', { state: { openVisualization: true } });
  };

  // Fetch popular searches on component mount
  useEffect(() => {
    const fetchPopularSearches = async () => {
      if (!db) return;
      
      try {
        const searchesRef = collection(db, "search_analytics");
        const q = query(searchesRef, orderBy("count", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        
        const searches = [];
        querySnapshot.forEach((doc) => {
          searches.push({
            id: doc.id,
            query: doc.data().query,
            count: doc.data().count
          });
        });
        
        setPopularSearches(searches);
      } catch (error) {
        console.error("Error fetching popular searches:", error);
      }
    };
    
    fetchPopularSearches();
  }, []);
  
  // Fetch user's recent searches if logged in
  useEffect(() => {
    const fetchRecentSearches = async () => {
      if (!currentUser || !db) return;
      
      try {
        const userSearchesRef = collection(db, `users/${currentUser.uid}/searches`);
        const q = query(userSearchesRef, orderBy("timestamp", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        
        const searches = [];
        querySnapshot.forEach((doc) => {
          searches.push({
            id: doc.id,
            query: doc.data().query,
            timestamp: doc.data().timestamp
          });
        });
        
        setRecentSearches(searches);
      } catch (error) {
        console.error("Error fetching recent searches:", error);
      }
    };
    
    if (currentUser) {
      fetchRecentSearches();
    }
  }, [currentUser]);
  
  // Save search to user's history
  const saveSearchToHistory = async (searchQuery) => {
    if (!currentUser || !searchQuery.trim() || !db) return;
    
    try {
      const searchesRef = collection(db, `users/${currentUser.uid}/searches`);
      await setDoc(doc(searchesRef), {
        query: searchQuery,
        timestamp: new Date().toISOString()
      });
      
      // Also update global search analytics
      const analyticsRef = collection(db, "search_analytics");
      const q = query(analyticsRef, where("query", "==", searchQuery));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new entry
        await setDoc(doc(analyticsRef), {
          query: searchQuery,
          count: 1,
          last_used: new Date().toISOString()
        });
      } else {
        // Update existing entry
        const docRef = querySnapshot.docs[0].ref;
        await setDoc(docRef, {
          count: querySnapshot.docs[0].data().count + 1,
          last_used: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };
  
  // Add this function for professor search
  const searchProfessors = async (searchTerm) => {
    try {
      if (!searchTerm || searchTerm.length < 2 || !db) return [];
      
      // Normalize the search term (lowercase, remove accents, etc.)
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();
      const searchTerms = normalizedSearchTerm.split(/\s+/).filter(term => term.length > 1);
      
      // If there are no valid search terms, return empty array
      if (searchTerms.length === 0) return [];
      
      // Query all professors - unfortunately we need to do client-side filtering
      // because Firestore doesn't support complex text searches
      const professorsRef = collection(db, "professor");
      const professorsSnapshot = await getDocs(professorsRef);
      
      // Array to store matched professors with their relevance score
      const matchedProfessors = [];
      
      professorsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.name) return;
        
        const professorName = data.name.toLowerCase();
        let matchScore = 0;
        let exactMatchFound = false;
        
        // Check for exact match of the full name
        if (professorName === normalizedSearchTerm) {
          matchScore += 100; // Very high score for exact match
          exactMatchFound = true;
        }
        
        // Score each search term
        for (const term of searchTerms) {
          // Strong match: Full term appears in professor name
          if (professorName.includes(term)) {
            matchScore += 20;
            
            // Bonus points if it matches the start of the name or a name component
            const nameComponents = professorName.split(' ');
            for (const component of nameComponents) {
              if (component.startsWith(term)) matchScore += 10;
            }
          }
          
          // Partial match: Check if term is part of professor name
          if (term.length >= 3) {
            const nameComponents = professorName.split(' ');
            for (const component of nameComponents) {
              if (component.includes(term)) matchScore += 5;
            }
          }
        }
        
        // Only add if there's some match
        if (matchScore > 0 || exactMatchFound) {
          matchedProfessors.push({
            id: doc.id,
            name: data.name,
            title: data.contact_info?.title || 'Professor',
            departments: data.departments ? Object.keys(data.departments) : [],
            matchScore: matchScore
          });
        }
      });
      
      // Sort by match score descending and take top 5
      return matchedProfessors
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
    } catch (error) {
      console.error("Error searching professors:", error);
      return [];
    }
  };
  
  // Function to generate suggestions as user types
  const handleSearchInputChange = async (e) => {
    const value = e.target.value;
    setQuestion(value);
    
    if (!value.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsTyping(true);
    
    // Combine suggestions from various sources
    let suggestions = [];
    
    // Add recent searches that match
    if (recentSearches.length > 0) {
      const matchingRecentSearches = recentSearches
        .filter(item => item.query.toLowerCase().includes(value.toLowerCase()))
        .map(item => ({
          text: item.query,
          type: 'recent',
          icon: '🕒'
        }));
      
      suggestions = [...suggestions, ...matchingRecentSearches];
    }
    
    // Add popular searches that match
    if (popularSearches.length > 0) {
      const matchingPopularSearches = popularSearches
        .filter(item => item.query.toLowerCase().includes(value.toLowerCase()))
        .map(item => ({
          text: item.query,
          type: 'popular',
          icon: '🔥'
        }));
      
      suggestions = [...suggestions, ...matchingPopularSearches];
    }
    
    // Search for professors
    try {
      if (value.length >= 2) {
        const professorResults = await searchProfessors(value);
        
        if (professorResults.length > 0) {
          const professorSuggestions = professorResults.map(prof => ({
            text: `${prof.name}${prof.departments.length > 0 ? ` (${prof.departments[0]})` : ''}`,
            type: 'professor',
            icon: '👨‍🏫',
            professorId: prof.id,
            matchScore: prof.matchScore
          }));
          
          suggestions = [...suggestions, ...professorSuggestions];
        }
      }
    } catch (error) {
      console.error("Error fetching professor suggestions:", error);
    }
    
    // Add suggestions for departments and course numbers
    try {
      // Try to match department + course number pattern (e.g., "COSC 10")
      const deptMatch = value.match(/^([A-Za-z]+)\s*(\d*)/);
      
      if (deptMatch && deptMatch[1]) {
        const dept = deptMatch[1].toUpperCase();
        const courseNum = deptMatch[2] || '';
        
        const coursesRef = collection(db, "courses");
        let q;
        
        if (courseNum) {
          // Look for specific course number
          q = query(
            coursesRef,
            where("department", "==", dept),
            where("course_number", ">=", courseNum),
            where("course_number", "<=", courseNum + "\uf8ff"),
            limit(5)
          );
        } else {
          // Just look for department
          q = query(
            coursesRef,
            where("department", "==", dept),
            limit(5)
          );
        }
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const courseSuggestions = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            courseSuggestions.push({
              text: `${data.department} ${data.course_number} - ${data.course_title}`,
              type: 'course',
              icon: '📚',
              docId: doc.id
            });
          });
          
          suggestions = [...suggestions, ...courseSuggestions];
        }
      }
    } catch (error) {
      console.error("Error fetching course suggestions:", error);
    }
    
    // Add some common question templates if nothing else matches
    if (suggestions.length === 0) {
      const questionTemplates = [
        { text: `What are the easiest ${value} courses?`, type: 'question', icon: '❓' },
        { text: `Who is the best professor for ${value}?`, type: 'question', icon: '👨‍🏫' },
        { text: `How difficult is ${value}?`, type: 'question', icon: '📊' }
      ];
      
      suggestions = [...suggestions, ...questionTemplates];
    }
    
    // Filter out duplicates and limit to 8 suggestions
    const uniqueSuggestions = suggestions.filter((item, index, self) => 
      index === self.findIndex(t => t.text === item.text)
    ).slice(0, 8);
    
    setSearchSuggestions(uniqueSuggestions);
    setShowSuggestions(uniqueSuggestions.length > 0);
    setIsTyping(false);
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'course' && suggestion.docId) {
      // Get department and course number from suggestion
      const parts = suggestion.text.split(' - ')[0].trim().split(' ');
      const dept = parts[0];
      const courseNum = parts[1];
      
      // Navigate directly to course page
      navigate(`/departments/${dept}/courses/${suggestion.docId}`);
    } else if (suggestion.type === 'professor' && suggestion.professorId) {
      // Navigate directly to professor page
      navigate(`/professors/${suggestion.professorId}`);
    } else {
      // Set the search query and perform search
      setQuestion(suggestion.text);
      handleSearch(new Event('submit'));
    }
    
    // Save to search history
    saveSearchToHistory(suggestion.text);
    
    // Hide suggestions
    setShowSuggestions(false);
  };

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
          searchSuggestions={searchSuggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          handleSearchInputChange={handleSearchInputChange}
          handleSuggestionClick={handleSuggestionClick}
          isTyping={isTyping}
          popularSearches={popularSearches}
          searchProfessors={searchProfessors}
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
        {/* Typing effect for the main heading - Replace with our custom component */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '2rem', md: '3rem' },
            color: '#000',
            mb: '5px',
            letterSpacing: '0.04rem',
            textAlign: 'center',
            height: '90px', // Reduced height for the container
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ParticleTextCarousel
            messages={typingMessages}
            typingDelay={3000}
            darkMode={darkMode}
            currentUser={currentUser}
            isFirstLogin={localStorage.getItem(`hasLoggedIn_${currentUser?.uid}`) === 'true' && 
                          !localStorage.getItem(`hasSeenWelcome_${currentUser?.uid}`)}
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
            marginTop: '0px',
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

          {/* Schedule Visualizer */}
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
              New
            </Box>

            <ButtonBase
              onClick={() => (currentUser ? navigateToTimetableWithVisualization() : handleLoginRedirect())}
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
                📅
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
                Schedule Visualizer
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
                View your weekly schedule<span style={{ color: '#F26655' }}>.</span>
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
            position: 'relative', // Add this for positioning suggestions dropdown
          }}
        >
          <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
            <Box sx={{ width: { xs: '90%', md: '60%' }, position: 'relative' }}>
              <TextField
                ref={searchInputRef}
                fullWidth
                variant="outlined"
                placeholder="Ask anything about courses..."
                value={question}
                onChange={handleSearchInputChange}
                autoComplete="off"
                sx={{
                  bgcolor: darkMode ? '#0C0F33' : '#f9f9f9',
                  borderRadius: '25px',
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
                  endAdornment: question ? (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setQuestion('');
                          setSearchSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        sx={{ color: darkMode ? '#bbbbbb' : '#888888' }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              
              {/* Search suggestions dropdown */}
              {showSuggestions && (
                <Paper
                  elevation={3}
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    maxHeight: '350px',
                    overflowY: 'auto',
                    mt: '4px',
                    borderRadius: '12px',
                    zIndex: 10,
                    boxShadow: darkMode
                      ? '0px 8px 16px rgba(0, 0, 0, 0.4)'
                      : '0px 8px 16px rgba(0, 0, 0, 0.1)',
                    bgcolor: darkMode ? '#0C0F33' : '#ffffff',
                    border: darkMode
                      ? '1px solid rgba(87, 28, 224, 0.2)'
                      : '1px solid rgba(0, 0, 0, 0.05)',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: darkMode ? '#555555' : '#dddddd',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  <List dense disablePadding>
                    {isTyping ? (
                      <ListItem sx={{ justifyContent: 'center' }}>
                        <CircularProgress size={20} sx={{ color: darkMode ? '#bb86fc' : '#571CE0' }} />
                      </ListItem>
                    ) : (
                      searchSuggestions.map((suggestion, index) => (
                        <ListItem
                          button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          sx={{
                            py: 1.5,
                            borderBottom: index < searchSuggestions.length - 1
                              ? darkMode
                                ? '1px solid rgba(255, 255, 255, 0.05)'
                                : '1px solid rgba(0, 0, 0, 0.05)'
                              : 'none',
                            '&:hover': {
                              bgcolor: darkMode ? 'rgba(87, 28, 224, 0.15)' : 'rgba(0, 0, 0, 0.03)',
                            },
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            width: '100%', 
                            color: darkMode ? '#ffffff' : '#333333' 
                          }}>
                            <Typography sx={{ 
                              mr: 1.5, 
                              fontSize: '1.2rem',
                              width: '24px',
                              textAlign: 'center'
                            }}>
                              {suggestion.icon}
                            </Typography>
                            <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: suggestion.type === 'recent' ? 400 : 500,
                                  fontSize: '0.95rem',
                                  color: darkMode ? '#ffffff' : '#333333'
                                }}
                              >
                                {suggestion.text}
                              </Typography>
                              {suggestion.type === 'course' && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                    display: 'block',
                                    mt: -0.5
                                  }}
                                >
                                  Click to view course details
                                </Typography>
                              )}
                              {suggestion.type === 'professor' && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                    display: 'block',
                                    mt: -0.5
                                  }}
                                >
                                  View professor profile
                                </Typography>
                              )}
                            </Box>
                            {suggestion.type === 'professor' && (
                              <Box 
                                sx={{ 
                                  ml: 'auto', 
                                  bgcolor: darkMode ? 'rgba(87, 28, 224, 0.2)' : 'rgba(87, 28, 224, 0.1)',
                                  borderRadius: '6px',
                                  px: 1,
                                  py: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: darkMode ? '#bb86fc' : '#571CE0',
                                    fontWeight: 'medium'
                                  }}
                                >
                                  Professor
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Paper>
              )}
            </Box>
          </ClickAwayListener>
          
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

        {/* Display popular searches if no recent search and no answer showing */}
        {!answer && popularSearches.length > 0 && question === '' && (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              mt: 3,
              mb: 2
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                mb: 1,
                fontSize: '0.9rem'
              }}
            >
              Popular searches:
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1, 
                justifyContent: 'center',
                maxWidth: '600px'
              }}
            >
              {popularSearches.map((search, index) => (
                <Chip
                  key={index}
                  label={search.query}
                  onClick={() => {
                    setQuestion(search.query);
                    handleSearch(new Event('submit'));
                  }}
                  icon={<Typography sx={{ fontSize: '1rem', ml: 1 }}>🔥</Typography>}
                  sx={{
                    bgcolor: darkMode ? 'rgba(87, 28, 224, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                    color: darkMode ? '#ffffff' : '#333333',
                    fontSize: '0.85rem',
                    '&:hover': {
                      bgcolor: darkMode ? 'rgba(87, 28, 224, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

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
                          : '1px solid rgba(0, 0, 0, 0.05)',
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
                          : '1px solid rgba(0, 0, 0, 0.05)',
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
          &copy; 2025 CourseMe. All Rights Reserved.
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
          Built with <span>&#10084;</span> in Dartmouth Dorms, just for you.
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
