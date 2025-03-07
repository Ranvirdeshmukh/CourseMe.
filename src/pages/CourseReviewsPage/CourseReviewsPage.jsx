import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Typography, Box, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, List, ListItem, ListItemText, Button, ButtonGroup, IconButton, Tooltip,
  MenuItem, Select, FormControl, InputLabel, CircularProgress, Card, Badge, Tabs, Tab, LinearProgress,
  TextField, Autocomplete
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


const CourseReviewsPage = ({ darkMode }) => {
  const [isTaughtCurrentTerm, setIsTaughtCurrentTerm] = useState(false);
  const [isTaughtSpringTerm, setIsTaughtSpringTerm] = useState(false);
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
    padding: '8px 16px',
    color: theme.palette.text.primary,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      fontWeight: 'bold',
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
    return shorter.every(part => longer.some(longPart => longPart.includes(part)));
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

  // Custom styled Tabs component
  const StyledTabs = styled(Tabs)(({ theme }) => ({
    minHeight: 'auto',
    '& .MuiTabs-indicator': {
      display: 'none',
    },
  }));

  const CourseDescriptionSection = () => {
    const hasValidMetrics = course?.metrics && (
      course.metrics.difficulty_score > 0 ||
      course.metrics.quality_score > 0 ||
      course.metrics.sentiment_score > 0 ||
      course.metrics.workload_score > 0
    );
  
    return (
      <Box sx={{ padding: '20px' }}>
        {/* 1. Update Typography color for header */}
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            color: headerTextColor, // Changed from '#1D1D1F' to dynamic variable
          }}
        >
          College Description
        </Typography>
  
        {/* 2. Update Typography color for description */}
        <Typography
          variant="body1"
          sx={{ 
            fontSize: '0.95rem', 
            color: textColor,         // Changed from 'text.primary' to dynamic variable
            textAlign: 'left', 
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}
          dangerouslySetInnerHTML={{ __html: courseDescription }}
        />
  
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          marginBottom: '1rem'
        }}>
          {/* 3. Update Typography color for AI Summary header */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: headerTextColor, // Changed from '#1D1D1F' to dynamic variable
            }}
          >
            AI Summary of Reviews
          </Typography>
  
          {/* 4. Update Tooltip Background and Text Colors */}
          <Box className="flex-shrink-0 relative group">
            <Sparkles className="w-5 h-5 text-indigo-600 cursor-help" />
            <Box
              sx={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                mb: 2,
                display: 'none',
                width: '200px',
                p: 2,
                bgcolor: tooltipBgColor,          // Changed from 'bg-white' to dynamic variable
                color: tooltipTextColor,          // Changed from 'text-gray-600' to dynamic variable
                borderRadius: '8px',
                boxShadow: 3,
                textAlign: 'center',
                fontSize: '0.875rem',
                border: darkMode ? '1px solid #444444' : '1px solid #e9ecef', // Optional: Add border based on darkMode
                '& .MuiBox-root': {
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '0',
                  height: '0',
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${tooltipBgColor}`, // Triangle arrow matching tooltip background
                },
                '.group:hover &': {
                  display: 'block',
                },
              }}
            >
              AI-generated summary based on student reviews
              <Box />
            </Box>
          </Box>
        </Box>
  
        {/* 5. Update Summary Typography and Box */}
        {course?.summary ? (
          <Typography
            variant="body1"
            sx={{
              fontSize: '0.95rem',
              color: textColor,                   // Changed from 'text.primary' to dynamic variable
              textAlign: 'left',
              lineHeight: '1.6',
              padding: '1rem',
              backgroundColor: paperBgColor,      // Changed from '#f8f9fa' to dynamic variable
              borderRadius: '8px',
              border: darkMode ? '1px solid #444444' : '1px solid #e9ecef', // Changed from '#e9ecef' to dynamic border
            }}
          >
            {course.summary}
          </Typography>
        ) : (
          <Box
            sx={{
              padding: '1rem',
              backgroundColor: paperBgColor,      // Changed from '#f8f9fa' to dynamic variable
              borderRadius: '8px',
              border: darkMode ? '1px solid #444444' : '1px solid #e9ecef', // Changed from '#e9ecef' to dynamic border
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: '0.95rem',
                color: darkMode ? '#FFFFFF' : '#8E8E93', // Changed from 'text.secondary' to dynamic color
                fontStyle: 'italic'
              }}
            >
              Not enough data to generate an AI summary. This will be available once more students review the course.
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      case 3:
        // Input Data tab content
        return (
          <Box sx={{ padding: '20px'  }}>
            <Typography variant="h6" gutterBottom>
              Input Course Data
            </Typography>
            <CourseInputDataForm courseId={courseId} allProfessors={allProfessors} />
          </Box>
        );
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
  
        setReviews(reviewsArray);
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
    
    reviews.forEach(review => {
      const { instructor, review: reviewText } = review;
      
      // More flexible regex to match term patterns in various formats
      // Look for patterns like "21W with", "21W:", "W21 with", or just "21W" at the start of review
      const termPatterns = [
        /^(\d{2}[WSXF])\s+with/i,  // "21W with"
        /^(\d{2}[WSXF]):/i,        // "21W:"
        /^([WSXF]\d{2})\s+with/i,  // "W21 with"
        /^(\d{2}[WSXF])/i          // Just "21W" at start
      ];
      
      let termCode = null;
      
      // Try each pattern until we find a match
      for (const pattern of termPatterns) {
        const match = reviewText.match(pattern);
        if (match && match[1]) {
          // Standardize format to YYT (e.g., 21W)
          if (match[1].match(/^[WSXF]\d{2}/)) {
            // If format is T21, convert to 21T
            const term = match[1].charAt(0);
            const year = match[1].substring(1);
            termCode = year + term;
          } else {
            termCode = match[1];
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
        console.log(`Extracted term ${termCode} for professor ${instructor}`);
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
    
    winterInstructors.forEach(instructor => {
      if (!professorTerms[instructor]) {
        professorTerms[instructor] = [];
      }
      
      const winterTerm = currentYear + 'W';
      if (!professorTerms[instructor].includes(winterTerm)) {
        professorTerms[instructor].unshift(winterTerm);
      }
    });
    
    springInstructors.forEach(instructor => {
      if (!professorTerms[instructor]) {
        professorTerms[instructor] = [];
      }
      
      const springTerm = currentYear + 'S';
      if (!professorTerms[instructor].includes(springTerm)) {
        professorTerms[instructor].unshift(springTerm);
      }
    });
    
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
  
  // NOTE: There may be some hardcoded term values (like W25, 25X) in the UI components
  // These should be manually updated to match the new format (25W, 25X) if necessary
  
  // Render term chip with appropriate styling based on term
  const renderTermChip = (termCode, darkMode) => {
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
      // Default to no specific styling if format is unknown
      term = 'U'; // Unknown
    }
    
    // Define color schemes for each term
    let colors = {
      bg: '',
      border: '',
      text: ''
    };
    
    switch (term) {
      case 'W': // Winter - Blue
        colors = {
          bg: darkMode ? '#2C3E50' : '#E0F7FF',
          border: darkMode ? '#4A6572' : '#B3E5FC',
          text: darkMode ? '#B3E5FC' : '#0277BD'
        };
        break;
      case 'S': // Spring - Yellow
        colors = {
          bg: darkMode ? '#4D3C14' : '#FFF8E1',
          border: darkMode ? '#6D5B24' : '#FFE082',
          text: darkMode ? '#FFE082' : '#F57F17'
        };
        break;
      case 'X': // Summer - Green
        colors = {
          bg: darkMode ? '#1B5E20' : '#E8F5E9',
          border: darkMode ? '#388E3C' : '#A5D6A7',
          text: darkMode ? '#A5D6A7' : '#2E7D32'
        };
        break;
      case 'F': // Fall - Orange/Red
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
          const courseNumber = courseNumberMatch[0].replace(/^0+/, '');
          console.log("fetching current instructors")
          try {
            // Check Winter Term
            const winterTimetableRef = collection(db, 'winterTimetable');
            console.log("deptCode:", deptCode, "courseNumber:", courseNumber);
            const winterQuery = query(winterTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumber));
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
            const springQuery = query(springTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumber));
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
            
            console.log("Matching instructors:", instructors);

            setIsTaughtCurrentTerm(winterFound);
            setIsTaughtSpringTerm(springFound);
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
  
          // Extract department code and course number from courseId
  
          if (deptCodeMatch && courseNumberMatch) {
            const deptCode = deptCodeMatch[0];
            const courseNumber = courseNumberMatch[0];
            if (deptCode && courseNumber) {
              console.log("Department:", deptCode, "Course Number:", courseNumber);
            }
            else {
              console.log("errorsdfasdf;c")
            }
            const response = await fetch(`${API_URL}/fetch-text?subj=${deptCode}&numb=${courseNumber}`);
            console.log("deptCode:", deptCode, "courseNumber:", courseNumber);
            
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

        // Find instructors who teach in both terms
        const bothTermsInstructors = winterInstructors.filter(instructor => 
          springInstructors.includes(instructor)
        );

        setCurrentInstructors([...winterInstructors, ...springInstructors]);
        setWinterInstructors(winterInstructors);
        setSpringInstructors(springInstructors);
        setBothTermsInstructors(bothTermsInstructors);
        setIsTaughtCurrentTerm(winterFound);
        setIsTaughtSpringTerm(springFound);
        console.log("Current instructors:", [...winterInstructors, ...springInstructors]);
        console.log("Winter instructors:", winterInstructors);
        console.log("Spring instructors:", springInstructors);
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
          const instructorsToAdd = [...winterInstructors, ...springInstructors].filter(instructor => 
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
          [...winterInstructors, ...springInstructors].forEach(instructor => {
            newReviewsData[instructor] = [];
          });
          await setDoc(reviewsRef, newReviewsData);
          console.log("Created new reviews document with instructors:", [...winterInstructors, ...springInstructors]);
        }

        setIsTaughtCurrentTerm([...winterInstructors, ...springInstructors].length > 0);
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
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%' }}
      >
        <Box
        sx={{
          my: 3,
          background: darkMode
            ? 'linear-gradient(to right, rgba(30, 30, 30, 0.8), rgba(50, 50, 50, 0.8))' // Dark mode background
            : 'linear-gradient(to right, rgba(238, 242, 255, 0.8), rgba(245, 243, 255, 0.8))', // Light mode background
          borderRadius: '12px',
          overflow: 'hidden',
          border: darkMode
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(99, 102, 241, 0.1)',
          boxShadow: darkMode
            ? '0 4px 6px -1px rgba(255, 255, 255, 0.05), 0 2px 4px -1px rgba(255, 255, 255, 0.03)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: darkMode
              ? '0 6px 12px -2px rgba(255, 255, 255, 0.08), 0 3px 6px -2px rgba(255, 255, 255, 0.05)'
              : '0 6px 12px -2px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      >
          <ListItem sx={{ p: 3, alignItems: 'flex-start' }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    width: '4px',
                    height: '24px',
                    bgcolor: darkMode ? '#4CAF50' : '#00693E', // Example: Lighter green in dark mode
                    borderRadius: '4px',
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    color: textColor, // Use dynamic text color
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    fontSize: '1rem',
                  }}
                >
                  {prefix}
                </Typography>
              </Box>
              <Typography
                component="p"
                sx={{
                  color: textColor, // Use dynamic text color
                  pl: '28px',
                  lineHeight: 1.6,
                  fontSize: '0.95rem',
                }}
              >
                {rest}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 2,
                  pl: '28px',
                  gap: 2,
                }}
              >
                <IconButton
                  onClick={handleLike}
                  sx={{
                    color: hasLiked ? '#007AFF' : '#8E8E93',
                    padding: '6px',
                  }}
                >
                  <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '1.2rem',
                        color: hasLiked ? '#007AFF' : (darkMode ? '#FFFFFF' : '#8E8E93'), // Dynamic color based on state and theme
                      }}
                    >
                      🔥
                    </Typography>

                </IconButton>
                <Typography variant="body2" sx={{ color: '#8E8E93' }}>
                  {likeCount}
                </Typography>
                <Button
                  onClick={toggleReplies}
                  startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
                  sx={{ 
                    color: showReplies ? (darkMode ? '#E0E0E0' : '#555555') : '#8E8E93',
                    backgroundColor: showReplies ? (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)') : 'transparent',
                    textTransform: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: showReplies ? 600 : 400,
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
                  pl: 4, 
                  pr: 2,
                  pb: 2,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: '40px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
                        left: '-16px',
                        top: '12px',
                        width: '12px',
                        height: '2px',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: darkMode ? 'rgba(42, 42, 42, 0.7)' : 'rgba(249, 249, 249, 0.7)',
                        borderRadius: '8px',
                        p: 2,
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.8)' : 'rgba(240, 240, 240, 0.8)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography
                          component="span"
                          sx={{ 
                            color: darkMode ? '#909090' : '#8E8E93', 
                            fontSize: '0.75rem' 
                          }}
                        >
                          {reply && reply.timestamp ? new Date(reply.timestamp).toLocaleString() : ''}
                        </Typography>
                      </Box>
                      <Typography
                        component="p"
                        sx={{ 
                          color: textColor, 
                          fontSize: '0.9rem',
                          lineHeight: 1.5
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
                        left: '-16px',
                        top: '12px',
                        width: '12px',
                        height: '2px',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }
                    }}
                  >
                    <Button
                      sx={{
                        color: darkMode ? '#007AFF' : '#0056b3',
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: darkMode ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 86, 179, 0.1)',
                        }
                      }}
                    >
                      Continue this thread
                    </Button>
                  </Box>
                )}
                <Box sx={{ mt: 2, ml: 3 }}>
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
                    textColor={textColor}
                    backgroundColor={darkMode ? 'rgba(42, 42, 42, 0.7)' : 'rgba(249, 249, 249, 0.7)'}
                    buttonColor={darkMode ? '#007AFF' : '#007AFF'}
                    buttonHoverColor={darkMode ? '#0056b3' : '#0056b3'}
                    inputBgColor={darkMode ? '#333333' : '#FFFFFF'}
                    inputBorderColor={darkMode ? '#555555' : '#E0E0E0'}
                    inputTextColor={textColor}
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
                <Typography
                  variant="h6"
                  sx={{
                    marginTop: '20px',
                    color: textColor, // Use dynamic text color
                    textAlign: 'left',
                    fontWeight: 600,
                  }}
                >
                  {item.instructor}
                </Typography>
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
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <Button
            key={i}
            onClick={() => handleChangePage(i)}
            disabled={currentPage === i}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === i ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === i ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            {i}
          </Button>
        );
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(
            <Button
              key={i}
              onClick={() => handleChangePage(i)}
              disabled={currentPage === i}
              sx={{
                color: '#fff',
                backgroundColor: currentPage === i ? '#571CE0' : '#A074E8',
                '&:hover': {
                  backgroundColor: currentPage === i ? '#7E55CC' : '#7E55CC',
                },
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '0 2px',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
              }}
            >
              {i}
            </Button>
          );
        }
        pages.push(
          <Button key="ellipsis" disabled sx={{ color: '#fff', margin: '0 2px' }}>
            ...
          </Button>
        );
        pages.push(
          <Button
            key={totalPages}
            onClick={() => handleChangePage(totalPages)}
            disabled={currentPage === totalPages}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === totalPages ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === totalPages ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            {totalPages}
          </Button>
        );
      } else if (currentPage > totalPages - 3) {
        pages.push(
          <Button
            key={1}
            onClick={() => handleChangePage(1)}
            disabled={currentPage === 1}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === 1 ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === 1 ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            1
          </Button>
        );
        pages.push(
          <Button key="ellipsis" disabled sx={{ color: '#fff', margin: '0 2px' }}>
            ...
          </Button>
        );
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(
            <Button
              key={i}
              onClick={() => handleChangePage(i)}
              disabled={currentPage === i}
              sx={{
                color: '#fff',
                backgroundColor: currentPage === i ? '#571CE0' : '#A074E8',
                '&:hover': {
                  backgroundColor: currentPage === i ? '#7E55CC' : '#7E55CC',
                },
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '0 2px',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
              }}
            >
              {i}
            </Button>
          );
        }
      } else {
        pages.push(
          <Button
            key={1}
            onClick={() => handleChangePage(1)}
            disabled={currentPage === 1}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === 1 ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === 1 ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            1
          </Button>
        );
        pages.push(
          <Button key="ellipsis1" disabled sx={{ color: '#fff', margin: '0 2px' }}>
            ...
          </Button>
        );
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(
            <Button
              key={i}
              onClick={() => handleChangePage(i)}
              disabled={currentPage === i}
              sx={{
                color: '#fff',
                backgroundColor: currentPage === i ? '#571CE0' : '#A074E8',
                '&:hover': {
                  backgroundColor: currentPage === i ? '#7E55CC' : '#7E55CC',
                },
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '0 2px',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
              }}
            >
              {i}
            </Button>
          );
        }
        pages.push(
          <Button key="ellipsis2" disabled sx={{ color: '#fff', margin: '0 2px' }}>
            ...
          </Button>
        );
        pages.push(
          <Button
            key={totalPages}
            onClick={() => handleChangePage(totalPages)}
            disabled={currentPage === totalPages}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === totalPages ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === totalPages ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
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
    
    // If less than 50% of professors have terms, try manual extraction
    if (hasTerms / totalProfessors < 0.5 && reviews.length > 0) {
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
              
              // Look for season words near the year
              Object.entries(termWords).forEach(([word, code]) => {
                if (text.toLowerCase().includes(word)) {
                  terms.add(year + code);
                }
              });
            });
          }
          
          // Also look for explicit term codes like 19F, 20W, etc.
          const termCodeMatches = text.match(/\b(0\d|1\d|2[0-4])[WSXF]\b/gi);
          if (termCodeMatches) {
            termCodeMatches.forEach(match => {
              terms.add(match.toUpperCase());
            });
          }
        });
        
        // Update the professor's terms if we found any
        if (terms.size > 0) {
          updatedTerms[professor] = Array.from(terms).sort(
            (a, b) => getTermValue(b) - getTermValue(a)
          );
          console.log(`Manually extracted ${terms.size} terms for ${professor}`);
        }
      });
      
      // Update the state if we found new terms
      if (JSON.stringify(updatedTerms) !== JSON.stringify(professorTerms)) {
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
    padding: 4,
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
        alignItems: 'center',
        marginBottom: 3,
        justifyContent: 'space-between',

      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography
        variant="h4"
        gutterBottom
        textAlign="left"
        sx={{
          fontWeight: 600,
          fontSize: '2rem',
          marginBottom: 0,
          color: headerTextColor, // Use dynamic header text color
        }}
>
          {courseName}
        </Typography>
        {(isTaughtCurrentTerm || isTaughtSpringTerm) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: '2rem',
              marginLeft: 2,
              gap: '8px', // Add gap between tags
            }}
          >
            {isTaughtCurrentTerm && (
              <Tooltip title="This course is offered in W25" arrow placement="top">
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
                      color: darkMode ? '#B3E5FC' : '#0277BD', // Winter blue text
                    }}
                  >
                    25W
                  </Typography>
                </Box>
              </Tooltip>
            )}
            
            {isTaughtSpringTerm && (
              <Tooltip title="This course is offered in X25" arrow placement="top">
                <Box
                  sx={{
                    backgroundColor: darkMode ? '#1B5E20' : '#E8F5E9', // Spring green color
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    border: darkMode ? '1px solid #388E3C' : '1px solid #A5D6A7',
                    transition: 'all 0.2s ease',
                    cursor: 'help',
                    '&:hover': {
                      backgroundColor: darkMode ? '#2E7D32' : '#A5D6A7',
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
                      color: darkMode ? '#A5D6A7' : '#2E7D32', // Spring green text
                    }}
                  >
                    25X
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <StyledTabs value={tabValue} onChange={handleTabChange}>
          <StyledTab icon={<AutoAwesomeIcon />} label="Description" />
          <StyledTab icon={<EqualizerIcon />} label="Medians" />
          <StyledTab icon={<QueryStatsIcon />} label="Course Metrics" />
          {isBetaUser && (
            <StyledTab icon={<ScienceIcon />} label="Beta" />
          )}
        </StyledTabs>
        <Tooltip
          title={pinned ? 'Unpin Course' : 'Pin course on your Profile'}
        >
          <IconButton
  onClick={handlePinCourse}
  sx={{
    color: pinned ? '#007AFF' : (darkMode ? '#FFFFFF' : '#8E8E93'), // Blue if pinned, white or gray otherwise
    backgroundColor: darkMode ? (pinned ? '#007AFF' : '#1C1F43') : 'transparent', // Optional: Add background for better visibility
    '&:hover': {
      backgroundColor: darkMode ? (pinned ? '#0066D6' : '#24273c') : '#E0E0E0', // Darker shade on hover
    },
    marginLeft: 1,
    padding: '6px', // Consistent padding
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
        
        <Typography
  variant="h5"
  gutterBottom
  sx={{ fontWeight: 600, color: headerTextColor, marginTop: 4 }}
>
  Professors
</Typography>

<TableContainer
  component={Paper}
  sx={{
    backgroundColor: paperBgColor,              // Dynamic background color
    marginTop: '20px',
    borderRadius: '12px',
    boxShadow: 'none',
    border: darkMode ? '1px solid #444444' : '1px solid #D1D1D6', // Dynamic border color
  }}
>
  <Table>
    <TableHead>
      <TableRow>
              <TableCell
          sx={{
            color: textColor,              // Use dynamic text color
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '12px 16px',
            backgroundColor: tableHeaderBgColor, // Optional: Add background for headers
          }}
        >
          Name
        </TableCell>
        <TableCell
          sx={{
            color: textColor,              // Use dynamic text color
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '12px 16px',
            backgroundColor: tableHeaderBgColor, // Optional: Add background for headers
          }}
        >
          Reviews
        </TableCell>
        <TableCell
          sx={{
            color: textColor,
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '12px 16px',
            backgroundColor: tableHeaderBgColor,
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
          const isBothTerms = bothTermsInstructors.includes(professor);
          const reviewCount = reviews.filter(
            (review) => review.instructor === professor
          ).length;
          return (
            <TableRow
              key={index}
              component={Link}
              to={`/departments/${department}/courses/${courseId}/professors/${professor}`}
              sx={{
                backgroundColor: isBothTerms
                  ? (darkMode ? '#2C2F73' : '#D0E0FF') // Highlighted color for both terms
                  : isCurrent
                    ? (darkMode ? '#1C1F43' : '#E5F0FF') // Dark mode or light blue
                    : (index % 2 === 0 ? tableRowEvenBgColor : tableRowOddBgColor),
                '&:hover': { backgroundColor: darkMode ? '#2a2a2a' : '#E5E5EA' }, // Darker on hover for dark mode
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <TableCell
                sx={{
                  color: textColor,              // Use dynamic text color
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: isBothTerms ? 700 : (isCurrent ? 600 : 400),
                }}
              >
                {professor}
              </TableCell>
              <TableCell
                sx={{
                  color: textColor,              // Use dynamic text color
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 400,
                }}
              >
                {reviewCount}
              </TableCell>
              <TableCell
                sx={{
                  color: textColor,
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: isBothTerms ? 700 : 400,
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
                          ml: 1 
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
                        }}
                      >
                        25W
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        backgroundColor: darkMode ? '#1B5E20' : '#E8F5E9',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: darkMode ? '1px solid #388E3C' : '1px solid #A5D6A7',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: darkMode ? '#A5D6A7' : '#2E7D32',
                        }}
                      >
                        25X
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
                      }}
                    >
                      25W
                    </Typography>
                  </Box>
                ) : isSpring ? (
                  <Box
                    sx={{
                      backgroundColor: darkMode ? '#1B5E20' : '#E8F5E9',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: darkMode ? '1px solid #388E3C' : '1px solid #A5D6A7',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: darkMode ? '#A5D6A7' : '#2E7D32',
                      }}
                    >
                      25X
                    </Typography>
                  </Box>
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.85rem', 
                      color: darkMode ? '#888888' : '#999999',
                      fontStyle: 'italic' 
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
              variant="text"
              onClick={() => setShowAllProfessors(!showAllProfessors)}
              sx={{
                color: darkMode ? '#007AFF' : '#007AFF',
                '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
              }}
            >
              {showAllProfessors ? 'Show Less' : 'Show All'}
            </Button>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</TableContainer>

<Box
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '-10px',
    marginTop: '60px',
  }}
>
<Typography
  variant="h5"
  gutterBottom
  sx={{ fontWeight: 600, color: headerTextColor }}
>
  Reviews
</Typography>

<FormControl
  size="small"
  sx={{
    minWidth: 150,
    backgroundColor: searchBgColor,                  // Dynamic background color
    borderRadius: '8px',
    border: darkMode ? '1px solid #444444' : '1px solid #D1D1D6', // Dynamic border color
  }}
>
  <InputLabel
    id="select-professor-label"
    sx={{ fontWeight: 400, color: darkMode ? '#FFFFFF' : '#00693E' }} // Dynamic text color
  >
    Professor
  </InputLabel>
  <Select
    labelId="select-professor-label"
    value={selectedProfessor}
    onChange={handleProfessorFilterChange}
    label="Professor"
    sx={{
      fontWeight: 400,
      color: textColor, // Ensure selected text color is dynamic
      backgroundColor: searchBgColor, // Match background
      '& .MuiSelect-select': {
        padding: '8px 12px',
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: darkMode ? '#444444' : '#D1D1D6',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: darkMode ? '#555555' : '#A1A1A6',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#571CE0', // Primary color on focus
      },
    }}
  >
    <MenuItem value="">
      <em>All</em>
    </MenuItem>
    {uniqueProfessors.map((professor, index) => (
      <MenuItem key={index} value={professor} sx={{ fontWeight: 400 }}>
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
    marginTop: '20px',
    width: '100%',
    gap: '16px', // Increase space between elements for a more airy feel
  }}
>
  <Tooltip title="Previous Page" placement="top">
    <span>
      <IconButton
        onClick={() => handleChangePage(currentPage - 1)}
        disabled={currentPage === 1}
        sx={{
          color: darkMode ? '#FFFFFF' : '#000000', // Dynamic text color
          backgroundColor: darkMode 
            ? (currentPage === 1 ? '#1C1F43' : '#1C1F43') 
            : (currentPage === 1 ? '#F5F5F7' : '#F5F5F7'), // Dark mode backgrounds
          borderRadius: '12px',
          padding: '12px',
          border: darkMode ? '1px solid #444444' : '1px solid #D1D1D6', // Dynamic border
          '&:hover': {
            backgroundColor: darkMode 
              ? (currentPage === 1 ? '#24273c' : '#24273c') 
              : (currentPage === 1 ? '#F5F5F7' : '#E0E0E0'), // Darker shade on hover
          },
          transition: 'background-color 0.3s ease',
        }}
      >
        <ArrowBack sx={{ fontSize: '20px' }} />
      </IconButton>
    </span>
  </Tooltip>

  <ButtonGroup
  variant="text"
  sx={{
    '& .MuiButtonGroup-grouped': {
      minWidth: '40px',
      height: '40px',
      borderRadius: '12px',
      backgroundColor: darkMode ? '#1C1F43' : '#F5F5F7', // Dynamic background color
      color: darkMode ? '#FFFFFF' : '#000000',          // Dynamic text color
      border: darkMode ? '1px solid #444444' : '1px solid #D1D1D6', // Dynamic border
      margin: '0 2px',
      fontSize: '16px',
      '&:hover': {
        backgroundColor: darkMode ? '#24273c' : '#E0E0E0', // Darker shade on hover
      },
      '&.Mui-selected': {
        backgroundColor: '#007AFF', // Assuming selected color remains the same
        color: '#fff',
        '&:hover': {
          backgroundColor: '#0066CC',
        },
      },
    },
  }}
>
  {renderPageButtons()}
</ButtonGroup>


  <Tooltip title="Next Page" placement="top">
    <span>
            <IconButton
          onClick={() => handleChangePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          sx={{
            color: darkMode ? '#FFFFFF' : '#000000', // Dynamic text color
            backgroundColor: darkMode 
              ? (currentPage === totalPages ? '#1C1F43' : '#1C1F43') 
              : (currentPage === totalPages ? '#F5F5F7' : '#F5F5F7'), // Dark mode backgrounds
            borderRadius: '12px',
            padding: '12px',
            border: darkMode ? '1px solid #444444' : '1px solid #D1D1D6', // Dynamic border
            '&:hover': {
              backgroundColor: darkMode 
                ? (currentPage === totalPages ? '#24273c' : '#24273c') 
                : (currentPage === totalPages ? '#F5F5F7' : '#E0E0E0'), // Darker shade on hover
            },
            transition: 'background-color 0.3s ease',
          }}
        >
          <ArrowForward sx={{ fontSize: '20px' }} />
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