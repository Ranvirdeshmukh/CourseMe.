import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Typography, Box, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, List, ListItem, ListItemText, Button, ButtonGroup, IconButton, Tooltip,
  MenuItem, Select, FormControl, InputLabel, CircularProgress, Card, Badge, Tabs, Tab, LinearProgress,
  TextField, Autocomplete, Link as MuiLink
} from '@mui/material';
import { useParams, Link } from 'react-router-dom';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, PushPin, Description, Grade, Input } from '@mui/icons-material';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext.js';
import { db } from '../../firebase';
import AddReviewForm from './AddReviewForm';
import AddReplyForm from './AddReplyForm';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { styled } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';
import InteractiveGradeScale from './InteractiveGradeScale';
import GradeChart from './CustomGradeChart';
import VerifiedIcon from '@mui/icons-material/Verified';
import CanvasGradeTable from './CanvasGradeTable';
import CourseInputDataForm from './CourseInputDataForm';
import { PushPinOutlined } from '@mui/icons-material';
import { Sparkles } from 'lucide-react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import ScienceIcon from '@mui/icons-material/Science';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import CourseAnalytics from './CourseAnalytics.jsx';
import CourseVoting from './CourseVoting.jsx';
import generateORCLink from './ORCLinkGenerator';


const CourseReviewsPage = ({ darkMode }) => {
  const [isTaughtCurrentTerm, setIsTaughtCurrentTerm] = useState(false);
  const [isTaughtSpringTerm, setIsTaughtSpringTerm] = useState(false);
  const [isTaughtSummerTerm, setIsTaughtSummerTerm] = useState(false);
  const [isTaughtFallTerm, setIsTaughtFallTerm] = useState(false);
  const { department, courseId } = useParams();
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState(null);
  const [courseDescription, setCourseDescription] = useState('');
  const [pinned, setPinned] = useState(false);
  const [quality, setQuality] = useState(0); // Add this line
  const [showAllProfessors, setShowAllProfessors] = useState(false);
  const [currentInstructors, setCurrentInstructors] = useState([]);
  const [winterInstructors, setWinterInstructors] = useState([]);
  const [springInstructors, setSpringInstructors] = useState([]);
  const [summerInstructors, setSummerInstructors] = useState([]);
  const [fallInstructors, setFallInstructors] = useState([]);
  const [bothTermsInstructors, setBothTermsInstructors] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [reviewInstructors, setReviewInstructors] = useState([]);
  const [allProfessors, setAllProfessors] = useState([]);
  const [professorInput, setProfessorInput] = useState('');
  const [professorTerms, setProfessorTerms] = useState({});
  const gradeToNum = {
    'A': 11, 'A-': 10, 'A/A-': 10.5,
    'B+': 9, 'A-/B+': 9.5, 'B': 8, 'B+/B': 8.5, 'B-': 7, 'B/B-': 7.5,
    'C+': 6, 'B-/C+': 6.5, 'C': 5, 'C/C+': 5.5, 'C-': 4, 'C/C-': 4.5,
    'D+': 3, 'C-/D+': 3.5, 'D': 2, 'D+/D': 2.5, 'D-': 1, 'D/D-': 1.5,
    'F': 0
  };
  const numToGrade = Object.fromEntries(Object.entries(gradeToNum).map(([k, v]) => [v, k]));


  // Define color variables based on darkMode
  const mainBgColor = darkMode 
    ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)' 
    : '#F9F9F9';
  const paperBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
  const tableHeaderBgColor = darkMode ? '#333333' : '#f0f0f0';
  const tableRowEvenBgColor = darkMode ? '#1C1F43' : '#F8F8F8';
  const tableRowOddBgColor = darkMode ? '#24273c' : '#FFFFFF';
  const textColor = darkMode ? '#FFFFFF' : '#333333';
  const headerTextColor = darkMode ? '#FFFFFF' : '#571CE0';
  const searchBgColor = darkMode ? '#0C0F33' : '#FFFFFF';
  const tooltipBgColor = darkMode ? '#333333' : '#f5f5f9';
  const tooltipTextColor = darkMode ? '#FFFFFF' : '#000000';


  const [deptAndNumber, ...rest] = courseId.split('__');
  const deptCode = deptAndNumber.match(/[A-Z]+/)[0];
  var courseNumber = deptAndNumber.match(/\d+/)[0];
  const numberRegex = /[A-Z]+_[A-Z]+(\d+(?:_\d+)?)/;
  const match = courseId.match(numberRegex);
  const [descriptionError, setDescriptionError] = useState(null);
  const reviewsPerPage = 5;
  const [isBetaUser, setIsBetaUser] = useState(false);

  useEffect(() => {
    const checkBetaStatus = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsBetaUser(userData.beta === true);
        }
      }
    };

    checkBetaStatus();
  }, [currentUser]);

  const StyledTab = styled(Tab)(({ theme }) => ({
    minHeight: 'auto',
    padding: '10px 16px',
    marginRight: '8px',
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
    fontSize: '0.85rem',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    textTransform: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
      color: theme.palette.mode === 'dark' ? '#0A84FF' : '#0071E3',
      fontWeight: 600,
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 113, 227, 0.05)',
    },
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      transform: 'translateY(-1px)',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.1rem',
      marginBottom: '2px',
      transition: 'transform 0.2s ease',
    },
    '&:hover .MuiSvgIcon-root': {
      transform: 'scale(1.1)',
    },
    '&.Mui-selected .MuiSvgIcon-root': {
      color: theme.palette.mode === 'dark' ? '#0A84FF' : '#0071E3',
    },
  }));

  const [gradeData, setGradeData] = useState([]);
  const [newGradeData, setNewGradeData] = useState({
    Term: '',
    Professors: [],
    Grade: ''
  });

  const handleGradeChange = (newGrade) => {
    setNewGradeData(prevData => ({
      ...prevData,
      Grade: newGrade
    }));
  };


  const handleFinalGradeSelect = (finalGrade) => {
    console.log('Final grade selected:', finalGrade);
    setNewGradeData(prevData => ({
      ...prevData,
      Grade: finalGrade
    }));
  };
  

  const normalizeName = (name) => {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
  };

  const compareNames = (name1, name2) => {
    if (!name1 || !name2) return false;
    
    const norm1 = normalizeName(name1);
    const norm2 = normalizeName(name2);
  
    // Check for exact match
    if (norm1 === norm2) return true;
  
    // Check if one name is a subset of the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
    // Split names into parts and check for partial matches
    const parts1 = norm1.split(' ');
    const parts2 = norm2.split(' ');
  
    // Check if all parts of the shorter name are in the longer name
    const [shorter, longer] = parts1.length < parts2.length ? [parts1, parts2] : [parts2, parts1];
    
    return shorter.every(part => longer.includes(part));
  };

  const handleProfessorChange = (event, newValue) => {
    setNewGradeData(prevData => ({
      ...prevData,
      Professors: newValue
    }));
  };
  
  const handleProfessorFilterChange = (event) => {
    setSelectedProfessor(event.target.value);
    setCurrentPage(1); // Reset to the first page
  };
  
  

  const CourseMetricsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 9l-5 5-2-2-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Custom styled Tabs component with Apple design language
  const StyledTabs = styled(Tabs)(({ theme }) => ({
    minHeight: 'auto',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.3)' : 'rgba(240, 240, 247, 0.6)',
    borderRadius: '10px',
    padding: '4px',
    '& .MuiTabs-flexContainer': {
      gap: '2px',
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    boxShadow: theme.palette.mode === 'dark' 
      ? 'inset 0 1px 1px rgba(0, 0, 0, 0.2)' 
      : 'inset 0 0 1px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  }));

  const CourseDescriptionSection = () => {
    const hasValidMetrics = course?.metrics && (
      course.metrics.difficulty_score > 0 ||
      course.metrics.quality_score > 0 ||
      course.metrics.sentiment_score > 0 ||
      course.metrics.workload_score > 0
    );
    
    // Generate ORC link for the current course
    const orcLink = generateORCLink(courseId);
    
    return (
      <Box 
        sx={{ 
          padding: { xs: '12px', sm: '16px', md: '20px' },
          paddingTop: { xs: '8px', sm: '12px', md: '16px' },
          transition: 'all 0.3s ease',
        }}
      >
        {/* College Description Section - Apple Style */}
                  <Box 
            sx={{
              mb: 3,
              position: 'relative',
            }}
          >
          {/* Header with ORC link */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '-12px',
                  width: '4px',
                  height: '24px',
                  borderRadius: '2px',
                  backgroundColor: darkMode ? '#0A84FF' : '#0071E3',
                  boxShadow: darkMode ? '0 0 8px rgba(10, 132, 255, 0.5)' : 'none',
                }
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: darkMode ? '#FFFFFF' : headerTextColor,
                  fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' },
                  letterSpacing: '-0.02em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                Course Description
              </Typography>
            </Box>
            
            {orcLink && (
              <Button
                startIcon={<Description 
                  sx={{ 
                    fontSize: '1rem',
                    transition: 'transform 0.2s ease',
                  }} 
                />}
                component="a"
                href={orcLink}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: darkMode ? '#0A84FF' : '#0071E3',
                  backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 113, 227, 0.05)',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  padding: '8px 16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 113, 227, 0.1)',
                    transform: 'translateY(-1px)',
                    '& .MuiSvgIcon-root': {
                      transform: 'translateY(-1px)',
                    }
                  }
                }}
              >
                View in ORC Catalog
              </Button>
            )}
          </Box>
  
          {/* Course description content */}
          <Box
            sx={{
              position: 'relative',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '16px',
              padding: { xs: '20px', sm: '24px' },
              transition: 'all 0.3s ease',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0, 0, 0, 0.03)',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                boxShadow: darkMode ? '0 2px 12px rgba(0, 0, 0, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.06)',
              }
            }}
          >
            <Typography
              variant="body1"
              sx={{ 
                                 fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' }, 
                 color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                 textAlign: 'left', 
                 lineHeight: 1.6,
                 letterSpacing: '-0.011em',
                 fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                 WebkitFontSmoothing: 'antialiased',
                 fontWeight: 400,
              }}
              dangerouslySetInnerHTML={{ __html: courseDescription }}
            />
          </Box>
        </Box>
        
        {/* AI Summary Section - Apple Style */}
                  <Box 
           sx={{ 
             mt: 4,
             position: 'relative',
           }}
         >
          {/* AI Summary Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2.5,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-12px',
                width: '4px',
                height: '24px',
                borderRadius: '2px',
                background: darkMode 
                  ? 'linear-gradient(to bottom, #34C759, #30D158)' 
                  : 'linear-gradient(to bottom, #00693E, #00875A)',
                boxShadow: darkMode ? '0 0 8px rgba(52, 199, 89, 0.5)' : 'none',
              }
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: darkMode ? '#FFFFFF' : headerTextColor,
                fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' },
                letterSpacing: '-0.02em',
                fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                mr: 1.5,
              }}
            >
              AI Summary of Reviews
            </Typography>
            
            <Tooltip
              title="AI-generated summary based on student reviews"
              arrow
              placement="top"
              sx={{
                '& .MuiTooltip-tooltip': {
                  backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  letterSpacing: '-0.01em',
                },
                '& .MuiTooltip-arrow': {
                  color: darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)',
                }
              }}
            >
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'help' 
                }}
              >
                <AutoAwesomeIcon 
                  sx={{ 
                    fontSize: '1.1rem',
                    color: darkMode ? '#34C759' : '#00693E',
                    opacity: 0.9,
                    transform: 'rotate(10deg)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      opacity: 1,
                      transform: 'rotate(25deg) scale(1.1)',
                    }
                  }} 
                />
              </Box>
            </Tooltip>
          </Box>
  
          {/* AI Summary Content */}
          <Box
            sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: darkMode 
                ? '0 4px 16px rgba(0, 0, 0, 0.15)' 
                : '0 4px 24px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.3s ease',
              border: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.08)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
              backgroundColor: darkMode 
                ? 'rgba(30, 35, 61, 0.5)' 
                : 'rgba(248, 249, 251, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: darkMode 
                  ? '0 8px 24px rgba(0, 0, 0, 0.2)' 
                  : '0 8px 32px rgba(0, 0, 0, 0.08)',
              }
            }}
          >
            {course?.summary ? (
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' },
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                  textAlign: 'left',
                  lineHeight: 1.6,
                  padding: { xs: '20px', sm: '24px' },
                  letterSpacing: '-0.011em',
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                  WebkitFontSmoothing: 'antialiased',
                  position: 'relative'
                }}
              >
                {course.summary}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: { xs: '32px 20px', sm: '40px 24px' },
                  minHeight: '150px',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                  maxWidth: '400px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                  letterSpacing: '-0.011em',
                  }}
                >
                  Not enough data to generate an AI summary. This will be available once more students review the course.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };
  

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // If the "Add Review" tab is selected, scroll to the review form
    if (newValue === 3) {
      setTimeout(() => {
        const reviewSection = document.getElementById('add-review-section');
        if (reviewSection) {
          reviewSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        // Description tab content
        return <CourseDescriptionSection darkMode={darkMode}  />;
      case 1:
        // Grades Distribution tab content
        return (
          <Box sx={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Grades Distribution
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                fontStyle: 'italic',
                color: 'text.secondary',
                mt: 1,
                display: 'block',
              }}
            >
              *Note: Sections with different medians may be averaged for the term.
            </Typography>
            {gradeData.length > 0 ? (
              <>
                {renderGradeChart()}
                <CanvasGradeTable
                  gradeData={gradeData.sort((a, b) => {
                    darkMode={darkMode} 
                    const aYear = parseInt(a.Term.slice(0, 2));
                    const bYear = parseInt(b.Term.slice(0, 2));
                    if (aYear !== bYear) return bYear - aYear;
                    const termOrder = { F: 0, X: 1, S: 2, W: 3 };
                    return termOrder[a.Term.slice(2)] - termOrder[b.Term.slice(2)];
                  })}
                />
              </>
            ) : (
              <Typography>
                No grade distribution information available. Add medians from previous classes to improve our offerings.
              </Typography>
            )}
            <Box sx={{ marginTop: 4 }}>
              <Typography variant="h6" gutterBottom>
                Add New Grade Data
              </Typography>
              <TextField
                name="Term"
                label="Term"
                value={newGradeData.Term}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase(); // Convert input to uppercase
  
                  // Allow only two digits (00-24) followed by F, W, S, or X
                  const regex = /^(?:2[0-4]|1\d|0?\d)([FWSX])?$/;
  
                  if (regex.test(value) || value === '') {
                    setNewGradeData((prev) => ({ ...prev, Term: value }));
                  }
                }}
                fullWidth
                margin="normal"
              />
              <Autocomplete
                multiple
                id="professors-input"
                options={allProfessors}
                value={newGradeData.Professors}
                onChange={(event, newValue) => setNewGradeData((prev) => ({ ...prev, Professors: newValue }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Professors"
                    placeholder="Select or enter professors"
                    fullWidth
                    margin="normal"
                  />
                )}
                freeSolo
                sx={{ marginTop: 2, marginBottom: 2 }}
              />
              <InteractiveGradeScale value={newGradeData.Grade} onChange={handleGradeChange} darkMode={darkMode} />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddNewGradeData}
                sx={{ marginTop: 2 }}
              >
                Add Grade Data
              </Button>
            </Box>
          </Box>
        );
      case 4:
        // Input Data tab content (Beta tab)
        return (
          <Box sx={{ padding: '20px'  }}>
            <Typography variant="h6" gutterBottom>
              Input Course Data
            </Typography>
            <CourseInputDataForm courseId={courseId} allProfessors={allProfessors} />
          </Box>
        );
      
      case 3:
        // Add Review tab - just return null as we're scrolling to the form
        return null;
        case 2:
  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h6" gutterBottom>
        Course Metrics
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <CourseVoting 
          course={course}
          courseId={courseId}
          currentUser={currentUser}
          darkMode={darkMode}
        />
        <CourseAnalytics metrics={course?.metrics}
        darkMode={darkMode} />
      </Box>
    </Box>
  );
      default:
        return null;
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  

  useEffect(() => {
    const fetchAllProfessors = async () => {
      try {
        const courseDocRef = doc(db, 'courses', courseId);
        const courseDocSnap = await getDoc(courseDocRef);
        
        if (courseDocSnap.exists()) {
          const courseData = courseDocSnap.data();
          if (courseData.professors) {
            setAllProfessors(courseData.professors);
          }
        }
      } catch (error) {
        console.error('Error fetching all professors:', error);
      }
    };

    fetchAllProfessors();
  }, [courseId]);


  const fetchReviews = useCallback(async () => {
    setLoading(true);
    console.log('Fetching reviews...');
    const fetchDocument = async (path) => {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    };
  
    try {
      let data = null;
      const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
      const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
  
      if (transformedCourseId) {
        data = await fetchDocument(`reviews/${transformedCourseId}`);
      }
  
      if (!data) {
        const sanitizedCourseId = courseId.split('_')[1];
        data = await fetchDocument(`reviews/${sanitizedCourseId}`);
      }
  
      if (data) {
        const reviewsArray = [];
        const professorsSet = new Set();

        Object.entries(data).forEach(([instructor, reviewList]) => {
          professorsSet.add(instructor);

          if (Array.isArray(reviewList)) {
            reviewList.forEach((review, index) => {
              // Match terms using the updated regex pattern
              const termMatch = review.match(/^(0[1-9]|1[0-9]|2[0-4]|[1-9])[WSXF]/);
              const termCode = termMatch ? termMatch[0] : null;
          
              // Use try-catch to safely call getTermValue
              let termValue = 0; // Default value
              if (termCode) {
                try {
                  termValue = getTermValue(termCode); // Retrieve the term value
                } catch (error) {
                  console.error("Error retrieving term value:", error);
                }
              }
          
              reviewsArray.push({
                instructor,
                review,
                reviewIndex: index,
                courseId,
                termValue,
              });
            });
          }
          
        });
  
        // Sort by termValue in descending order (latest first)
        reviewsArray.sort((a, b) => b.termValue - a.termValue);
  
        // Optimize review ordering to prioritize professors who taught most recently
        const optimizeReviewDisplay = (reviews) => {
          // Step 1: Group reviews by professor
          const professorReviewMap = {};
          reviews.forEach(review => {
            if (!professorReviewMap[review.instructor]) {
              professorReviewMap[review.instructor] = [];
            }
            professorReviewMap[review.instructor].push(review);
          });
        
          // Step 2: Find latest term per professor
          const professorLatestTerm = {};
          Object.keys(professorReviewMap).forEach(professor => {
            const professorReviews = professorReviewMap[professor];
            // Find the review with the highest termValue
            const latestReview = professorReviews.reduce((latest, current) => 
              (current.termValue > latest.termValue) ? current : latest, 
              professorReviews[0]);
            professorLatestTerm[professor] = latestReview.termValue;
          });
        
          // Step 3: Sort professors by latest term (descending)
          const sortedProfessors = Object.keys(professorLatestTerm).sort((a, b) => 
            professorLatestTerm[b] - professorLatestTerm[a]);
        
          // Step 4: Create new ordered array of reviews
          const optimizedReviews = [];
          sortedProfessors.forEach(professor => {
            // For each professor, add their reviews (already sorted by term)
            optimizedReviews.push(...professorReviewMap[professor].sort(
              (a, b) => b.termValue - a.termValue
            ));
          });
        
          return optimizedReviews;
        };
        
        // Apply the optimization
        const optimizedReviewsArray = optimizeReviewDisplay(reviewsArray);
  
        // Use the optimized array instead of the original one
        setReviews(optimizedReviewsArray);
        setAllProfessors(Array.from(professorsSet));
        
        // Extract and set professor terms
        const extractedTerms = extractProfessorTerms(reviewsArray);
        setProfessorTerms(extractedTerms);
      } else {
        setError('No reviews found for this course.');
        setAllProfessors([]);
        setProfessorTerms({});
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to fetch reviews.');
      setAllProfessors([]);
      setProfessorTerms({});
    } finally {
      setLoading(false);
      console.log('Finished fetching reviews');
    }
  }, [courseId]);

  const fetchGradeData = useCallback(async () => {
    try {
      const courseDocRef = doc(db, 'courses', courseId);
      const courseDocSnap = await getDoc(courseDocRef);
      
      if (courseDocSnap.exists()) {
        const courseData = courseDocSnap.data();
        if (courseData.medians && Array.isArray(courseData.medians)) {
          const updatedMedians = courseData.medians.map(median => ({
            ...median,
            verified: median.verified !== undefined ? median.verified : true,
            submissions: median.submissions || []
          }));
          setGradeData(updatedMedians);

          // Update the document if any changes were made
          if (JSON.stringify(updatedMedians) !== JSON.stringify(courseData.medians)) {
            await updateDoc(courseDocRef, { medians: updatedMedians });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching grade data:', error);
      setError('Failed to fetch grade data.');
    }
  }, [courseId]);

  useEffect(() => {
    let isMounted = true;
  
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isMounted) {
          await Promise.all([fetchCourse(), fetchReviews(), fetchUserVote(), fetchCourseDescription(), fetchGradeData()]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) {
          setError('Failed to fetch data. Please try refreshing the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('Finished fetching all data');
        }
      }
    };
  
    fetchData();
  
    return () => {
      isMounted = false;
    };
  }, [courseId, department, fetchGradeData]);

  const handleNewGradeDataChange = (event) => {
    const { name, value } = event.target;
    setNewGradeData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleAddNewGradeData = async () => {
    if (!currentUser) {
      setError('You must be logged in to submit grade data.');
      return;
    }
  
    console.log('Current newGradeData:', newGradeData);
  
    if (!newGradeData.Term.trim()) {
      setError('Please enter a term.');
      return;
    }
  
    if (!newGradeData.Grade) {
      setError('Please select a grade.');
      return;
    }
  
    if (newGradeData.Professors.length === 0) {
      setError('Please enter at least one professor.');
      return;
    }
  
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const existingSubmission = userData.gradeSubmissions?.find(
          sub => sub.courseId === courseId
        );
  
        if (existingSubmission) {
          setError('You have already submitted a median for this course. You can only submit one median per course.');
          return;
        }
      }
  
      const courseDocRef = doc(db, 'courses', courseId);
      const courseDocSnap = await getDoc(courseDocRef);
      
      if (courseDocSnap.exists()) {
        const courseData = courseDocSnap.data();
        const existingMedian = courseData.medians.find(m => m.Term === newGradeData.Term);
  
        if (existingMedian && existingMedian.verified) {
          setError('This term already has verified grade data. Your submission cannot be accepted.');
          return;
        }
  
        const newSubmission = {
          Grade: newGradeData.Grade,
          timestamp: new Date().toISOString(),
          userId: currentUser.uid
        };
  
        if (existingMedian) {
          // Update existing unverified median
          const updatedMedians = courseData.medians.map(m => 
            m.Term === newGradeData.Term 
              ? { 
                  ...m, 
                  submissions: [...m.submissions, newSubmission],
                  Professors: [...new Set([...m.Professors, ...newGradeData.Professors])]
                }
              : m
          );
  
          await updateDoc(courseDocRef, { medians: updatedMedians });
        } else {
          // Add new unverified median
          await updateDoc(courseDocRef, {
            medians: arrayUnion({
              Term: newGradeData.Term,
              Professors: newGradeData.Professors,
              verified: false,
              submissions: [newSubmission]
            })
          });
        }
  
        // Add user submission
        await updateDoc(userDocRef, {
          gradeSubmissions: arrayUnion({
            courseId,
            Term: newGradeData.Term,
            Professors: newGradeData.Professors,
            Grade: newGradeData.Grade,
            timestamp: new Date().toISOString()
          })
        });
  
        await fetchGradeData();
        
        setNewGradeData({
          Term: '',
          Professors: [],
          Grade: ''
        });
  
        setError(null);
      }
    } catch (error) {
      console.error('Error adding new grade data:', error);
      setError('Failed to add new grade data.');
    }
  };

  const calculateMedianGrade = (submissions) => {
    if (!submissions || submissions.length === 0) return 'N/A';
    const validGrades = submissions.map(sub => gradeToNum[sub.Grade]).filter(grade => grade !== undefined);
    if (validGrades.length === 0) return 'N/A';
    
    validGrades.sort((a, b) => a - b);
    const mid = Math.floor(validGrades.length / 2);
    const median = validGrades.length % 2 !== 0 ? validGrades[mid] : (validGrades[mid - 1] + validGrades[mid]) / 2;
    
    return numToGrade[Math.round(median)] || 'N/A';
  };


  // const calculateAverageGrade = (submissions) => {
  //   if (!submissions || submissions.length === 0) return 'N/A';
  //   const validSubmissions = submissions.filter(sub => sub.Grade in gradeToNum);
  //   if (validSubmissions.length === 0) return 'N/A';
  //   const sum = validSubmissions.reduce((acc, sub) => acc + gradeToNum[sub.Grade], 0);
  //   const average = sum / validSubmissions.length;
  //   const closestGrade = Object.entries(gradeToNum).reduce((a, b) => 
  //     Math.abs(b[1] - average) < Math.abs(a[1] - average) ? b : a
  //   )[0];
  //   return closestGrade;
  // };
  const renderGradeChart = () => {
    const processedGradeData = gradeData.map(item => ({
      ...item,
      Grade: item.verified ? item.Grade : calculateMedianGrade(item.submissions),
      submissionCount: item.submissions ? item.submissions.length : 0
    }));
    return <GradeChart gradeData={processedGradeData} />;
  };
  // helper function to the sort the reviews
  const getTermValue = (termCode) => {
    // Handle both YYT (e.g., 21W) and TYY (e.g., W21) formats
    let year, term;
    
    // Check if it's in YYT format (e.g., 21W)
    const yyFormat = /^(\d{2})([WSXF])$/i.exec(termCode);
    if (yyFormat) {
      year = parseInt(yyFormat[1], 10);
      term = yyFormat[2].toUpperCase();
    } else {
      // Check if it's in TYY format (e.g., W21)
      const tyFormat = /^([WSXF])(\d{2})$/i.exec(termCode);
      if (tyFormat) {
        year = parseInt(tyFormat[2], 10);
        term = tyFormat[1].toUpperCase();
      } else {
        // If format is unrecognized, return a default low value
        return 0;
      }
    }
    
    let termValue;
    switch (term) {
      case 'W': // Winter
        termValue = 1;
        break;
      case 'S': // Spring
        termValue = 2;
        break;
      case 'X': // Summer
        termValue = 3;
        break;
      case 'F': // Fall
        termValue = 4;
        break;
      default:
        termValue = 0; // Just in case
        break;
    }
  
    return year * 10 + termValue; // Multiplying the year to get a comparable numeric value
  };
  
  // Extract term codes from reviews for each professor
  const extractProfessorTerms = (reviews) => {
    const professorTerms = {};
    console.log("Extracting professor terms from", reviews.length, "reviews");
    
    reviews.forEach(review => {
      const { instructor, review: reviewText } = review;
      
      // More flexible regex to match term patterns in various formats
      // Look for patterns like "21W with", "21W:", "W21 with", or just "21W" at the start of review
      const termPatterns = [
        /^(\d{2}[WSXF])\s+with/i,  // "21W with"
        /^(\d{2}[WSXF]):/i,        // "21W:"
        /^([WSXF]\d{2})\s+with/i,  // "W21 with"
        /^(\d{2}[WSXF])/i,         // Just "21W" at start
        /\b(\d{2}[WSXF])\b/i,      // Any "21W" in the text surrounded by word boundaries
        /\b([WSXF]\d{2})\b/i,      // Any "W21" in the text surrounded by word boundaries
        /\b(winter|spring|summer|fall)[\s\-]*(20|19)(\d{2})\b/i, // "Winter 2021" or "Fall 2019"
        /\b(20|19)(\d{2})[\s\-]*(winter|spring|summer|fall)\b/i  // "2021 Winter" or "2019 Fall"
      ];
      
      let termCode = null;
      
      // Try each pattern until we find a match
      for (const pattern of termPatterns) {
        const match = reviewText.match(pattern);
        if (match && match[1]) {
          // Check if it's a term word like "winter" or "spring"
          if (match[1].toLowerCase().match(/winter|spring|summer|fall/i)) {
            const season = match[1].toLowerCase();
            let seasonCode;
            switch(season) {
              case 'winter': seasonCode = 'W'; break;
              case 'spring': seasonCode = 'S'; break;
              case 'summer': seasonCode = 'X'; break;
              case 'fall': seasonCode = 'F'; break;
              default: seasonCode = '';
            }
            // Extract year from the match - position depends on the pattern
            const year = match[3] || match[2];
            termCode = year + seasonCode;
          } else {
            // If format is T21, convert to 21T
            if (match[1].match(/^[WSXF]\d{2}/)) {
              const term = match[1].charAt(0);
              const year = match[1].substring(1);
              termCode = year + term;
            } else {
              termCode = match[1];
            }
          }
          break;
        }
      }
      
      // If no match with standard patterns, try a more general approach
      if (!termCode) {
        // Look for any standalone term indicator like "Winter 2021" or "Fall 2019"
        const termWords = {
          'winter': 'W',
          'spring': 'S',
          'summer': 'X',
          'fall': 'F'
        };
        
        for (const [word, code] of Object.entries(termWords)) {
          const seasonMatch = new RegExp(`${word}\\s+(20|19)(\\d{2})`, 'i').exec(reviewText);
          if (seasonMatch) {
            const year = seasonMatch[2]; // Get the last two digits of the year
            termCode = year + code;
            break;
          }
        }
      }
      
      // Add the term to the professor's set if found
      if (termCode) {
        if (!professorTerms[instructor]) {
          professorTerms[instructor] = new Set();
        }
        professorTerms[instructor].add(termCode);
        
        // Log successful extraction for debugging
        console.log(`Extracted term ${termCode} for professor ${instructor} from review: "${reviewText.substring(0, 50)}..."`);
      } else {
        console.log(`Failed to extract term for professor ${instructor} from review starting with: "${reviewText.substring(0, 50)}..."`);
      }
    });
    
    // Convert Sets to sorted Arrays
    Object.keys(professorTerms).forEach(professor => {
      const termArray = Array.from(professorTerms[professor]);
      
      // Sort terms by termValue (most recent first)
      termArray.sort((a, b) => getTermValue(b) - getTermValue(a));
      
      professorTerms[professor] = termArray;
    });
    
    // Add current term data from winterInstructors and springInstructors
    const currentYear = new Date().getFullYear().toString().substring(2);
    console.log("Current year for term codes:", currentYear);
    
    winterInstructors.forEach(instructor => {
      if (!professorTerms[instructor]) {
        professorTerms[instructor] = [];
      }
      
      const winterTerm = currentYear + 'W';
      if (!professorTerms[instructor].includes(winterTerm)) {
        professorTerms[instructor].unshift(winterTerm);
        console.log(`Added current Winter term ${winterTerm} for professor ${instructor}`);
      }
    });
    
    springInstructors.forEach(instructor => {
      if (!professorTerms[instructor]) {
        professorTerms[instructor] = [];
      }
      
      const springTerm = currentYear + 'S';
      if (!professorTerms[instructor].includes(springTerm)) {
        professorTerms[instructor].unshift(springTerm);
        console.log(`Added current Spring term ${springTerm} for professor ${instructor}`);
      }
    });
    
    summerInstructors.forEach(instructor => {
      if (!professorTerms[instructor]) {
        professorTerms[instructor] = [];
      }
      
      const summerTerm = currentYear + 'X';
      if (!professorTerms[instructor].includes(summerTerm)) {
        professorTerms[instructor].unshift(summerTerm);
        console.log(`Added current Summer term ${summerTerm} for professor ${instructor}`);
      }
    });
    
    fallInstructors.forEach(instructor => {
      if (!professorTerms[instructor]) {
        professorTerms[instructor] = [];
      }
      
      const fallTerm = currentYear + 'F';
      if (!professorTerms[instructor].includes(fallTerm)) {
        professorTerms[instructor].unshift(fallTerm);
        console.log(`Added current Fall term ${fallTerm} for professor ${instructor}`);
      }
    });
    
    console.log("Final professorTerms:", professorTerms);
    return professorTerms;
  };

  // Format term code to display format (e.g., 25W instead of W25)
  const formatTermCode = (termCode) => {
    if (!termCode) return "";
    
    // Ensure we have a valid term code format (YYT)
    const regex = /^(\d{2})([WSXF])$/i;
    const match = termCode.match(regex);
    
    if (match) {
      const year = match[1];
      const term = match[2].toUpperCase();
      
      // Return in format with year first, then term (e.g., 21W, 20F)
      return `${year}${term}`;
    }
    
    // If not matching our expected format, try the TYY format
    const altRegex = /^([WSXF])(\d{2})$/i;
    const altMatch = termCode.match(altRegex);
    
    if (altMatch) {
      const term = altMatch[1].toUpperCase();
      const year = altMatch[2];
      
      // Convert from TYY to YYT format
      return `${year}${term}`;
    }
    
    // If not matching any expected format, return as is
    return termCode;
  };
  
  // NOTE: There may be some hardcoded term values (like W25, 25S) in the UI components
  // These should be manually updated to match the new format (25W, 25S) if necessary
  
  // Render term chip with appropriate styling based on term
  const renderTermChip = (termCode, darkMode) => {
    // If no term code provided, return default styling
    if (!termCode) {
      return (
        <Box
          sx={{
            backgroundColor: darkMode ? '#424242' : '#F5F5F5',
            padding: '2px 8px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            border: darkMode ? '1px solid #616161' : '1px solid #E0E0E0',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: darkMode ? '#E0E0E0' : '#616161',
            }}
          >
            Unknown
          </Typography>
        </Box>
      );
    }
    
    // Extract the term letter (W, S, X, F)
    let term = '';
    
    // Check format: if it's YYT (e.g., 21W) then term is the last character
    const yyTermRegex = /^(\d{2})([WSXF])$/i;
    const tyTermRegex = /^([WSXF])(\d{2})$/i;
    
    if (yyTermRegex.test(termCode)) {
      term = termCode.charAt(2).toUpperCase();
    } else if (tyTermRegex.test(termCode)) {
      term = termCode.charAt(0).toUpperCase();
    } else {
      // Default to unknown specific styling if format is unknown
      term = 'U'; // Unknown
      console.log(`Unknown term format: ${termCode}`);
    }
    
    // Define color schemes for each term
    let colors = {
      bg: '',
      border: '',
      text: ''
    };
    
    switch (term) {
      case 'W': // Winter
        colors = {
          bg: darkMode ? '#2C3E50' : '#E0F7FF',
          border: darkMode ? '#4A6572' : '#B3E5FC',
          text: darkMode ? '#B3E5FC' : '#0277BD'
        };
        break;
      case 'S': // Spring
        colors = {
          bg: darkMode ? '#4D3C14' : '#FFF8E1',
          border: darkMode ? '#6D5B24' : '#FFE082',
          text: darkMode ? '#FFE082' : '#F57F17'
        };
        break;
      case 'X': // Summer
        colors = {
          bg: darkMode ? '#006064' : '#E0F7FA',
          border: darkMode ? '#00838F' : '#80DEEA',
          text: darkMode ? '#B2EBF2' : '#00838F'
        };
        break;
      case 'F': // Fall
        colors = {
          bg: darkMode ? '#4E342E' : '#FBE9E7',
          border: darkMode ? '#6D4C41' : '#FFCCBC',
          text: darkMode ? '#FFCCBC' : '#D84315'
        };
        break;
      default:
        colors = {
          bg: darkMode ? '#424242' : '#F5F5F5',
          border: darkMode ? '#616161' : '#E0E0E0',
          text: darkMode ? '#E0E0E0' : '#616161'
        };
    }
    
    return (
      <Box
        sx={{
          backgroundColor: colors.bg,
          padding: '2px 8px',
          borderRadius: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          border: `1px solid ${colors.border}`,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: colors.text,
          }}
        >
          {formatTermCode(termCode)}
        </Typography>
      </Box>
    );
  };

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    console.log('Fetching course...');
    try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const courseData = docSnap.data();
            if (courseData.layup === undefined) {
                courseData.layup = 0;
            }
            if (courseData.quality === undefined) {
                courseData.quality = 0; // Set a default value if quality is not present
            }
            setCourse(courseData);
            setQuality(courseData.quality); // Update quality state
        } else {
            setError('Course not found.');
        }
    } catch (error) {
        console.error('Error fetching course:', error);
        setError('Failed to fetch course.');
    } finally {
        setLoading(false);
        console.log('Finished fetching course');
    }
}, [courseId]);
const handleQualityVote = async (voteType) => {
  if (!course || !currentUser) return;

  const userDocRef = doc(db, 'users', currentUser.uid);
  const courseRef = doc(db, 'courses', courseId);

  let newQuality = quality !== undefined ? quality : 0;

  if (vote === voteType) {
      newQuality = voteType === 'upvote' ? newQuality - 1 : newQuality + 1;
      await updateDoc(courseRef, { quality: newQuality });
      await setDoc(userDocRef, { votes: { [`quality_${courseId}`]: null } }, { merge: true });
      setVote(null);
  } else {
      if (vote === 'upvote') {
          newQuality -= 1;
      } else if (vote === 'downvote') {
          newQuality += 1;
      }
      newQuality = voteType === 'upvote' ? newQuality + 1 : newQuality - 1;

      await updateDoc(courseRef, { quality: newQuality });
      await setDoc(userDocRef, { votes: { [`quality_${courseId}`]: voteType } }, { merge: true });
      setVote(voteType);
  }

  setQuality(newQuality);
};



  const fetchUserVote = useCallback(async () => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const userVote = userData.votes ? userData.votes[courseId] : null;
      setVote(userVote);
      setPinned(userData.pinnedCourses ? userData.pinnedCourses.includes(courseId) : false);
    }
  }, [currentUser, courseId]);

  const fetchCourseDescription = async () => {
    try {
      console.log("Fetching course description for courseId:", courseId);
  
      const courseDocRef = doc(db, 'courses', courseId);
      const courseDocSnap = await getDoc(courseDocRef);
      
      if (courseDocSnap.exists()) {
        const courseData = courseDocSnap.data();

        const courseIdParts = courseId.split('__');
        const deptCodeMatch = courseIdParts[0].match(/[A-Z]+/);
        const courseNumberMatch = courseIdParts[0].match(/\d+/);
        let instructors = [];
        if (deptCodeMatch && courseNumberMatch) {
          const deptCode = deptCodeMatch[0];
          let courseNumValue = courseNumberMatch[0].replace(/^0+/, '');
          if (deptCode && courseNumValue) {
            console.log("Department:", deptCode, "Course Number:", courseNumValue);
            console.log("fetching current instructors")
            try {
              // Check Winter Term
              const winterTimetableRef = collection(db, 'winterTimetable');
              console.log("deptCode:", deptCode, "courseNumber:", courseNumValue);
              const winterQuery = query(winterTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumValue));
              const winterQuerySnapshot = await getDocs(winterQuery);
              
              let winterFound = false;
              winterQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.Instructor) {
                  winterFound = true;
                  if (!instructors.includes(data.Instructor)) {
                    instructors.push(data.Instructor);
                  }
                }
              });
              
              // Check Spring Term
              const springTimetableRef = collection(db, 'springTimetable');
              const springQuery = query(springTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumValue));
              const springQuerySnapshot = await getDocs(springQuery);
              
              let springFound = false;
              springQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.Instructor) {
                  springFound = true;
                  if (!instructors.includes(data.Instructor)) {
                    instructors.push(data.Instructor);
                  }
                }
              });
              
              // Check Summer Term
              const summerTimetableRef = collection(db, 'summerTimetable');
              const summerQuery = query(summerTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumValue));
              const summerQuerySnapshot = await getDocs(summerQuery);
              
              let summerInstructors = [];
              let summerFound = false;
              summerQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.Instructor) {
                  summerFound = true;
                  if (!summerInstructors.includes(data.Instructor)) {
                    summerInstructors.push(data.Instructor);
                  }
                }
              });
              
              // Check Fall Term
              const fallTimetableRef = collection(db, 'fallTimetable2');
              const fallQuery = query(fallTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumValue));
              const fallQuerySnapshot = await getDocs(fallQuery);
              
              let fallInstructors = [];
              let fallFound = false;
              fallQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.Instructor) {
                  fallFound = true;
                  if (!fallInstructors.includes(data.Instructor)) {
                    fallInstructors.push(data.Instructor);
                  }
                }
              });
              
              console.log("Matching instructors:", instructors);

              setIsTaughtCurrentTerm(winterFound);
              setIsTaughtSpringTerm(springFound);
              setIsTaughtSummerTerm(summerFound);
              setIsTaughtFallTerm(fallFound);
              if (instructors.length > 0) {
                setCurrentInstructors(instructors);
              } else {
                console.log("No instructors found for this course");
              }
            } catch (error) {
              console.error("Error fetching documents:", error);
            }
          }
          // If the description already exists in the document, use it
          if (courseData.description) {
            setCourseDescription(courseData.description);
            setDescriptionError(null);
            console.log("Course description found in Firestore:", courseData.description);
          } else {
            // If the description doesn't exist, fetch it from the Dartmouth website

            if (deptCode && courseNumValue) {
              console.log("Department:", deptCode, "Course Number:", courseNumValue);
          
              const response = await fetch(`${API_URL}/fetch-text?subj=${deptCode}&numb=${courseNumValue}`);
              console.log("deptCode:", deptCode, "courseNumber:", courseNumValue);
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              
              if (data.content) {
                setCourseDescription(data.content);
                setDescriptionError(null);
                console.log("Fetched course description from Dartmouth website:", data.content);

                // Save the fetched description to the 'courses' collection
                await updateDoc(courseDocRef, { description: data.content });
                console.log("Saved course description to Firestore in the 'courses' collection");
              } else {
                throw new Error('No content in the response');
              }
            } else {
              throw new Error('Course number or department code not found');
            }
          }
        } else {
          throw new Error('Course number or department code not found');
        }
      } else {
        throw new Error('Course not found in Firestore');
      }
    }
    catch (error) {
      console.error('Error fetching course description:', error);
      setDescriptionError('Course description not available');
      setCourseDescription('Course description not available or class has not been recently offered');
    }
  };
  
  const fetchInstructors = useCallback(async () => {
    try {
      const courseIdParts = courseId.split('__');
      const deptCodeMatch = courseIdParts[0].match(/[A-Z]+/);
      const courseNumberMatch = courseIdParts[0].match(/\d+/);

      if (deptCodeMatch && courseNumberMatch) {
        const deptCode = deptCodeMatch[0];
        const courseNumber = courseNumberMatch[0].replace(/^0+/, '');
        console.log("Fetching current instructors");

        // Check Winter Term
        const winterTimetableRef = collection(db, 'winterTimetable');
        const winterQuery = query(winterTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumber));
        const winterQuerySnapshot = await getDocs(winterQuery);
        
        let winterInstructors = [];
        let winterFound = false;
        winterQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.Instructor) {
            winterFound = true;
            if (!winterInstructors.includes(data.Instructor)) {
              winterInstructors.push(data.Instructor);
            }
          }
        });
        
        // Check Spring Term
        const springTimetableRef = collection(db, 'springTimetable');
        const springQuery = query(springTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumber));
        const springQuerySnapshot = await getDocs(springQuery);
        
        let springInstructors = [];
        let springFound = false;
        springQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.Instructor) {
            springFound = true;
            if (!springInstructors.includes(data.Instructor)) {
              springInstructors.push(data.Instructor);
            }
          }
        });

        // Check Summer Term
        const summerTimetableRef = collection(db, 'summerTimetable');
        const summerQuery = query(summerTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumber));
        const summerQuerySnapshot = await getDocs(summerQuery);
        
        let summerInstructors = [];
        let summerFound = false;
        summerQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.Instructor) {
            summerFound = true;
            if (!summerInstructors.includes(data.Instructor)) {
              summerInstructors.push(data.Instructor);
            }
          }
        });
        
        // Check Fall Term
        const fallTimetableRef = collection(db, 'fallTimetable2');
        const fallQuery = query(fallTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumber));
        const fallQuerySnapshot = await getDocs(fallQuery);
        
        let fallInstructors = [];
        let fallFound = false;
        fallQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.Instructor) {
            fallFound = true;
            if (!fallInstructors.includes(data.Instructor)) {
              fallInstructors.push(data.Instructor);
            }
          }
        });
        
        // Find instructors who teach in both terms
        const bothTermsInstructors = winterInstructors.filter(instructor => 
          springInstructors.includes(instructor)
        );

        setCurrentInstructors([...winterInstructors, ...springInstructors, ...summerInstructors, ...fallInstructors]);
        setWinterInstructors(winterInstructors);
        setSpringInstructors(springInstructors);
        setSummerInstructors(summerInstructors);
        setFallInstructors(fallInstructors);
        setBothTermsInstructors(bothTermsInstructors);
        setIsTaughtCurrentTerm(winterFound);
        setIsTaughtSpringTerm(springFound);
        setIsTaughtSummerTerm(summerFound);
        setIsTaughtFallTerm(fallFound);
        console.log("Current instructors:", [...winterInstructors, ...springInstructors, ...summerInstructors, ...fallInstructors]);
        console.log("Winter instructors:", winterInstructors);
        console.log("Spring instructors:", springInstructors);
        console.log("Summer instructors:", summerInstructors);
        console.log("Fall instructors:", fallInstructors);
        console.log("Both terms instructors:", bothTermsInstructors);
        let data = null;
        const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
        const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
        var reviewsRef = null
        if (transformedCourseId) {
          reviewsRef = doc(db, 'reviews', `${transformedCourseId}`);
        }
    
        if (!data) {
          const sanitizedCourseId = courseId.split('_')[1];
          reviewsRef = doc(db, 'reviews', `${sanitizedCourseId}`);
        }
        if (!reviewsRef) {
          return;
        }
        // Fetch review instructors
        const reviewsDoc = await getDoc(reviewsRef);
        
        if (reviewsDoc.exists()) {
          const reviewsData = reviewsDoc.data();
          const reviewInstructors = Object.keys(reviewsData);
          setReviewInstructors(reviewInstructors);
          console.log("Review instructors:", reviewInstructors);

          // Compare and update if necessary
          const instructorsToAdd = [...winterInstructors, ...springInstructors, ...summerInstructors, ...fallInstructors].filter(instructor => 
            !reviewInstructors.some(reviewInstructor => compareNames(instructor, reviewInstructor))
          );

          if (instructorsToAdd.length > 0) {
            const updatedReviews = { ...reviewsData };
            instructorsToAdd.forEach(instructor => {
              updatedReviews[instructor] = [];
            });

            await setDoc(reviewsRef, updatedReviews);
            console.log("Added new instructors to reviews:", instructorsToAdd);
          }
        } else {
          // If the document doesn't exist, create it with the current instructors
          const newReviewsData = {};
          [...winterInstructors, ...springInstructors, ...summerInstructors, ...fallInstructors].forEach(instructor => {
            newReviewsData[instructor] = [];
          });
          await setDoc(reviewsRef, newReviewsData);
          console.log("Created new reviews document with instructors:", [...winterInstructors, ...springInstructors, ...summerInstructors, ...fallInstructors]);
        }

        setIsTaughtCurrentTerm([...winterInstructors, ...springInstructors, ...summerInstructors, ...fallInstructors].length > 0);
      }
    } catch (error) {
      console.error("Error fetching and updating instructors:", error);
    }
  }, [courseId]);
  

  const API_URL = process.env.REACT_APP_API_URL || 'https://url-text-fetcher-368299696124.us-central1.run.app';
  
  useEffect(() => {
    let isMounted = true;
  
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isMounted) {
          await Promise.all([fetchCourse(), fetchReviews(), fetchUserVote(), fetchCourseDescription(), fetchGradeData(), fetchInstructors()]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) {
          setError('Failed to fetch data. Please try refreshing the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('Finished fetching all data');
        }
      }
    };
  
    fetchData();
  
    return () => {
      isMounted = false;
    };
  }, [courseId, department, fetchGradeData, fetchInstructors]);

  const handleVote = async (voteType) => {
    if (!course || !currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const courseRef = doc(db, 'courses', courseId);

    let newLayup = course.layup !== undefined ? course.layup : 0;

    if (vote === voteType) {
      newLayup = voteType === 'upvote' ? newLayup - 1 : newLayup + 1;
      await updateDoc(courseRef, { layup: newLayup });
      await setDoc(userDocRef, { votes: { [courseId]: null } }, { merge: true });
      setVote(null);
    } else {
      if (vote === 'upvote') {
        newLayup -= 1;
      } else if (vote === 'downvote') {
        newLayup += 1;
      }
      newLayup = voteType === 'upvote' ? newLayup + 1 : newLayup - 1;

      await updateDoc(courseRef, { layup: newLayup });
      await setDoc(userDocRef, { votes: { [courseId]: voteType } }, { merge: true });
      setVote(voteType);
    }

    setCourse((prev) => ({ ...prev, layup: newLayup }));
  };

  const handlePinCourse = async () => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);

    try {
      if (pinned) {
        await updateDoc(userDocRef, {
          pinnedCourses: arrayRemove(courseId),
        });
        setPinned(false);
      } else {
        await updateDoc(userDocRef, {
          pinnedCourses: arrayUnion(courseId),
        });
        setPinned(true);
      }
    } catch (error) {
      console.error('Error pinning/unpinning course:', error);
    }
  };

  const splitReviewText = (review) => {
    if (typeof review !== 'string' || !review) {
      console.warn('Invalid review format:', review);
      return { prefix: '', rest: '' };
    }
    const match = review.match(/(.*?\d{2}[A-Z] with [^:]+: )([\s\S]*)/);
    if (match) {
      const [prefix, rest] = match.slice(1, 3);
      return { prefix, rest };
    } else {
      return { prefix: '', rest: review };
    }
  };

  const handleChangePage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const addReplyLocally = (reviewIndex, newReply) => {
    // Use a functional update to avoid potential stale state issues
    setReviews(prevReviews => {
      // Create a new array with the updated review
      return prevReviews.map(review => {
        if (review.reviewIndex === reviewIndex) {
          // Create a new review object with the updated replies array
          return {
            ...review,
            replies: Array.isArray(review.replies) 
              ? [...review.replies, newReply] 
              : [newReply]
          };
        }
        // Return unchanged reviews
        return review;
      });
    });
  };

  const ReviewItem = ({ instructor, prefix, rest, courseId, reviewIndex, onReplyAdded }) => {
    const { ref, inView } = useInView({ threshold: 0.1 });
    const { currentUser } = useAuth();
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [replyCount, setReplyCount] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    
    // Add a ref to track if component is mounted
    const isMounted = useRef(true);
    
    // Clean up on unmount
    useEffect(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);

    const fetchReplies = async () => {
      try {
        const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
        const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
        const sanitizedCourseId = transformedCourseId ? transformedCourseId : courseId.split('_')[1];
        const sanitizedInstructor = instructor.replace(/\./g, '_');

        const repliesCollectionRef = collection(
          db,
          'reviews',
          sanitizedCourseId,
          `${sanitizedInstructor}_${reviewIndex}_replies`
        );
        const replyDocs = await getDocs(repliesCollectionRef);

        const fetchedReplies = replyDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setReplies(fetchedReplies);
          setReplyCount(fetchedReplies.length);
        }
      } catch (error) {
        console.error('Error fetching replies:', error);
        if (isMounted.current) {
          setError('Failed to fetch replies.');
        }
      }
    };

    const fetchLikes = async () => {
      try {
        const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
        const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
        const sanitizedCourseId = transformedCourseId ? transformedCourseId : courseId.split('_')[1];
        const sanitizedInstructor = instructor.replace(/\./g, '_');

        const likesCollectionRef = collection(
          db,
          'reviews',
          sanitizedCourseId,
          `${sanitizedInstructor}_${reviewIndex}_likes`
        );
        const likeDocs = await getDocs(likesCollectionRef);

        const fetchedLikes = likeDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setLikeCount(fetchedLikes.length);

        if (currentUser) {
          const userLike = fetchedLikes.find((like) => like.userId === currentUser.uid);
          setHasLiked(!!userLike);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
        setError('Failed to fetch likes.');
      }
    };

    useEffect(() => {
      fetchReplies();
      fetchLikes();
    }, [courseId, instructor, reviewIndex]);

    const toggleReplies = () => {
      setShowReplies(!showReplies);
    };

    const handleLike = async () => {
      const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
      const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
      const sanitizedCourseId = transformedCourseId ? transformedCourseId : courseId.split('_')[1];
      const sanitizedInstructor = instructor.replace(/\./g, '_');

      const likesCollectionRef = collection(
        db,
        'reviews',
        sanitizedCourseId,
        `${sanitizedInstructor}_${reviewIndex}_likes`
      );
      const likeDocRef = doc(likesCollectionRef, currentUser.uid);

      if (hasLiked) {
        await deleteDoc(likeDocRef);
        setLikeCount(likeCount - 1);
        setHasLiked(false);
      } else {
        await setDoc(likeDocRef, { userId: currentUser.uid });
        setLikeCount(likeCount + 1);
        setHasLiked(true);
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%' }}
      >
        <Box
          sx={{
            my: 3,
            background: darkMode
              ? 'rgba(30, 35, 61, 0.6)' 
              : 'rgba(248, 249, 251, 0.75)',
            borderRadius: '18px',
            overflow: 'hidden',
            border: darkMode
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: darkMode
              ? '0 12px 24px rgba(0, 0, 0, 0.15)'
              : '0 12px 24px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode
                ? '0 16px 32px rgba(0, 0, 0, 0.2)'
                : '0 16px 32px rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          <ListItem sx={{ p: { xs: 2.5, sm: 3.5 }, alignItems: 'flex-start' }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 2, 
                mb: 1.5,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '-12px',
                  top: '2px',
                  height: '24px',
                  width: '4px',
                  borderRadius: '4px',
                  background: darkMode 
                    ? 'linear-gradient(to bottom, #0A84FF, #0066CC)' 
                    : 'linear-gradient(to bottom, #0071E3, #0058B0)',
                  boxShadow: darkMode ? '0 0 8px rgba(10, 132, 255, 0.5)' : 'none',
                }
              }}>
                <Typography
                  component="span"
                  sx={{
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                    lineHeight: 1.3,
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                  }}
                >
                  {prefix}
                </Typography>
              </Box>
              <Typography
                component="p"
                sx={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                  pl: '16px',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.9rem', sm: '0.95rem' },
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                  letterSpacing: '-0.011em',
                  fontWeight: 400,
                  position: 'relative',
                }}
              >
                {rest}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 2.5,
                  pl: '16px',
                  gap: 2.5,
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  backgroundColor: hasLiked 
                    ? (darkMode ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 113, 227, 0.08)') 
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: hasLiked 
                      ? (darkMode ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 113, 227, 0.12)') 
                      : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')
                  }
                }}>
                  <IconButton
                    onClick={handleLike}
                    sx={{
                      color: hasLiked ? (darkMode ? '#0A84FF' : '#0071E3') : (darkMode ? '#8E8E93' : '#8E8E93'),
                      padding: '3px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '1.2rem',
                        transition: 'transform 0.2s ease',
                        transform: hasLiked ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      🔥
                    </Typography>
                  </IconButton>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.85rem',
                      fontWeight: hasLiked ? 600 : 500,
                      color: hasLiked 
                        ? (darkMode ? '#0A84FF' : '#0071E3') 
                        : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'),
                      fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                    }}>
                    {likeCount}
                  </Typography>
                </Box>

                <Button
                  onClick={toggleReplies}
                  startIcon={<ChatBubbleOutlineIcon 
                    sx={{ 
                      fontSize: '0.95rem', 
                      transition: 'transform 0.2s ease',
                      transform: showReplies ? 'rotate(3deg) scale(1.1)' : 'rotate(0) scale(1)'
                    }} 
                  />}
                  sx={{ 
                    color: showReplies 
                      ? (darkMode ? '#0A84FF' : '#0071E3')
                      : (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.55)'),
                    backgroundColor: showReplies 
                      ? (darkMode ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 113, 227, 0.08)') 
                      : 'transparent',
                    textTransform: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: showReplies ? 600 : 500,
                    transition: 'all 0.2s ease',
                    fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                    letterSpacing: '-0.01em',
                    '&:hover': {
                      backgroundColor: showReplies
                        ? (darkMode ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 113, 227, 0.12)')
                        : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  {showReplies ? 'Hide replies' : `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
                </Button>
              </Box>
            </Box>
          </ListItem>
          {showReplies && (
            <>
              <Box 
                sx={{ 
                  pl: { xs: 3, sm: 4 }, 
                  pr: { xs: 2, sm: 3 },
                  pb: 3,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: '42px',
                    top: '0',
                    bottom: '20px',
                    width: '2px',
                    background: darkMode 
                      ? 'linear-gradient(to bottom, rgba(10, 132, 255, 0.15), rgba(10, 132, 255, 0.05))'
                      : 'linear-gradient(to bottom, rgba(0, 113, 227, 0.15), rgba(0, 113, 227, 0.05))',
                    borderRadius: '1px',
                  }
                }}
              >
                {replies && replies.length > 0 && replies.map((reply, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      ml: 3,
                      mt: 2,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '-14px',
                        top: '14px',
                        width: '10px',
                        height: '2px',
                        background: darkMode 
                          ? 'rgba(10, 132, 255, 0.3)'
                          : 'rgba(0, 113, 227, 0.2)',
                        borderRadius: '1px',
                      }
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: darkMode 
                          ? 'rgba(26, 30, 54, 0.6)' 
                          : 'rgba(242, 242, 247, 0.6)',
                        borderRadius: '16px',
                        p: { xs: 2, sm: 2.5 },
                        border: darkMode 
                          ? '1px solid rgba(255, 255, 255, 0.06)' 
                          : '1px solid rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        boxShadow: darkMode
                          ? '0 4px 16px rgba(0, 0, 0, 0.1)' 
                          : '0 4px 16px rgba(0, 0, 0, 0.04)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: darkMode
                            ? '0 6px 20px rgba(0, 0, 0, 0.15)' 
                            : '0 6px 20px rgba(0, 0, 0, 0.06)',
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1, 
                        pb: 1, 
                        borderBottom: darkMode 
                          ? '1px solid rgba(255, 255, 255, 0.06)' 
                          : '1px solid rgba(0, 0, 0, 0.04)'
                      }}>
                        <Typography
                          component="span"
                          sx={{ 
                            color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)', 
                            fontSize: '0.75rem',
                            fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {reply && reply.timestamp ? new Date(reply.timestamp).toLocaleString() : ''}
                        </Typography>
                      </Box>
                      <Typography
                        component="p"
                        sx={{ 
                          color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)', 
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {reply && reply.reply ? reply.reply : ''}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                {replies && replies.length > 3 && (
                  <Box 
                    sx={{ 
                      ml: 3, 
                      mt: 2, 
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '-14px',
                        top: '16px',
                        width: '10px',
                        height: '2px',
                        background: darkMode 
                          ? 'rgba(10, 132, 255, 0.3)'
                          : 'rgba(0, 113, 227, 0.2)',
                        borderRadius: '1px',
                      }
                    }}
                  >
                    <Button
                      sx={{
                        color: darkMode ? '#0A84FF' : '#0071E3',
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: darkMode 
                          ? 'rgba(10, 132, 255, 0.1)' 
                          : 'rgba(0, 113, 227, 0.05)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                        letterSpacing: '-0.01em',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: darkMode 
                            ? 'rgba(10, 132, 255, 0.15)' 
                            : 'rgba(0, 113, 227, 0.1)',
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                      Show more replies
                    </Button>
                  </Box>
                )}
                <Box sx={{ mt: 3, ml: 3 }}>
                  <AddReplyForm
                    reviewData={{ instructor, reviewIndex }}
                    courseId={courseId}
                    onReplyAdded={(newReply) => {
                      // Add the new reply to the local state
                      setReplies((prevReplies) => [...prevReplies, newReply]);
                      setReplyCount((prevCount) => prevCount + 1);
                      // Ensure replies section stays open
                      setShowReplies(true);
                      // Call the parent's onReplyAdded function if provided
                      if (onReplyAdded) {
                        onReplyAdded(newReply);
                      }
                    }}
                    darkMode={darkMode}
                    textColor={darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'}
                    backgroundColor={darkMode ? 'rgba(26, 30, 54, 0.8)' : 'rgba(242, 242, 247, 0.8)'}
                    buttonColor={darkMode ? '#0A84FF' : '#0071E3'}
                    buttonHoverColor={darkMode ? '#0066CC' : '#0058B0'}
                    inputBgColor={darkMode ? 'rgba(10, 10, 20, 0.3)' : '#FFFFFF'}
                    inputBorderColor={darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                    inputTextColor={darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'}
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </motion.div>
    );
  };
  

  const renderReviews = () => {
    const filteredReviews = selectedProfessor
      ? reviews.filter((item) => item.instructor === selectedProfessor)
      : reviews;
  
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
  
    let lastInstructor = '';
  
    return (
      <List sx={{ maxWidth: '100%', margin: '0' }}>
        {currentReviews.map((item, idx) => {
          if (!item || typeof item !== 'object') {
            console.warn('Invalid review item:', item);
            return null;
          }
  
          const showInstructor = item.instructor !== lastInstructor;
          lastInstructor = item.instructor;
  
          const { prefix, rest } = splitReviewText(item.review);
  
          return (
            <React.Fragment key={idx}>
              {showInstructor && (
                <Box
                  sx={{
                    marginTop: '40px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: '-12px',
                      width: '4px',
                      height: '20px',
                      borderRadius: '2px',
                      background: darkMode 
                        ? 'linear-gradient(to bottom, #FF9F0A, #FF7D0A)' 
                        : 'linear-gradient(to bottom, #FF9500, #FF7D00)',
                      boxShadow: darkMode ? '0 0 8px rgba(255, 159, 10, 0.5)' : 'none',
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: { xs: '1.1rem', sm: '1.2rem' },
                      letterSpacing: '-0.015em',
                      fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
                      textRendering: 'optimizeLegibility',
                      WebkitFontSmoothing: 'antialiased',
                      ml: 0.5,
                    }}
                  >
                    {item.instructor}
                  </Typography>
                  {professorTerms[item.instructor] && professorTerms[item.instructor].length > 0 && (
                    <Box sx={{ 
                      display: 'flex', 
                      ml: 2, 
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}>
                      {professorTerms[item.instructor].slice(0, 2).map((termCode, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 113, 227, 0.06)',
                            border: darkMode ? '1px solid rgba(10, 132, 255, 0.2)' : '1px solid rgba(0, 113, 227, 0.1)',
                          }}
                        >
                          <Typography 
                            sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600,
                              color: darkMode ? '#0A84FF' : '#0071E3',
                              fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                            }}
                          >
                            {formatTermCode(termCode)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              <ReviewItem
                key={idx}
                instructor={item.instructor}
                prefix={prefix}
                rest={rest}
                courseId={courseId}
                reviewIndex={item.reviewIndex}
                onReplyAdded={(newReply) => {
                  // Add the reply locally to avoid needing to reload the page
                  addReplyLocally(item.reviewIndex, newReply);
                  // Remove the fetchReviews call to prevent page re-render
                  // fetchReviews();
                }}
              />
            </React.Fragment>
          );
        })}
      </List>
    );
  };
  const [courseMetrics, setCourseMetrics] = useState(null);

useEffect(() => {
  const fetchMetrics = async () => {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (courseDoc.exists()) {
      setCourseMetrics(courseDoc.data().metrics);
    }
  };
  fetchMetrics();
}, [courseId]);


  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const renderPageButtons = () => {
    let pages = [];
    
    // Common button styling
    const pageButtonStyle = (i) => ({
      onClick: () => handleChangePage(i),
      disabled: currentPage === i,
    });
    
    // Ellipsis styling (no onClick handler)
    const ellipsisStyle = {
      disabled: true,
      sx: { 
        color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
        minWidth: { xs: '20px', sm: '24px' },
        padding: 0,
        '&.Mui-disabled': {
          color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          transform: 'none',
        }
      }
    };
    
    if (totalPages <= 5) {
      // Show all pages if there are 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <Button key={i} {...pageButtonStyle(i)}>
            {i}
          </Button>
        );
      }
    } else {
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(
            <Button key={i} {...pageButtonStyle(i)}>
              {i}
            </Button>
          );
        }
        pages.push(<Button key="ellipsis" {...ellipsisStyle}>•••</Button>);
        pages.push(
          <Button key={totalPages} {...pageButtonStyle(totalPages)}>
            {totalPages}
          </Button>
        );
      } else if (currentPage > totalPages - 3) {
        // Near the end
        pages.push(
          <Button key={1} {...pageButtonStyle(1)}>
            1
          </Button>
        );
        pages.push(<Button key="ellipsis" {...ellipsisStyle}>•••</Button>);
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(
            <Button key={i} {...pageButtonStyle(i)}>
              {i}
            </Button>
          );
        }
      } else {
        // In the middle
        pages.push(
          <Button key={1} {...pageButtonStyle(1)}>
            1
          </Button>
        );
        pages.push(<Button key="ellipsis1" {...ellipsisStyle}>•••</Button>);
        
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(
            <Button key={i} {...pageButtonStyle(i)}>
              {i}
            </Button>
          );
        }
        
        pages.push(<Button key="ellipsis2" {...ellipsisStyle}>•••</Button>);
        pages.push(
          <Button key={totalPages} {...pageButtonStyle(totalPages)}>
            {totalPages}
          </Button>
        );
      }
    }
    return pages;
  };

  const Legend = () => (
    <Box sx={{ marginTop: 2, marginBottom: 2 }}>
      <Typography variant="caption" sx={{ display: 'block' }}>
        <span style={{ backgroundColor: '#e6f7ff', padding: '2px 4px' }}>Highlighted professors</span> are teaching the current term.
      </Typography>
    </Box>
  );

  const courseName = courseId.split('_')[1];

  const uniqueProfessors = [...new Set(reviews.map((item) => item.instructor))];

  // Add this as a fallback to extract terms for professors by analyzing their reviews
  const analyzeReviewsForTerms = () => {
    // Only run if professorTerms is mostly empty
    const hasTerms = Object.values(professorTerms).filter(terms => terms.length > 0).length;
    const totalProfessors = Object.keys(professorTerms).length;
    
    console.log(`Term extraction stats: ${hasTerms}/${totalProfessors} professors have terms`);
    
    // If less than 50% of professors have terms, try manual extraction
    if (totalProfessors > 0 && (hasTerms / totalProfessors < 0.5 || hasTerms === 0) && reviews.length > 0) {
      console.log("Starting manual term extraction for professors...");
      
      // Group reviews by professor
      const professorReviews = {};
      
      reviews.forEach(review => {
        const { instructor, review: reviewText } = review;
        
        if (!professorReviews[instructor]) {
          professorReviews[instructor] = [];
        }
        
        professorReviews[instructor].push(reviewText);
      });
      
      // For each professor, look for term patterns in their reviews
      const updatedTerms = { ...professorTerms };
      
      Object.entries(professorReviews).forEach(([professor, reviewTexts]) => {
        // Skip professors who already have terms
        if (professorTerms[professor] && professorTerms[professor].length > 0) {
          return;
        }
        
        const terms = new Set();
        
        // Common term pattern words
        const termWords = {
          'winter': 'W',
          'fall': 'F',
          'spring': 'S',
          'summer': 'X'
        };
        
        // Check each review for each professor
        reviewTexts.forEach(text => {
          // Search for year patterns (20XX or 19XX)
          const yearMatches = text.match(/(20|19)(\d{2})/g);
          
          if (yearMatches) {
            yearMatches.forEach(yearMatch => {
              const year = yearMatch.substring(2); // Get last two digits
              
              // Look for season words near the year (within 20 characters)
              Object.entries(termWords).forEach(([word, code]) => {
                // Check if the word is within 20 characters of the year
                const yearIndex = text.indexOf(yearMatch);
                const searchStart = Math.max(0, yearIndex - 20);
                const searchEnd = Math.min(text.length, yearIndex + 20);
                const searchSection = text.substring(searchStart, searchEnd).toLowerCase();
                
                if (searchSection.includes(word)) {
                  const termCode = year + code;
                  terms.add(termCode);
                  console.log(`Manual extraction: Found ${word} near ${yearMatch} in review for ${professor}, adding term ${termCode}`);
                }
              });
            });
          }
          
          // Also look for explicit term codes like 19F, 20W, etc.
          const termCodeMatches = text.match(/\b(0\d|1\d|2[0-4])[WSXF]\b/gi);
          if (termCodeMatches) {
            termCodeMatches.forEach(match => {
              const termCode = match.toUpperCase();
              terms.add(termCode);
              console.log(`Manual extraction: Found explicit term code ${termCode} in review for ${professor}`);
            });
          }
          
          // Look for reverse format codes like W19, F20, etc.
          const reverseTermMatches = text.match(/\b[WSXF](0\d|1\d|2[0-4])\b/gi);
          if (reverseTermMatches) {
            reverseTermMatches.forEach(match => {
              const term = match.charAt(0).toUpperCase();
              const year = match.substring(1);
              const termCode = year + term;
              terms.add(termCode);
              console.log(`Manual extraction: Found reverse term code ${match} in review for ${professor}, converted to ${termCode}`);
            });
          }
        });
        
        // If we still don't have terms for this professor, use the current year as fallback
        if (terms.size === 0) {
          const currentYear = new Date().getFullYear().toString().substring(2);
          
          // Check if professor is in winter or spring instructors
          if (winterInstructors.includes(professor)) {
            const winterTerm = currentYear + 'W';
            terms.add(winterTerm);
            console.log(`Manual extraction: No terms found for ${professor}, adding current winter term ${winterTerm}`);
          }
          
          if (springInstructors.includes(professor)) {
            const springTerm = currentYear + 'S';
            terms.add(springTerm);
            console.log(`Manual extraction: No terms found for ${professor}, adding current spring term ${springTerm}`);
          }
          
          if (summerInstructors.includes(professor)) {
            const summerTerm = currentYear + 'X';
            terms.add(summerTerm);
            console.log(`Manual extraction: No terms found for ${professor}, adding current summer term ${summerTerm}`);
          }
        }
        
        // Update the professor's terms if we found any
        if (terms.size > 0) {
          updatedTerms[professor] = Array.from(terms).sort(
            (a, b) => getTermValue(b) - getTermValue(a)
          );
          console.log(`Manually extracted ${terms.size} terms for ${professor}: ${Array.from(terms).join(', ')}`);
        }
      });
      
      // Update the state if we found new terms
      let hasNewTerms = false;
      
      // Check if any professors have new or changed terms
      Object.keys(updatedTerms).forEach(professor => {
        if (!professorTerms[professor] || 
            JSON.stringify(updatedTerms[professor]) !== JSON.stringify(professorTerms[professor])) {
          hasNewTerms = true;
        }
      });
      
      if (hasNewTerms) {
        console.log("Updating professor terms with manual extraction results");
        setProfessorTerms(updatedTerms);
      }
    }
  };
  
  // Call the analysis function when reviews or professorTerms change
  useEffect(() => {
    if (reviews.length > 0) {
      analyzeReviewsForTerms();
    }
  }, [reviews, professorTerms]);

  return (
    <Box
  sx={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    background: mainBgColor, // Use dynamic background color
    color: textColor,         // Use dynamic text color
    textAlign: 'left',
    fontFamily: 'SF Pro Display, sans-serif',
    padding: '40px',
  }}
>
      <Container maxWidth="lg">
      <Card
  sx={{
    marginBottom: 4,
    padding: { xs: 2, sm: 3, md: 4 },
    paddingTop: { xs: 1.5, sm: 2, md: 2.5 },
    backgroundColor: paperBgColor, // Use dynamic paper background color
    color: textColor,               // Use dynamic text color
    boxShadow: 'none',
    borderRadius: '16px',
    border: darkMode ? '1px solid #444444' : '1px solid #D1D1D6', // Dynamic border color
    width: '100%',
    maxWidth: '100%',
  }}
>
          <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 1.5,
        width: '100%'
      }}
    >
      {/* Header section with course code and term tags */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          mb: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.4rem', sm: '3.2rem', md: '3.6rem' },
              letterSpacing: '-0.025em',
              color: darkMode ? '#FFFFFF' : headerTextColor,
              fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
              textRendering: 'optimizeLegibility',
              marginBottom: 0.5,
              paddingLeft: { xs: 0, sm: '2px' },
              position: 'relative',
              transition: 'color 0.2s ease',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textShadow: darkMode ? '0 0 1px rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            {courseName}
          </Typography>
          
          {(isTaughtCurrentTerm || isTaughtSpringTerm || isTaughtSummerTerm || isTaughtFallTerm) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: '2rem',
                marginLeft: 2,
                gap: '8px',
              }}
            >
              {isTaughtCurrentTerm && (
                <Tooltip title="This course is offered in 25W" arrow placement="top">
                  <Box
                    sx={{
                      backgroundColor: darkMode ? '#2C3E50' : '#E0F7FF', // Winter blue color
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      border: darkMode ? '1px solid #4A6572' : '1px solid #B3E5FC',
                      transition: 'all 0.2s ease',
                      cursor: 'help',
                      '&:hover': {
                        backgroundColor: darkMode ? '#34495E' : '#B3E5FC',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: darkMode ? '#B3E5FC' : '#0277BD',
                      }}
                    >
                      25W
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              
              {isTaughtSpringTerm && (
                <Tooltip title="This course is offered in 25S" arrow placement="top">
                  <Box
                    sx={{
                      backgroundColor: darkMode ? '#4D3C14' : '#FFF8E1',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      border: darkMode ? '1px solid #6D5B24' : '1px solid #FFE082',
                      transition: 'all 0.2s ease',
                      cursor: 'help',
                      '&:hover': {
                        backgroundColor: darkMode ? '#6D5B24' : '#FFE082',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: darkMode ? '#FFE082' : '#F57F17',
                      }}
                    >
                      25S
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              
              {isTaughtSummerTerm && (
                <Tooltip title="This course is offered in 25X" arrow placement="top">
                  <Box
                    sx={{
                      backgroundColor: darkMode ? '#006064' : '#E0F7FA',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      border: darkMode ? '1px solid #00838F' : '1px solid #80DEEA',
                      transition: 'all 0.2s ease',
                      cursor: 'help',
                      '&:hover': {
                        backgroundColor: darkMode ? '#00838F' : '#80DEEA',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: darkMode ? '#B2EBF2' : '#00838F',
                      }}
                    >
                      25X
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              
              {isTaughtFallTerm && (
                <Tooltip title="This course is offered in 25F" arrow placement="top">
                  <Box
                    sx={{
                      backgroundColor: darkMode ? '#4E342E' : '#FBE9E7',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      border: darkMode ? '1px solid #6D4C41' : '1px solid #FFCCBC',
                      transition: 'all 0.2s ease',
                      cursor: 'help',
                      '&:hover': {
                        backgroundColor: darkMode ? '#6D4C41' : '#FFCCBC',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: darkMode ? '#FFCCBC' : '#D84315',
                      }}
                    >
                      25F
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <StyledTabs value={tabValue} onChange={handleTabChange}>
            <StyledTab 
              icon={<AutoAwesomeIcon fontSize="small" />} 
              label="Description" 
              disableRipple
            />
            <StyledTab 
              icon={<EqualizerIcon fontSize="small" />} 
              label="Medians" 
              disableRipple
            />
            <StyledTab 
              icon={<QueryStatsIcon fontSize="small" />} 
              label="Course Metrics" 
              disableRipple
            />
            <StyledTab 
              icon={<Input fontSize="small" />} 
              label="Add Review" 
              disableRipple
            />
            {isBetaUser && (
              <StyledTab 
                icon={<ScienceIcon fontSize="small" />} 
                label="Beta" 
                disableRipple
              />
            )}
          </StyledTabs>
          <Tooltip
            title={pinned ? 'Unpin Course' : 'Pin course on your Profile'}
          >
            <IconButton
              onClick={handlePinCourse}
              sx={{
                color: pinned ? '#007AFF' : (darkMode ? '#FFFFFF' : '#8E8E93'),
                backgroundColor: darkMode ? (pinned ? '#007AFF' : '#1C1F43') : 'transparent',
                '&:hover': {
                  backgroundColor: darkMode ? (pinned ? '#0066D6' : '#24273c') : '#E0E0E0',
                },
                marginLeft: 1,
                padding: '6px',
              }}
            >
              {pinned ? (
                <PushPin sx={{ fontSize: 24 }} />
              ) : (
                <PushPinOutlined sx={{ fontSize: 24 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Course full name section - Apple design style */}
      <Typography
        variant="h4"
        sx={{
          color: darkMode ? '#34C759' : '#00693E',
          fontWeight: 600,
          fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
          fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.1rem' },
          marginTop: 0.5,
          marginBottom: 1,
          letterSpacing: '-0.022em',
          lineHeight: 1.1,
          textRendering: 'optimizeLegibility',
          transition: 'color 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            width: '4px',
            height: { xs: '24px', sm: '28px', md: '32px' },
            backgroundColor: darkMode ? '#34C759' : '#00693E',
            borderRadius: '2px',
            marginRight: '12px',
            boxShadow: darkMode ? '0 0 8px rgba(52, 199, 89, 0.4)' : 'none',
          }
        }}
      >
        {courseId.split('__')[1]?.replace(/_/g, ' ') || 'Course Details'}
      </Typography>
    </Box>

    {renderTabContent()}
  </Card>




        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
             <CircularProgress sx={{ color: darkMode ? '#571CE0' : '#571CE0' }} /> {/* Assuming the color remains the same */}
          </Box>

        ) : error ? (
          <Alert 
  severity="error" 
  sx={{ 
    textAlign: 'left',
    backgroundColor: darkMode ? '#333333' : '#fdecea', // Dark mode background or light red for error
    color: darkMode ? '#FFFFFF' : '#611a15',           // Dark mode text color or dark red
  }}
>
  {error}
</Alert>

        ) : reviews.length > 0 ? (
          <>
          {/* {course && (
            <Box
              sx={{
                position: 'fixed',
                top: '150px',
                left: '20px',
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column', // Stack the content vertically
                  alignItems: 'center',
                  borderRadius: '20px', // Rounded corners for a smoother look
                  backgroundColor: '#FFF', // White background for contrast
                  border: '2px solid #571CE0',
                  boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
                  padding: '20px', // Padding to give space around content
                  justifyContent: 'center',
                  width: '130px', // Adjust width for vertical layout
                  boxSizing: 'border-box',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '20px', // Space between layup and quality sections
                  }}
                >
                  <Tooltip title="Upvote Layup">
                    <IconButton
                      onClick={() => handleVote('upvote')}
                      sx={{ color: vote === 'upvote' ? '#571CE0' : 'grey', padding: 0 }}
                    >
                      <ArrowUpward sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="h6" sx={{ color: '#571CE0', fontSize: '1.5rem', fontWeight: 700 }}>
                    {course.layup || 0}
                  </Typography>
                  <Tooltip title="Downvote Layup">
                    <IconButton
                      onClick={() => handleVote('downvote')}
                      sx={{ color: vote === 'downvote' ? '#571CE0' : 'grey', padding: 0 }}
                    >
                      <ArrowDownward sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" sx={{ color: '#571CE0', marginTop: '10px', textAlign: 'center', fontWeight: 500 }}>
                    Is it a layup?
                  </Typography>
                </Box>
        
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Tooltip title="Upvote Quality">
                    <IconButton
                      onClick={() => handleQualityVote('upvote')}
                      sx={{ color: vote === 'upvote' ? '#571CE0' : 'grey', padding: 0 }}
                    >
                      <ArrowUpward sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="h6" sx={{ color: '#571CE0', fontSize: '1.5rem', fontWeight: 700 }}>
                    {quality || 0}
                  </Typography>
                  <Tooltip title="Downvote Quality">
                    <IconButton
                      onClick={() => handleQualityVote('downvote')}
                      sx={{ color: vote === 'downvote' ? '#571CE0' : 'grey', padding: 0 }}
                    >
                      <ArrowDownward sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" sx={{ color: '#571CE0', marginTop: '10px', textAlign: 'center', fontWeight: 500 }}>
                    Quality of the course?
                  </Typography>
                </Box>
              </Box>
            </Box>
          )} */}
        
        <Box
  sx={{
    position: 'relative',
    mb: 5,
    mt: 5,
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '-12px',
      top: '8px',
      width: '4px',
      height: '24px',
      borderRadius: '2px',
      backgroundColor: darkMode ? '#0A84FF' : '#0071E3',
      boxShadow: darkMode ? '0 0 8px rgba(10, 132, 255, 0.5)' : 'none',
    }
  }}
>
  <Typography
    variant="h5"
    sx={{ 
      fontWeight: 700, 
      color: darkMode ? '#FFFFFF' : headerTextColor, 
      marginBottom: 2,
      fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' },
      letterSpacing: '-0.02em',
      fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      ml: 0.5
    }}
  >
    Professors
  </Typography>

  <Box
    sx={{
      backgroundColor: darkMode ? 'rgba(30, 35, 61, 0.5)' : 'rgba(248, 249, 251, 1)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: darkMode 
        ? '0 4px 16px rgba(0, 0, 0, 0.15)' 
        : '0 4px 24px rgba(0, 0, 0, 0.06)',
      border: darkMode 
        ? '1px solid rgba(255, 255, 255, 0.08)' 
        : '1px solid rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
    }}
  >
    <Table
      sx={{
        borderCollapse: 'separate',
        borderSpacing: 0,
        '& .MuiTableCell-root': {
          borderBottom: darkMode 
            ? '1px solid rgba(255, 255, 255, 0.08)' 
            : '1px solid rgba(0, 0, 0, 0.05)',
          fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
        }
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell
            sx={{
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '0.9rem',
              padding: '16px 20px',
              letterSpacing: '-0.01em',
              borderBottom: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.12)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: darkMode ? 'rgba(20, 25, 51, 0.5)' : 'rgba(238, 239, 241, 0.7)',
            }}
          >
            Name
          </TableCell>
          <TableCell
            sx={{
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '0.9rem',
              padding: '16px 20px',
              letterSpacing: '-0.01em',
              borderBottom: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.12)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: darkMode ? 'rgba(20, 25, 51, 0.5)' : 'rgba(238, 239, 241, 0.7)',
            }}
          >
            Reviews
          </TableCell>
          <TableCell
            sx={{
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '0.9rem',
              padding: '16px 20px',
              letterSpacing: '-0.01em',
              borderBottom: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.12)' 
                : '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: darkMode ? 'rgba(20, 25, 51, 0.5)' : 'rgba(238, 239, 241, 0.7)',
            }}
          >
            Terms from Reviews
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {allProfessors
          .sort((a, b) => {
            const aIsCurrent = currentInstructors.includes(a);
            const bIsCurrent = currentInstructors.includes(b);
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            return 0;
          })
          .slice(0, showAllProfessors ? undefined : 12)
          .map((professor, index) => {
            const isCurrent = currentInstructors.includes(professor);
            const isWinter = winterInstructors.includes(professor);
            const isSpring = springInstructors.includes(professor);
            const isSummer = summerInstructors.includes(professor);
            const isFall = fallInstructors.includes(professor);
            const isBothTerms = bothTermsInstructors.includes(professor);
            const reviewCount = reviews.filter(
              (review) => review.instructor === professor
            ).length;
            return (
              <TableRow
                key={index}
                component={Link}
                to={`/departments/${department}/courses/${courseId}/professors/${encodeURIComponent(professor)}`}
                onClick={() => {
                  // Only smooth scroll to top for better UX
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                sx={{
                  backgroundColor: isBothTerms
                    ? (darkMode ? 'rgba(44, 47, 115, 0.5)' : 'rgba(208, 224, 255, 0.5)') 
                    : isCurrent
                      ? (darkMode ? 'rgba(28, 31, 67, 0.5)' : 'rgba(229, 240, 255, 0.5)') 
                      : (darkMode ? 'transparent' : 'transparent'),
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    backgroundColor: darkMode ? 'rgba(42, 42, 42, 0.5)' : 'rgba(229, 229, 234, 0.5)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  },
                  cursor: 'pointer',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <TableCell
                  sx={{
                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '0.95rem',
                    fontWeight: isBothTerms ? 600 : (isCurrent ? 500 : 400),
                    letterSpacing: '-0.01em',
                  }}
                >
                  {professor}
                </TableCell>
                <TableCell
                  sx={{
                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '0.95rem',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <Box 
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '28px',
                      height: '28px',
                      backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 113, 227, 0.05)',
                      color: darkMode ? '#0A84FF' : '#0071E3',
                      borderRadius: '14px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      padding: '0 10px',
                    }}
                  >
                    {reviewCount}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '0.95rem',
                    fontWeight: isBothTerms ? 600 : 400,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {professorTerms[professor] && professorTerms[professor].length > 0 ? (
                    <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {professorTerms[professor].slice(0, 3).map((termCode, idx) => (
                        <React.Fragment key={idx}>
                          {renderTermChip(termCode, darkMode)}
                        </React.Fragment>
                      ))}
                      {professorTerms[professor].length > 3 && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.8rem', 
                            color: darkMode ? '#A0A0A0' : '#6E6E6E',
                            ml: 1,
                            fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                          }}
                        >
                          +{professorTerms[professor].length - 3} more
                        </Typography>
                      )}
                    </Box>
                  ) : isBothTerms ? (
                    <Box sx={{ display: 'flex', gap: '8px' }}>
                      <Box
                        sx={{
                          backgroundColor: darkMode ? '#2C3E50' : '#E0F7FF',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: darkMode ? '1px solid #4A6572' : '1px solid #B3E5FC',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: darkMode ? '#B3E5FC' : '#0277BD',
                            fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                          }}
                        >
                          25W
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          backgroundColor: darkMode ? '#4D3C14' : '#FFF8E1',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: darkMode ? '1px solid #6D5B24' : '1px solid #FFE082',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: darkMode ? '#FFE082' : '#F57F17',
                            fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                          }}
                        >
                          25S
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          backgroundColor: darkMode ? '#006064' : '#E0F7FA',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: darkMode ? '1px solid #00838F' : '1px solid #80DEEA',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: darkMode ? '#B2EBF2' : '#00838F',
                            fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                          }}
                        >
                          25X
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          backgroundColor: darkMode ? '#4E342E' : '#FBE9E7',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: darkMode ? '1px solid #6D4C41' : '1px solid #FFCCBC',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: darkMode ? '#FFCCBC' : '#D84315',
                            fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                          }}
                        >
                          25F
                        </Typography>
                      </Box>
                    </Box>
                  ) : isWinter ? (
                    <Box
                      sx={{
                        backgroundColor: darkMode ? '#2C3E50' : '#E0F7FF',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: darkMode ? '1px solid #4A6572' : '1px solid #B3E5FC',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: darkMode ? '#B3E5FC' : '#0277BD',
                          fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                        }}
                      >
                        25W
                      </Typography>
                    </Box>
                  ) : isSpring ? (
                    <Box
                      sx={{
                        backgroundColor: darkMode ? '#4D3C14' : '#FFF8E1',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: darkMode ? '1px solid #6D5B24' : '1px solid #FFE082',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: darkMode ? '#FFE082' : '#F57F17',
                          fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                        }}
                      >
                        25S
                      </Typography>
                    </Box>
                  ) : isSummer ? (
                    <Box
                      sx={{
                        backgroundColor: darkMode ? '#006064' : '#E0F7FA',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: darkMode ? '1px solid #00838F' : '1px solid #80DEEA',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: darkMode ? '#B2EBF2' : '#00838F',
                          fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                        }}
                      >
                        25X
                      </Typography>
                    </Box>
                  ) : isFall ? (
                    <Box
                      sx={{
                        backgroundColor: darkMode ? '#4E342E' : '#FBE9E7',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: darkMode ? '1px solid #6D4C41' : '1px solid #FFCCBC',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: darkMode ? '#FFCCBC' : '#D84315',
                          fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                        }}
                      >
                        25F
                      </Typography>
                    </Box>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.85rem', 
                        color: darkMode ? '#888888' : '#999999',
                        fontStyle: 'italic',
                        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
                      }}
                    >
                      No term data
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        {allProfessors.length > 12 && (
          <TableRow>
            <TableCell colSpan={3} align="center">
              <Button
                onClick={() => setShowAllProfessors(!showAllProfessors)}
                sx={{
                  color: darkMode ? '#0A84FF' : '#0071E3',
                  backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 113, 227, 0.05)',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  padding: '8px 16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
                  transition: 'all 0.2s ease',
                  mt: 1,
                  mb: 1,
                  border: 'none',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 113, 227, 0.1)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                {showAllProfessors ? 'Show Less' : 'Show All'}
              </Button>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Box>
</Box>

<Box
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    marginTop: '60px',
    position: 'relative',
  }}
>
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        left: '-12px',
        width: '4px',
        height: '24px',
        borderRadius: '2px',
        background: darkMode 
          ? 'linear-gradient(to bottom, #34C759, #30D158)' 
          : 'linear-gradient(to bottom, #00693E, #00875A)',
        boxShadow: darkMode ? '0 0 8px rgba(52, 199, 89, 0.5)' : 'none',
      }
    }}
  >
    <Typography
      variant="h5"
      sx={{ 
        fontWeight: 700, 
        color: darkMode ? '#FFFFFF' : headerTextColor,
        fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' },
        letterSpacing: '-0.02em',
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      Student Reviews
    </Typography>
  </Box>

  <FormControl
    size="small"
    sx={{
      minWidth: 180,
      position: 'relative',
      '& .MuiInputBase-root': {
        backgroundColor: darkMode ? 'rgba(30, 35, 61, 0.5)' : 'rgba(248, 249, 251, 0.8)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: darkMode ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(0, 0, 0, 0.08)',
          transform: 'translateY(-1px)',
        }
      }
    }}
  >
    <InputLabel
      id="select-professor-label"
      sx={{ 
        fontWeight: 500, 
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
        fontSize: '0.85rem',
        letterSpacing: '-0.01em',
        color: darkMode ? '#0A84FF' : '#0071E3',
      }}
    >
      Filter by Professor
    </InputLabel>
    <Select
      labelId="select-professor-label"
      value={selectedProfessor}
      onChange={handleProfessorFilterChange}
      label="Filter by Professor"
      sx={{
        fontWeight: 500,
        color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
        fontSize: '0.9rem',
        letterSpacing: '-0.01em',
        '& .MuiSelect-select': {
          padding: '10px 14px',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: darkMode ? '#0A84FF' : '#0071E3',
          borderWidth: '1px',
        },
        '& .MuiSvgIcon-root': {
          color: darkMode ? '#0A84FF' : '#0071E3',
          transition: 'transform 0.2s ease',
        },
        '&.Mui-focused .MuiSvgIcon-root': {
          transform: 'rotate(180deg)',
        }
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            backgroundColor: darkMode ? 'rgba(30, 35, 61, 0.95)' : 'rgba(248, 249, 251, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
            marginTop: '8px',
            '& .MuiMenuItem-root': {
              fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
              fontSize: '0.9rem',
              letterSpacing: '-0.01em',
              padding: '10px 16px',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              },
              '&.Mui-selected': {
                backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 113, 227, 0.08)',
                color: darkMode ? '#0A84FF' : '#0071E3',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 113, 227, 0.12)',
                }
              }
            }
          }
        }
      }}
    >
      <MenuItem 
        value=""
        sx={{ 
          fontWeight: selectedProfessor === "" ? 600 : 400,
          color: selectedProfessor === "" ? (darkMode ? '#0A84FF' : '#0071E3') : 'inherit'
        }}
      >
        <em>All Professors</em>
      </MenuItem>
      {uniqueProfessors.map((professor, index) => (
        <MenuItem 
          key={index} 
          value={professor} 
          sx={{ 
            fontWeight: selectedProfessor === professor ? 600 : 400,
            color: selectedProfessor === professor ? (darkMode ? '#0A84FF' : '#0071E3') : 'inherit'
          }}
        >
          {professor}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Box>

            {renderReviews()}

            <Box
  sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '40px',
    marginBottom: '20px',
    width: '100%',
    gap: { xs: '10px', sm: '16px' },
  }}
>
  <Tooltip 
    title="Previous Page" 
    placement="top"
    arrow
    enterDelay={400}
    sx={{
      '& .MuiTooltip-arrow': {
        color: darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)',
      },
      '& .MuiTooltip-tooltip': {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)',
        color: '#FFFFFF',
        fontSize: '0.75rem',
        borderRadius: '8px',
        padding: '6px 10px',
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
        fontWeight: 500,
        letterSpacing: '-0.01em',
      }
    }}
  >
    <span>
      <IconButton
        onClick={() => handleChangePage(currentPage - 1)}
        disabled={currentPage === 1}
        sx={{
          color: darkMode ? (currentPage === 1 ? 'rgba(255, 255, 255, 0.4)' : '#0A84FF') : (currentPage === 1 ? 'rgba(0, 0, 0, 0.3)' : '#0071E3'),
          backgroundColor: darkMode 
            ? (currentPage === 1 ? 'rgba(30, 35, 61, 0.3)' : 'rgba(30, 35, 61, 0.6)') 
            : (currentPage === 1 ? 'rgba(248, 249, 251, 0.5)' : 'rgba(248, 249, 251, 0.8)'),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '14px',
          padding: '10px',
          border: darkMode 
            ? (currentPage === 1 ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(255, 255, 255, 0.08)') 
            : (currentPage === 1 ? '1px solid rgba(0, 0, 0, 0.03)' : '1px solid rgba(0, 0, 0, 0.05)'),
          boxShadow: currentPage === 1 ? 'none' : (darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.06)'),
          transition: 'all 0.2s ease',
          transform: 'translateY(0)',
          '&:hover': {
            backgroundColor: darkMode 
              ? (currentPage === 1 ? 'rgba(30, 35, 61, 0.3)' : 'rgba(30, 35, 61, 0.7)') 
              : (currentPage === 1 ? 'rgba(248, 249, 251, 0.5)' : 'rgba(248, 249, 251, 0.9)'),
            transform: currentPage === 1 ? 'translateY(0)' : 'translateY(-2px)',
            boxShadow: currentPage === 1 ? 'none' : (darkMode ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(0, 0, 0, 0.08)'),
          },
        }}
      >
        <ArrowBack sx={{ 
          fontSize: '18px',
          transition: 'transform 0.2s ease',
          transform: currentPage === 1 ? 'translateX(0)' : 'translateX(0)',
          '&:hover': {
            transform: currentPage === 1 ? 'translateX(0)' : 'translateX(-2px)'
          }
        }} />
      </IconButton>
    </span>
  </Tooltip>

  <Box
    sx={{
      display: 'flex',
      backgroundColor: darkMode ? 'rgba(30, 35, 61, 0.5)' : 'rgba(248, 249, 251, 0.7)',
      borderRadius: '18px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '4px 8px',
      border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
      boxShadow: darkMode ? '0 4px 16px rgba(0, 0, 0, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.06)',
      '& .MuiButton-root': {
        minWidth: { xs: '32px', sm: '36px' },
        height: { xs: '32px', sm: '36px' },
        borderRadius: '12px',
        padding: '0',
        margin: '4px',
        fontSize: { xs: '0.85rem', sm: '0.9rem' },
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        backgroundColor: 'transparent',
        color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
        border: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          transform: 'translateY(-1px)',
        },
        '&.Mui-disabled': {
          backgroundColor: darkMode ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 113, 227, 0.08)',
          color: darkMode ? '#0A84FF' : '#0071E3',
          fontWeight: 600,
          transform: 'scale(1.05)',
          boxShadow: darkMode ? '0 2px 8px rgba(10, 132, 255, 0.2)' : '0 2px 8px rgba(0, 113, 227, 0.1)',
        }
      }
    }}
  >
    {renderPageButtons()}
  </Box>

  <Tooltip 
    title="Next Page" 
    placement="top"
    arrow
    enterDelay={400}
    sx={{
      '& .MuiTooltip-arrow': {
        color: darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)',
      },
      '& .MuiTooltip-tooltip': {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)',
        color: '#FFFFFF',
        fontSize: '0.75rem',
        borderRadius: '8px',
        padding: '6px 10px',
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif',
        fontWeight: 500,
        letterSpacing: '-0.01em',
      }
    }}
  >
    <span>
      <IconButton
        onClick={() => handleChangePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        sx={{
          color: darkMode ? (currentPage === totalPages ? 'rgba(255, 255, 255, 0.4)' : '#0A84FF') : (currentPage === totalPages ? 'rgba(0, 0, 0, 0.3)' : '#0071E3'),
          backgroundColor: darkMode 
            ? (currentPage === totalPages ? 'rgba(30, 35, 61, 0.3)' : 'rgba(30, 35, 61, 0.6)') 
            : (currentPage === totalPages ? 'rgba(248, 249, 251, 0.5)' : 'rgba(248, 249, 251, 0.8)'),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '14px',
          padding: '10px',
          border: darkMode 
            ? (currentPage === totalPages ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(255, 255, 255, 0.08)') 
            : (currentPage === totalPages ? '1px solid rgba(0, 0, 0, 0.03)' : '1px solid rgba(0, 0, 0, 0.05)'),
          boxShadow: currentPage === totalPages ? 'none' : (darkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.06)'),
          transition: 'all 0.2s ease',
          transform: 'translateY(0)',
          '&:hover': {
            backgroundColor: darkMode 
              ? (currentPage === totalPages ? 'rgba(30, 35, 61, 0.3)' : 'rgba(30, 35, 61, 0.7)') 
              : (currentPage === totalPages ? 'rgba(248, 249, 251, 0.5)' : 'rgba(248, 249, 251, 0.9)'),
            transform: currentPage === totalPages ? 'translateY(0)' : 'translateY(-2px)',
            boxShadow: currentPage === totalPages ? 'none' : (darkMode ? '0 6px 16px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(0, 0, 0, 0.08)'),
          },
        }}
      >
        <ArrowForward sx={{ 
          fontSize: '18px',
          transition: 'transform 0.2s ease',
          transform: currentPage === totalPages ? 'translateX(0)' : 'translateX(0)',
          '&:hover': {
            transform: currentPage === totalPages ? 'translateX(0)' : 'translateX(2px)'
          }
        }} />
      </IconButton>
    </span>
  </Tooltip>
</Box>



          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', marginBottom: '20px' }}>
              <Typography variant="h6" sx={{ marginBottom: '20px', color: '#571CE0', fontWeight: 600 }}>
                No reviews available
              </Typography>
              <Typography variant="h6" sx={{ color: '#571CE0', fontWeight: 600 }}>
                Don't be shy, be the first one to add a review!
              </Typography>
              <Box
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}
              >
              </Box>
            </Box>
          </>
        )}
        <Box
          id="add-review-section"
          sx={{
            background: '',
            padding: '20px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '100%',
            color: '#fff',
            boxShadow: 'none', // Set this to 'none' or remove it entirely
          }}
        >
          <Container maxWidth="md">
          <AddReviewForm 
            onReviewAdded={(newReview) => {
              // Add the review locally first to avoid full page re-render
              if (newReview) {
                setReviews(prevReviews => [
                  {
                    instructor: newReview.instructor,
                    review: newReview.review,
                    reviewIndex: newReview.reviewIndex || 0,
                    courseId: courseId,
                    termValue: newReview.termValue || 0
                  },
                  ...prevReviews
                ]);
              }
            }} 
            darkMode={darkMode} 
          />
          </Container>
        </Box>
      </Container>
    </Box>
  );
};

export default CourseReviewsPage;