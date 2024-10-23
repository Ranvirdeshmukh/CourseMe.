import React, { useState, useEffect, useCallback } from 'react';
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


const CourseReviewsPage = () => {
  const [isTaughtCurrentTerm, setIsTaughtCurrentTerm] = useState(false);
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
  const [tabValue, setTabValue] = useState(0);
  const [reviewInstructors, setReviewInstructors] = useState([]);
  const [allProfessors, setAllProfessors] = useState([]);
  const [professorInput, setProfessorInput] = useState('');
  const gradeToNum = {
    'A': 11, 'A-': 10, 'A/A-': 10.5,
    'B+': 9, 'A-/B+': 9.5, 'B': 8, 'B+/B': 8.5, 'B-': 7, 'B/B-': 7.5,
    'C+': 6, 'B-/C+': 6.5, 'C': 5, 'C/C+': 5.5, 'C-': 4, 'C/C-': 4.5,
    'D+': 3, 'C-/D+': 3.5, 'D': 2, 'D+/D': 2.5, 'D-': 1, 'D/D-': 1.5,
    'F': 0
  };
  const numToGrade = Object.fromEntries(Object.entries(gradeToNum).map(([k, v]) => [v, k]));


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
  
  const handleProfessorInputChange = (event, newInputValue) => {
    setProfessorInput(newInputValue);
  };

  const CourseMetricsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 9l-5 5-2-2-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ReportCardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="2"/>
      <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2"/>
      <line x1="7" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
  
  // Custom styled Tabs component
  const StyledTabs = styled(Tabs)(({ theme }) => ({
    minHeight: 'auto',
    '& .MuiTabs-indicator': {
      display: 'none',
    },
  }));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        // Description tab content
        return (
          <Box sx={{ padding: '20px' }}>
            <Typography
              variant="body1"
              sx={{ fontSize: '0.95rem', color: 'text.primary', textAlign: 'left', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: courseDescription }}
            />
          </Box>
        );
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
              <InteractiveGradeScale value={newGradeData.Grade} onChange={handleGradeChange} />
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
      case 2:
        // Input Data tab content
        return (
          <Box sx={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Input Course Data
            </Typography>
            <CourseInputDataForm courseId={courseId} allProfessors={allProfessors} />
          </Box>
        );
      case 3:
        // Course Metrics tab content
        return (
          <Box sx={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>
              Course Metrics
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ width: '60%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Difficulty
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={60}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#ff9800',
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Moderately Difficult
                </Typography>
  
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Easiness
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={40}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50',
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Somewhat Easy
                </Typography>
  
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Overall Quality
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#2196f3',
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Good Quality
                </Typography>
              </Box>
  
              {course && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: '20px',
                    backgroundColor: '#FFF',
                    border: '2px solid #571CE0',
                    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
                    padding: '20px',
                    width: '200px',
                  }}
                >
                  {/* Layup voting */}
                  <Box sx={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Tooltip title="Upvote Layup">
                      <IconButton
                        onClick={() => handleVote('upvote')}
                        sx={{ color: vote === 'upvote' ? '#571CE0' : 'grey' }}
                      >
                        <ArrowUpward />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="h6" sx={{ color: '#571CE0', fontWeight: 700 }}>
                      {course.layup || 0}
                    </Typography>
                    <Tooltip title="Downvote Layup">
                      <IconButton
                        onClick={() => handleVote('downvote')}
                        sx={{ color: vote === 'downvote' ? '#571CE0' : 'grey' }}
                      >
                        <ArrowDownward />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: '#571CE0', fontWeight: 500 }}>
                      Is it a layup?
                    </Typography>
                  </Box>
  
                  {/* Quality voting */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Tooltip title="Upvote Quality">
                      <IconButton
                        onClick={() => handleQualityVote('upvote')}
                        sx={{ color: vote === 'upvote' ? '#571CE0' : 'grey' }}
                      >
                        <ArrowUpward />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="h6" sx={{ color: '#571CE0', fontWeight: 700 }}>
                      {quality || 0}
                    </Typography>
                    <Tooltip title="Downvote Quality">
                      <IconButton
                        onClick={() => handleQualityVote('downvote')}
                        sx={{ color: vote === 'downvote' ? '#571CE0' : 'grey' }}
                      >
                        <ArrowDownward />
                      </IconButton>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: '#571CE0', fontWeight: 500 }}>
                      Is it a good class?
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };
  

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
      } else {
        setError('No reviews found for this course.');
        setAllProfessors([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to fetch reviews.');
      setAllProfessors([]);
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
    const year = parseInt(termCode.slice(0, 2), 10);
    const term = termCode.slice(2);
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
            const fallTimetableRef = collection(db, 'fallTimetable');
            console.log("deptCode:", deptCode, "courseNumber:", courseNumber);
            const q = query(fallTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumber));
            const querySnapshot = await getDocs(q);
            
            let found = false;
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.Instructor) {
                found = true;
                if (!instructors.includes(data.Instructor)) {
                  instructors.push(data.Instructor);
                }
              }
            });
            console.log("Matching instructors:", instructors);

            setIsTaughtCurrentTerm(found);
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

        const fallTimetableRef = collection(db, 'fallTimetable');
        const q = query(fallTimetableRef, where("Subj", "==", deptCode), where("Num", "==", courseNumber));
        const querySnapshot = await getDocs(q);
        
        let instructors = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.Instructor && !instructors.includes(data.Instructor)) {
            instructors.push(data.Instructor);
          }
        });

        setCurrentInstructors(instructors);
        console.log("Current instructors:", instructors);
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
          const instructorsToAdd = instructors.filter(instructor => 
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
          instructors.forEach(instructor => {
            newReviewsData[instructor] = [];
          });
          await setDoc(reviewsRef, newReviewsData);
          console.log("Created new reviews document with instructors:", instructors);
        }

        setIsTaughtCurrentTerm(instructors.length > 0);
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
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review.reviewIndex === reviewIndex
          ? { ...review, replies: Array.isArray(review.replies) ? [...review.replies, newReply] : [newReply] }
          : review
      )
    );
  };

  const ReviewItem = ({ instructor, prefix, rest, courseId, reviewIndex, onReplyAdded }) => {
    const { ref, inView } = useInView({ threshold: 0.1 });
    const { currentUser } = useAuth();
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [replyCount, setReplyCount] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

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
        setReplies(fetchedReplies);
        setReplyCount(fetchedReplies.length);
      } catch (error) {
        console.error('Error fetching replies:', error);
        setError('Failed to fetch replies.');
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ margin: '20px 0', borderRadius: '12px', overflow: 'hidden' }}
      >
        <ListItem
          sx={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            fontFamily: 'SF Pro Display, sans-serif',
          }}
        >
          <ListItemText
            primary={
              <>
                <Typography component="span" sx={{ color: '#000', fontWeight: 600, fontSize: '1rem' }}>
                  {prefix}
                </Typography>{' '}
                <Typography component="span" sx={{ color: '#333', fontSize: '0.9rem' }}>
                  {rest}
                </Typography>
              </>
            }
          />
          <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
            <IconButton onClick={handleLike} sx={{ color: hasLiked ? '#571CE0' : '#999' }}>
              <Typography variant="body2" sx={{ fontSize: '1.5rem' }}>
                🔥
              </Typography>
              <Typography variant="body2" sx={{ marginLeft: '5px', fontWeight: 500, color: '#666' }}>
                {likeCount}
              </Typography>
            </IconButton>
            <IconButton onClick={toggleReplies} sx={{ color: '#571CE0' }}>
              <ChatBubbleOutlineIcon />
              <Typography variant="body2" sx={{ marginLeft: '5px', fontWeight: 500, color: '#666' }}>
                {replyCount}
              </Typography>
            </IconButton>
          </Box>
        </ListItem>
        {showReplies && (
          <>
            <List sx={{ pl: 4 }}>
              {replies.map((reply, index) => (
                <ListItem key={index} sx={{ backgroundColor: '#f7f7f7', borderRadius: '8px', marginTop: '10px' }}>
                  <ListItemText
                    primary={
                      <>
                        <Typography
                          component="span"
                          sx={{ color: '#000', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          Reply:
                        </Typography>{' '}
                        <Typography component="span" sx={{ color: '#333', fontSize: '0.8rem' }}>
                          {reply.reply}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ color: '#999', fontSize: '0.7rem', marginLeft: '10px' }}
                        >
                          {new Date(reply.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            <AddReplyForm
              reviewData={{ instructor, reviewIndex }}
              courseId={courseId}
              onReplyAdded={(newReply) => {
                addReplyLocally(reviewIndex, newReply);
                setReplies((prevReplies) => [...prevReplies, newReply]);
                setReplyCount(replyCount + 1);
              }}
            />
          </>
        )}
      </motion.div>
    );
  };

  const renderReviews = () => {
    const filteredReviews = selectedProfessor ? reviews.filter((item) => item.instructor === selectedProfessor) : reviews;
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
          const replies = Array.isArray(item.replies) ? item.replies : [];
  
          return (
            <React.Fragment key={idx}>
              {showInstructor && (
                <Typography variant="h6" sx={{ marginTop: '20px', color: '#1D1D1F', textAlign: 'left', fontWeight: 600 }}>
                  {item.instructor}
                </Typography>
              )}
              <ReviewItem
                key={idx}
                instructor={item.instructor}
                prefix={prefix}
                rest={rest}
                replies={replies}
                courseId={courseId}
                reviewIndex={item.reviewIndex}
                onReplyAdded={fetchReviews}
              />
            </React.Fragment>
          );
        })}
      </List>
    );
  };

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        background: 'linear-gradient(135deg, #F9FAFB 0%, #EEF2FF 100%)',
        color: '#1D1D1F',
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
      backgroundColor: '#FFFFFF',
      color: '#1D1D1F',
      boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
      borderRadius: '16px',
      maxWidth: 1100,
      width: '100%',
    }}
  >
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="h4" 
                gutterBottom 
                textAlign="left" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '2rem',
                  marginBottom: 0, // Remove bottom margin to ensure proper centering
                }}
              >
                {courseName}
              </Typography>
              {isTaughtCurrentTerm && (
                <Tooltip title="Taught this term" placement="right">
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      height: '2rem', // Match the line height of the Typography
                      marginLeft: 3,
                    }}
                  >
                    <Badge
                      badgeContent="24F"
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '1rem',
                          height: '28px',
                          minWidth: '28px',
                          borderRadius: '14px',
                          padding: '0 8px',
                        },
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
              </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StyledTabs value={tabValue} onChange={handleTabChange}>
                <StyledTab icon={<Description />} label="Description" />
                <StyledTab icon={<ReportCardIcon />} label="Medians" />
                {isBetaUser && <StyledTab icon={<CourseMetricsIcon />} label="Input Data" />}
                <StyledTab icon={<CourseMetricsIcon />} label="Course Metrics" />
              </StyledTabs>
              <Tooltip title={pinned ? 'Unpin Course' : 'Pin course on your Profile'}>
                <IconButton onClick={handlePinCourse} sx={{ /* existing styles */ }}>
                  <PushPin sx={{ fontSize: 30 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {renderTabContent()}
        </Card>



        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress sx={{ color: '#571CE0' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ textAlign: 'left' }}>
            {error}
          </Alert>
        ) : reviews.length > 0 ? (
          <>
          {course && (
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
          )}
        
            <Typography variant="h4" gutterBottom textAlign="left" sx={{ marginTop: 4, fontWeight: 700 }}>
              Professors
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: '#fff',
                marginTop: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold', fontSize: '1rem' }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold', fontSize: '1rem' }}>
                      Reviews
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
                  const reviewCount = reviews.filter(review => review.instructor === professor).length;
                  return (
                    <TableRow
                      key={index}
                      component={Link}
                      to={`/departments/${department}/courses/${courseId}/professors/${professor}`}
                      sx={{
                        backgroundColor: isCurrent 
                          ? '#e6f7ff'  // Light blue background for current instructors
                          : index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                        '&:hover': { backgroundColor: '#e0e0e0' },
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          color: '#1D1D1F', 
                          padding: '10px', 
                          textAlign: 'left', 
                          fontWeight: isCurrent ? 700 : 500,
                        }}
                      >
                        {professor}
                      </TableCell>
                      <TableCell sx={{ color: '#1D1D1F', padding: '10px', textAlign: 'left', fontWeight: 500 }}>
                        {reviewCount}
                      </TableCell>
                    </TableRow>
                  );
                })
              }
              {allProfessors.length > 12 && (
                <TableRow>
                  <TableCell colSpan={2} sx={{ textAlign: 'center', padding: '10px' }}>
                    <Button
                      onClick={() => setShowAllProfessors((prev) => !prev)}
                      sx={{ color: '#571CE0', fontWeight: 500 }}
                    >
                      {showAllProfessors ? 'Show Less' : 'More Professors'}
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

              </Table>
            </TableContainer>
            <Legend />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '-10px',
                marginTop: '60px',
              }}
            >
              <Typography variant="h4" gutterBottom textAlign="left" sx={{ fontWeight: 700 }}>
                Reviews
              </Typography>
              <FormControl
                size="small"
                sx={{
                  minWidth: 150,
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              >
                <InputLabel id="select-professor-label" sx={{ fontWeight: 500 }}>
                  Professor
                </InputLabel>
                <Select
                  labelId="select-professor-label"
                  value={selectedProfessor}
                  onChange={handleProfessorChange}
                  label="Professor"
                  sx={{ fontWeight: 500 }}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  {uniqueProfessors.map((professor, index) => (
                    <MenuItem key={index} value={professor} sx={{ fontWeight: 500 }}>
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
          color: '#000', // Apple-style black text
          backgroundColor: currentPage === 1 ? '#F5F5F7' : '#F5F5F7',
          borderRadius: '12px', // Subtle rounding for a more modern look
          padding: '12px',
          border: '1px solid #D1D1D6', // Subtle border
          '&:hover': {
            backgroundColor: currentPage === 1 ? '#F5F5F7' : '#E0E0E0',
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
        minWidth: '40px', // Consistent button size
        height: '40px',
        borderRadius: '12px', // Subtle rounding
        backgroundColor: '#F5F5F7',
        color: '#000',
        border: '1px solid #D1D1D6', // Subtle border
        margin: '0 2px',
        fontSize: '16px',
        '&:hover': {
          backgroundColor: '#E0E0E0',
        },
        '&.Mui-selected': {
          backgroundColor: '#007AFF', // Apple blue for selected page
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
          color: '#000',
          backgroundColor: currentPage === totalPages ? '#F5F5F7' : '#F5F5F7',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid #D1D1D6',
          '&:hover': {
            backgroundColor: currentPage === totalPages ? '#F5F5F7' : '#E0E0E0',
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
            <AddReviewForm onReviewAdded={fetchReviews} />
          </Container>
        </Box>
      </Container>
    </Box>
  );
};

export default CourseReviewsPage;