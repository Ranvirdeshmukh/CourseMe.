// src/pages/timetablepages/Timetable.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Box, 
  Container, 
  Alert, 
  Zoom, 
  Fab, 
  Snackbar, 
  useMediaQuery, 
  Button,
  Typography,
  Paper
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import TableChartIcon from '@mui/icons-material/TableChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PrintIcon from '@mui/icons-material/Print';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

import { addToGoogleCalendar } from './googleCalendarLogic';
import { addToAppleCalendar } from './appleCalendarLogic';
import CourseService from '../../services/courseService';
import NotificationService from '../../services/notificationService';
import ProfessorService from '../../services/professorService';
import useCourses from '../../hooks/useCourses';

// Import Components
import FilterSection from './FilterSection';
import TimetableGrid from './TimetableGrid';
import PaginationControls from './PaginationControls';
import MiniSchedulePanel from './MiniSchedulePanel';
import FeatureHighlight from './FeatureHighlight';
import LoadingState from './LoadingState';
import ScheduleVisualization from './ScheduleVisualization';

// Helper function to get the previous terms
const getPreviousTerms = (currentTerm) => {
  // For current term "25S", we want previous 2 terms: ["25W", "24F"]
  const termOrder = ['W', 'S', 'X', 'F'];
  
  // Parse the current term
  const year = parseInt(currentTerm.substring(0, 2));
  const termLetter = currentTerm.substring(2);
  const currentIndex = termOrder.indexOf(termLetter);
  
  if (currentIndex === -1) {
    console.error('Invalid term letter:', termLetter);
    return [];
  }
  
  const previousTerms = [];
  
  // Get exactly the previous 2 terms
  for (let i = 1; i <= 2; i++) {
    let prevIndex = currentIndex - i;
    let prevYear = year;
    
    // Handle year rollover
    if (prevIndex < 0) {
      prevIndex = termOrder.length + prevIndex;
      prevYear = year - 1;
    }
    
    // Format year as 2 digits with leading zero if needed
    const yearStr = prevYear.toString().padStart(2, '0');
    const prevTermStr = `${yearStr}${termOrder[prevIndex]}`;
    previousTerms.push(prevTermStr);
  }
  
  return previousTerms;
};

// Helper function to format term name for display
const formatTermName = (termType) => {
  if (termType === 'summer') {
    return 'Summer 2025';
  } else if (termType === 'fall') {
    return 'Fall 2025';
  }
  return 'Course'; // fallback
};

// Helper function to check if user has enough reviews
const hasEnoughReviews = (reviews = [], gradeSubmissions = [], currentTerm = '25X') => {
  const requiredTerms = getPreviousTerms(currentTerm);
  
  console.log('hasEnoughReviews check:');
  console.log('Required terms:', requiredTerms);
  console.log('Reviews:', reviews);
  console.log('Grade submissions:', gradeSubmissions);
  
  // Count reviews from required terms (trim whitespace for comparison)
  const reviewCount = reviews.filter(review => 
    review && review.term && requiredTerms.includes(review.term.trim())
  ).length;
  
  // Count grade submissions from required terms (trim whitespace for comparison)
  const gradeCount = gradeSubmissions.filter(submission => 
    submission && submission.Term && requiredTerms.includes(submission.Term.trim())
  ).length;
  
  const totalContributions = reviewCount + gradeCount;
  const hasEnough = totalContributions >= 3; // Changed from 3 to 1 for testing
  
  console.log('Review count:', reviewCount);
  console.log('Grade count:', gradeCount);
  console.log('Total contributions:', totalContributions);
  console.log('Has enough?', hasEnough);
  
  return hasEnough;
};

const Timetable = ({ darkMode }) => {
  // UI State
  const [viewMode, setViewMode] = useState('table');
  const [showSelectedCourses, setShowSelectedCourses] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [miniScheduleOpen, setMiniScheduleOpen] = useState(false);
  const [miniScheduleExpanded, setMiniScheduleExpanded] = useState(true);
  const [showFeatureHighlight, setShowFeatureHighlight] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [popupMessageOpen, setPopupMessageOpen] = useState(false);
  const [openPopupMessage, setOpenPopupMessage] = useState(false);
  const [popupMessage, setPopupMessage] = useState({ message: '', type: 'info' });
  const [termType, setTermType] = useState('fall'); // Default to 'fall'
  const [isRefreshingEnrollments, setIsRefreshingEnrollments] = useState(false);
  
  // User data state
  const [userReviews, setUserReviews] = useState([]);
  const [userGradeSubmissions, setUserGradeSubmissions] = useState([]);
  
  // Notification State
  const [isPriorityEligible, setIsPriorityEligible] = useState(false);
  const [notificationPriority, setNotificationPriority] = useState('standard');
  
  // Refs

  
  // Hooks
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');
  const db = getFirestore();
  
  // Custom hooks
  const { 
    courses, 
    filteredCourses, 
    selectedCourses, 
    subjects, 
    loading, 
    error, 
    searchTerm, 
    setSearchTerm, 
    selectedSubject, 
    setSelectedSubject, 
    addCourse, 
    removeCourse, 
    enrollmentDataReady,
    setCourses 
  } = useCourses(termType); // Pass termType to useCourses
  
  // Calculate current term based on termType
  const currentTerm = termType === 'summer' ? '25X' : '25S';
  
  // Calculate if user has unlocked features
  const hasUnlockedFeatures = hasEnoughReviews(userReviews, userGradeSubmissions, currentTerm);
  
  // Pagination
  const classesPerPage = 50;
  const totalPages = Math.ceil(filteredCourses.length / classesPerPage);
  
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * classesPerPage;
    const endIndex = startIndex + classesPerPage;
    return filteredCourses.slice(startIndex, endIndex);
  }, [filteredCourses, currentPage, classesPerPage]);
  
  // Fetch user data for reviews and grade submissions
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setUserReviews([]);
        setUserGradeSubmissions([]);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserReviews(userData.reviews || []);
          setUserGradeSubmissions(userData.gradeSubmissions || []);
          console.log('Fetched user reviews:', userData.reviews || []);
          console.log('Fetched user grade submissions:', userData.gradeSubmissions || []);
        } else {
          console.log('No user document found');
          setUserReviews([]);
          setUserGradeSubmissions([]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserReviews([]);
        setUserGradeSubmissions([]);
      }
    };

    fetchUserData();
  }, [currentUser, db]);
  
  // User notification eligibility
  useEffect(() => {
    if (currentUser) {
      checkPriorityEligibility();
    }
  }, [currentUser]);
  
  const checkPriorityEligibility = async () => {
    if (!currentUser) return;
    
    const isEligible = await NotificationService.checkPriorityEligibility(db, currentUser);
    setIsPriorityEligible(isEligible);
  };
  
  // Feature highlight check
  useEffect(() => {
    const checkFeatureHighlight = async () => {
      try {
        // Get current visit count
        const featureVisitCount = localStorage.getItem('weeklyScheduleFeatureVisits');
        const visitCount = featureVisitCount ? parseInt(featureVisitCount) : 0;
        
        // Show feature if we haven't reached 5 visits yet
        if (visitCount < 9) {
          // Increment and save the visit count
          localStorage.setItem('weeklyScheduleFeatureVisits', (visitCount + 1).toString());
          
          // Wait a bit before showing the highlight so other elements can load
          setTimeout(() => {
            setShowFeatureHighlight(true);
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking feature highlight status:', error);
      }
    };

    checkFeatureHighlight();
  }, []);
  
  // Check for visualization parameter in location state
  useEffect(() => {
    if (location.state?.openVisualization) {
      setTimeout(() => {
        setMiniScheduleOpen(true);
      }, 500);
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  



const handleForceRefreshEnrollments = async () => {
  if (isRefreshingEnrollments) return;
  
  // Don't allow refresh for summer courses
  if (termType === 'summer') {
    setPopupMessage({
      message: "Enrollment data refresh is not available for summer courses",
      type: 'info',
    });
    setOpenPopupMessage(true);
    return;
  }
  
  setIsRefreshingEnrollments(true);
  
  try {
    // Show immediate feedback
    setPopupMessage({
      message: "Refreshing enrollment data...",
      type: 'info',
    });
    setOpenPopupMessage(true);
    
    // Call your course service to refresh enrollment data
    const result = await CourseService.refreshEnrollmentData(db, termType);
    
    if (result.success) {
      // Update the courses with new enrollment data
      setCourses(result.courses);
      
      setPopupMessage({
        message: result.message || "Enrollment data refreshed successfully!",
        type: 'success',
      });
    } else {
      setPopupMessage({
        message: result.message || "Failed to refresh enrollment data",
        type: 'error',
      });
    }
    setOpenPopupMessage(true);
    
  } catch (error) {
    console.error('Error refreshing enrollment data:', error);
    setPopupMessage({
      message: "Error refreshing enrollment data. Please try again.",
      type: 'error',
    });
    setOpenPopupMessage(true);
  } finally {
    setIsRefreshingEnrollments(false);
  }
};
  
  // Handlers
  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };
  
  const handleCourseClick = async (course) => {
    const department = course.subj;
    let courseNumber = CourseService.normalizeCourseNumber(course.num);
    
    const result = await CourseService.fetchCourseData(db, department, courseNumber);
    
    if (result.success) {
      navigate(`/departments/${department}/courses/${result.id}`);
    } else {
      setPopupMessage({
        message: "Could not find detailed course information.",
        type: 'error',
      });
      setOpenPopupMessage(true);
    }
  };
  
  const handleAddCourse = async (course) => {
    const result = await addCourse(course);
    
    setPopupMessage({
      message: result.message,
      type: result.success ? 'success' : 'warning',
    });
    setOpenPopupMessage(true);
  };
  
  const handleRemoveCourse = async (course) => {
    const result = await removeCourse(course);
    
    setPopupMessage({
      message: result.message,
      type: result.success ? 'success' : 'error',
    });
    setOpenPopupMessage(true);
  };
  
  const handleNotifyDrop = async (course) => {
    if (!currentUser) {
      setPopupMessage({
        message: "Please log in to set up notifications.",
        type: 'warning',
      });
      setOpenPopupMessage(true);
      return;
    }
  
    try {
      // If already notified, remove notification
      if (course.isNotified === true) {
        const result = await NotificationService.removeNotification(db, course, currentUser);
        
        if (result.success) {
          // Update courses state
          const updatedCourses = courses.map(c => {
            if (c.documentName === course.documentName) {
              return { ...c, isNotified: false, notificationPriority: null };
            }
            return c;
          });
          setCourses(updatedCourses);
          
          setSnackbarMessage(result.message);
          setSnackbarOpen(true);
        } else {
          alert(result.message);
        }
        return;
      }
      
      // Add notification
      const result = await NotificationService.setNotification(
        db, 
        course, 
        currentUser, 
        notificationPriority, 
        isPriorityEligible
      );
      
      if (result.success) {
        // Update courses state
        const updatedCourses = courses.map(c => {
          if (c.documentName === course.documentName) {
            return { 
              ...c, 
              isNotified: true, 
              notificationPriority: notificationPriority 
            };
          }
          return c;
        });
        setCourses(updatedCourses);
        
        setSnackbarMessage(result.message);
        setSnackbarOpen(true);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
      alert('An error occurred. Please try again.');
    }
  };
  
  const toggleNotificationPriority = (e) => {
    e.stopPropagation();
    
    if (!isPriorityEligible) {
      alert('You need at least 3 reviews to use priority notifications.');
      return;
    }
    
    setNotificationPriority(prev => prev === 'standard' ? 'priority' : 'standard');
  };
  
  const handleAddToCalendar = (course) => {
    addToGoogleCalendar(
      course, 
      () => setSnackbarOpen(true),
      () => setPopupMessageOpen(true),
      setTimeout
    );
  };
  
  const handleAddToAppleCalendar = (course) => {
    addToAppleCalendar(course);
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };
  
  const handlePrint = () => {
    const printContent = document.getElementById('schedule-to-print');
    if (!printContent) return;
    
    const printCSS = `
      <style>
        @media print {
          body { background-color: white; }
          .schedule-print-container { padding: 20px; }
          .schedule-title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 20px;
            text-align: center;
          }
          .schedule-subtitle {
            font-size: 16px;
            margin-bottom: 10px;
            text-align: center;
          }
        }
      </style>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Summer 2025 Schedule</title>
          ${printCSS}
        </head>
        <body>
          <div class="schedule-print-container">
            <div class="schedule-title">Summer 2025 Weekly Schedule</div>
            <div class="schedule-subtitle">Dartmouth College</div>
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  
  const handleOpenMiniSchedule = () => {
    setMiniScheduleOpen(true);
  };
  
  const handleCloseMiniSchedule = () => {
    setMiniScheduleOpen(false);
  };
  
  const toggleMiniScheduleSize = () => {
    setMiniScheduleExpanded(!miniScheduleExpanded);
  };
  
  const handleFeatureHighlightClose = () => {
    setShowFeatureHighlight(false);
    try {
      localStorage.setItem('weeklyScheduleFeatureVisits', '5');
    } catch (error) {
      console.error('Error saving feature highlight status:', error);
    }
  };
  
  const handleFeatureHighlightTryNow = () => {
    handleFeatureHighlightClose();
    handleOpenMiniSchedule();
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handlePopupMessageClose = () => {
    setPopupMessageOpen(false);
  };

  // Handler for adding reviews
  const handleAddReview = () => {
    navigate('/reviews'); // Adjust this path to your review page
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: darkMode
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
          : '#F9F9F9',
        color: darkMode ? '#FFFFFF' : '#333333',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        padding: '40px 20px',
        fontFamily: 'SF Pro Display, sans-serif',
        position: 'relative',
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          padding: '0 20px',
          margin: '0 auto',
          maxWidth: '1600px',
          transition: 'all 0.3s ease',
          paddingRight: miniScheduleOpen ? {xs: '20px', md: miniScheduleExpanded ? '52%' : '370px'} : '20px',
        }}
      >
        {/* Add more visual help text when panel is open */}
        {miniScheduleOpen && courses.length > 0 && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(33, 150, 243, 0.1)',
              color: darkMode ? '#BB86FC' : '#1976d2'
            }}
          >
            Click "Add" next to courses to see them appear in your weekly schedule →
          </Alert>
        )}

        {/* User's Selected Courses Section */}
        {showSelectedCourses && (
          <Typography
            variant="h2"
            align="left"
            sx={{
              color: darkMode ? '#BB86FC' : '#00693E',
              fontSize: isMobile ? '1.5rem' : '1.8rem',
              fontWeight: 700,
              marginTop: '10px',
              fontFamily: 'SF Pro Display, sans-serif',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              transition: 'color 0.3s ease',
            }}
          >
            Your {formatTermName(termType)} Courses.
          </Typography>
        )}
  
        {showSelectedCourses && selectedCourses.length > 0 && (
          <>
            {/* View Toggle */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Box sx={{
                display: 'flex',
                bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                borderRadius: '12px',
                p: '4px',
                mb: 2,
              }}>
                <Button
                  startIcon={<TableChartIcon />}
                  onClick={() => setViewMode('table')}
                  sx={{
                    backgroundColor: viewMode === 'table' 
                      ? (darkMode ? '#BB86FC' : '#00693E') 
                      : 'transparent',
                    color: viewMode === 'table'
                      ? (darkMode ? '#000000' : '#FFFFFF')
                      : (darkMode ? '#FFFFFF' : '#000000'),
                    fontWeight: 600,
                    mr: 1,
                    p: '8px 16px',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: viewMode === 'table'
                        ? (darkMode ? '#9A66EA' : '#00522F')
                        : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                    }
                  }}
                >
                  List View
                </Button>
                <Button
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => setViewMode('calendar')}
                  sx={{
                    backgroundColor: viewMode === 'calendar' 
                      ? (darkMode ? '#BB86FC' : '#00693E') 
                      : 'transparent',
                    color: viewMode === 'calendar'
                      ? (darkMode ? '#000000' : '#FFFFFF')
                      : (darkMode ? '#FFFFFF' : '#000000'),
                    fontWeight: 600,
                    p: '8px 16px',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: viewMode === 'calendar'
                        ? (darkMode ? '#9A66EA' : '#00522F')
                        : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                    }
                  }}
                >
                  Calendar View
                </Button>
              </Box>
              
              {viewMode === 'calendar' && (
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{
                    color: darkMode ? '#BB86FC' : '#00693E',
                    borderColor: darkMode ? '#BB86FC' : '#00693E',
                    mb: 2,
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.08)' : 'rgba(0, 105, 62, 0.08)',
                      borderColor: darkMode ? '#9A66EA' : '#00522F',
                    },
                  }}
                >
                  Print Schedule
                </Button>
              )}
            </Box>

            {/* Selected Courses Views */}
            {viewMode === 'table' && (
  <TimetableGrid 
    courses={selectedCourses}
    darkMode={darkMode}
    handleCourseClick={handleCourseClick}
    handleAddCourse={handleAddCourse}
    handleRemoveCourse={handleRemoveCourse}
    handleNotifyDrop={handleNotifyDrop}
    handleAddToCalendar={handleAddToCalendar}
    handleAddToAppleCalendar={handleAddToAppleCalendar}
    selectedCourses={selectedCourses}
    isFallAddDropClosed={false}
    isPriorityEligible={false}
    notificationPriority={notificationPriority}
    toggleNotificationPriority={toggleNotificationPriority}
    enrollmentDataReady={enrollmentDataReady}
    isMobile={isMobile}
    userReviews={userReviews}
    userGradeSubmissions={userGradeSubmissions}
    currentTerm={currentTerm}
    onAddReview={handleAddReview}
    termType={termType} // Pass the current term type
  />
)}
            
            {viewMode === 'calendar' && (
              <Box id="schedule-to-print">
                <ScheduleVisualization 
                  selectedCourses={selectedCourses} 
                  darkMode={darkMode} 
                  onRemoveCourse={handleRemoveCourse}
                />
                
                <Box sx={{ marginTop: '32px' }}>
                  <Typography variant="h6" sx={{ color: darkMode ? '#FFFFFF' : '#000000', marginBottom: '16px' }}>
                    Understanding Your Schedule
                  </Typography>
                  <Paper
                    sx={{
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      padding: '16px',
                      borderRadius: '8px',
                    }}
                  >
                    <Typography variant="body1" sx={{ marginBottom: '8px', color: darkMode ? '#FFFFFF' : '#000000' }}>
                      • Regular class meetings are shown in solid colors
                    </Typography>
                    <Typography variant="body1" sx={{ marginBottom: '8px', color: darkMode ? '#FFFFFF' : '#000000' }}>
                      • X-Hours are displayed with reduced opacity
                    </Typography>
                    <Typography variant="body1" sx={{ marginBottom: '8px', color: darkMode ? '#FFFFFF' : '#000000' }}>
                      • Time conflicts are highlighted with red borders
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
                      • Hover over any course block to see detailed information
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}
          </>
        )}
  
        {showSelectedCourses && selectedCourses.length === 0 && (
          <Typography sx={{ marginBottom: '20px', color: darkMode ? '#FFFFFF' : '#1D1D1F' }}>
            Haven&apos;t added your {formatTermName(termType)} timetable on CourseMe? Add now!
          </Typography>
        )}
     
        {/* Filters and Controls */}
        <FilterSection
          darkMode={darkMode}
          searchTerm={searchTerm}
          handleSearch={handleSearch}
          selectedSubject={selectedSubject}
          handleSubjectChange={handleSubjectChange}
          subjects={subjects}
          showSelectedCourses={showSelectedCourses}
          setShowSelectedCourses={setShowSelectedCourses}
          isMobile={isMobile}
          termType={termType}       
          setTermType={setTermType} 
          hasUnlockedFeatures={hasUnlockedFeatures}
          onRefreshEnrollments={handleForceRefreshEnrollments}
          isRefreshingEnrollments={isRefreshingEnrollments}
          showRefreshButton={true}
          enableEnrollmentData={true}
        />

        {/* Main Course Listing */}
        {loading ? (
          <LoadingState darkMode={darkMode} />
        ) : error ? (
          <Alert severity="error">Error loading courses: {error.message}</Alert>
        ) : filteredCourses.length > 0 ? (
          <>
            <TimetableGrid 
  courses={paginatedCourses}
  darkMode={darkMode}
  handleCourseClick={handleCourseClick}
  handleAddCourse={handleAddCourse}
  handleRemoveCourse={handleRemoveCourse}
  handleNotifyDrop={handleNotifyDrop}
  handleAddToCalendar={handleAddToCalendar}
  handleAddToAppleCalendar={handleAddToAppleCalendar}
  selectedCourses={selectedCourses}
  isFallAddDropClosed={false}
  isPriorityEligible={isPriorityEligible}
  notificationPriority={notificationPriority}
  toggleNotificationPriority={toggleNotificationPriority}
  enrollmentDataReady={enrollmentDataReady}
  isMobile={isMobile}
  userReviews={userReviews}
  userGradeSubmissions={userGradeSubmissions}
  currentTerm={currentTerm}
  onAddReview={handleAddReview}
  termType={termType} // Pass the current term type
/>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              handlePreviousPage={handlePreviousPage}
              handleNextPage={handleNextPage}
              darkMode={darkMode}
            />
          </>
        ) : (
          <Typography sx={{ color: darkMode ? '#FFFFFF' : '#1D1D1F' }}>
            No courses available
          </Typography>
        )}

        {/* Add this note near the top when there are no courses selected */}
        {!showSelectedCourses || selectedCourses.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              marginBottom: '20px', 
              backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(33, 150, 243, 0.1)',
              color: darkMode ? '#BB86FC' : '#1976d2',
              '& .MuiAlert-icon': {
                color: darkMode ? '#BB86FC' : '#1976d2',
              }
            }}
          >
            Press the <strong>Add</strong> button next to courses to build your schedule. Use the Quick Calendar Preview in the bottom right to check for time conflicts.
          </Alert>
        ) : null}
      </Container>

      {/* Floating Action Button for Mini Schedule */}
      {!miniScheduleOpen && (
        <Zoom in={true}>
          <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
            <FeatureHighlight
              show={showFeatureHighlight}
              darkMode={darkMode}
              onClose={handleFeatureHighlightClose}
              onTryNow={handleFeatureHighlightTryNow}
            />
            
            <Fab
              color="primary"
              aria-label="quick schedule"
              sx={{
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
                color: darkMode ? '#FFFFFF' : '#000000',
                width: 64,
                height: 64,
                backdropFilter: 'blur(10px)',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: darkMode 
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                  : '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 1px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 1)',
                  boxShadow: darkMode 
                    ? '0 12px 40px rgba(0, 0, 0, 0.5)' 
                    : '0 14px 40px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
                },
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: showFeatureHighlight 
                  ? 'pulse 2s infinite cubic-bezier(0.455, 0.03, 0.515, 0.955)'
                  : 'none',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: darkMode 
                      ? '0 0 0 0 rgba(255, 255, 255, 0.4)' 
                      : '0 0 0 0 rgba(0, 122, 255, 0.4)'
                  },
                  '70%': {
                    boxShadow: darkMode 
                      ? '0 0 0 10px rgba(255, 255, 255, 0)' 
                      : '0 0 0 10px rgba(0, 122, 255, 0)'
                  },
                  '100%': {
                    boxShadow: darkMode 
                      ? '0 0 0 0 rgba(255, 255, 255, 0)' 
                      : '0 0 0 0 rgba(0, 122, 255, 0)'
                  }
                }
              }}
              onClick={handleOpenMiniSchedule}
            >
              <CalendarMonthIcon sx={{ 
                fontSize: 28,
                color: darkMode 
                  ? '#FFFFFF' 
                  : '#000000',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }} />
            </Fab>
          </Box>
        </Zoom>
      )}
      
      {/* Mini Schedule Panel */}
      <MiniSchedulePanel
        open={miniScheduleOpen}
        expanded={miniScheduleExpanded}
        darkMode={darkMode}
        selectedCourses={selectedCourses}
        searchTerm={searchTerm}
        handleSearch={handleSearch}
        handleRemoveCourse={handleRemoveCourse}
        handleAddCourse={handleAddCourse}
        courses={courses}
        toggleSize={toggleMiniScheduleSize}
        handleClose={handleCloseMiniSchedule}
        setViewMode={setViewMode}
      />

      {/* Snackbars */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success"
          sx={{
            width: '100%',
            backgroundColor: darkMode ? '#1C1F43' : '#E6F4EA',
            color: darkMode ? '#FFFFFF' : '#1D1D1F',
            '& .MuiAlert-icon': {
              color: '#34C759'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Pop-up Blocked Snackbar */}
      <Snackbar
        open={popupMessageOpen}
        autoHideDuration={8000}
        onClose={handlePopupMessageClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handlePopupMessageClose} 
          severity="warning"
          sx={{
            width: '100%',
            backgroundColor: darkMode ? '#332D41' : '#FFF4E5',
            color: darkMode ? '#FFFFFF' : '#1D1D1F',
            '& .MuiAlert-icon': {
              color: '#FF9500'
            }
          }}
        >
          Pop-up blocked! Please click on the blocked content icon in your browser's address bar to allow pop-ups.
        </Alert>
      </Snackbar>

      {/* General Message Snackbar */}
      <Snackbar
        open={openPopupMessage}
        autoHideDuration={6000}
        onClose={() => setOpenPopupMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenPopupMessage(false)} 
          severity={popupMessage.type || 'info'}
          sx={{
            width: '100%',
            backgroundColor: 
              popupMessage.type === 'success' ? (darkMode ? '#1C1F43' : '#E6F4EA') :
              popupMessage.type === 'error' ? (darkMode ? '#332D41' : '#FDEDED') :
              popupMessage.type === 'warning' ? (darkMode ? '#332D41' : '#FFF4E5') :
              (darkMode ? '#0D1D35' : '#E5F6FD'),
            color: darkMode ? '#FFFFFF' : '#1D1D1F',
          }}
        >
          {popupMessage.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Timetable;