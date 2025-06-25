// src/pages/timetablepages/TimetableGrid.jsx
import React, { useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Box, Tooltip, Typography, Button, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { ProfessorCell } from '../ProfessorCell';
import NotificationButton from './NotificationButton';
import { 
  GoogleCalendarButton, 
  AppleCalendarButton, 
  GoogleIcon, 
  AppleIcon,
  EnrollmentDisplay, 
  EnrollmentText, 
  EnrollmentProgressBar 
} from './TimetableStyleComponents';

// Helper function to get previous terms for review requirement
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

// Helper function to check if user has enough reviews
const hasEnoughReviews = (reviews = [], gradeSubmissions = [], currentTerm = '25X') => {
  const requiredTerms = getPreviousTerms(currentTerm);
  
  console.log('hasEnoughReviews check:');
  console.log('Required terms:', requiredTerms);
  console.log('Reviews:', reviews);
  console.log('Grade submissions:', gradeSubmissions);
  
  // Count reviews from required terms
  const reviewCount = reviews.filter(review => 
    review && review.term && requiredTerms.includes(review.term)
  ).length;
  
  // Count grade submissions from required terms
  const gradeCount = gradeSubmissions.filter(submission => 
    submission && submission.Term && requiredTerms.includes(submission.Term)
  ).length;
  
  const totalContributions = reviewCount + gradeCount;
  const hasEnough = totalContributions >= 3; // Changed from 3 to 1 for testing
  
  console.log('Review count:', reviewCount);
  console.log('Grade count:', gradeCount);
  console.log('Total contributions:', totalContributions);
  console.log('Has enough?', hasEnough);
  
  return hasEnough;
};

// Helper function to get review and grade counts for display
const getContributionCounts = (reviews = [], gradeSubmissions = [], currentTerm = '25X') => {
  const requiredTerms = getPreviousTerms(currentTerm);
  
  console.log('Current term:', currentTerm);
  console.log('Required previous terms:', requiredTerms);
  console.log('All reviews:', reviews);
  console.log('All grade submissions:', gradeSubmissions);
  
  // Count reviews from required terms with exact string matching
  const validReviews = reviews.filter(review => {
    if (!review || !review.term) return false;
    const isValid = requiredTerms.includes(review.term);
    console.log(`Review term "${review.term}" valid:`, isValid);
    return isValid;
  });
  
  // Count grade submissions from required terms with exact string matching
  const validGradeSubmissions = gradeSubmissions.filter(submission => {
    if (!submission || !submission.Term) return false;
    const isValid = requiredTerms.includes(submission.Term);
    console.log(`Grade submission term "${submission.Term}" valid:`, isValid);
    return isValid;
  });
  
  console.log('Valid reviews:', validReviews);
  console.log('Valid grade submissions:', validGradeSubmissions);
  console.log('Final counts - Reviews:', validReviews.length, 'Grades:', validGradeSubmissions.length);
  
  return { 
    reviewCount: validReviews.length, 
    gradeCount: validGradeSubmissions.length 
  };
};

// Add this helper function at the top of your component
const formatTiming = (timingString) => {
  if (!timingString || timingString === 'Unknown Timing') {
    return { mainTime: 'Unknown Timing', xHour: null };
  }
  
  // Split by comma to separate regular hours from x-hours
  const parts = timingString.split(',');
  
  // Main time is the first part
  const mainTime = parts[0].trim();
  
  // X-hour is anything after the first comma
  const xHour = parts.length > 1 ? parts.slice(1).join(',').trim() : null;
  
  return { mainTime, xHour };
};

// Helper function to format location information
const formatLocation = (room, building) => {
  const hasRoom = room && room !== 'N/A';
  const hasBuilding = building && building !== 'N/A';
  
  if (!hasRoom && !hasBuilding) {
    return 'Location not yet available';
  }
  
  if (hasRoom && hasBuilding) {
    return `${room}, ${building}`;
  }
  
  if (hasRoom) {
    return room;
  }
  
  if (hasBuilding) {
    return building;
  }
  
  return 'Location not yet available';
};

// Apple-Inspired Lock Overlay Component
const AppleInspiredLockOverlay = ({ darkMode, currentTerm, userReviews = [], userGradeSubmissions = [] }) => {
  const navigate = useNavigate();
  const requiredTerms = getPreviousTerms(currentTerm);
  const { reviewCount, gradeCount } = getContributionCounts(userReviews, userGradeSubmissions, currentTerm);
  const totalContributions = reviewCount + gradeCount;
  const needed = Math.max(0, 3 - totalContributions);

  const handleNavigateToReviews = () => {
    navigate('/classes'); // Navigate to AllClassesPage (correct route)
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '4px',
        left: '-12px',
        right: '-212%', // Extended to fully cover all 3 columns
        bottom: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '20px',
        padding: '32px 28px',
        zIndex: 10,
        cursor: 'default',
        pointerEvents: 'auto', // Ensure this captures all mouse events
        willChange: 'transform', // Optimize for animations
      }}
    >
      {/* Content Container with Background */}
      <Box
        sx={{
          // Background that covers just the content area
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(28, 31, 67, 0.95) 0%, rgba(45, 55, 89, 0.95) 50%, rgba(28, 31, 67, 0.95) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 50%, rgba(255, 255, 255, 0.95) 100%)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          borderRadius: '20px',
          padding: '24px 20px',
          // Enhanced shadow and border for better definition
          boxShadow: darkMode
            ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            : '0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          // Add a subtle border for better definition
          border: darkMode 
            ? '1px solid rgba(187, 134, 252, 0.3)'
            : '1px solid rgba(0, 122, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          willChange: 'transform, box-shadow', // Optimize for animations
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: darkMode
              ? '0 25px 70px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              : '0 25px 70px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
            border: darkMode 
              ? '1px solid rgba(187, 134, 252, 0.4)'
              : '1px solid rgba(0, 122, 255, 0.3)',
          },
        }}
      >
        {/* Decorative Elements */}
        <Box
              sx={{ 
            position: 'absolute',
            top: '-10px',
            right: '20px',
            width: '60px',
            height: '60px',
            background: darkMode 
              ? 'linear-gradient(45deg, #BB86FC 0%, #9C4DCC 100%)' 
              : 'linear-gradient(45deg, #007AFF 0%, #0056CC 100%)',
            borderRadius: '50%',
            opacity: 0.1,
            animation: 'float 3s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-10px) rotate(180deg)' }
            }
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            bottom: '-5px',
            left: '20px',
            width: '40px',
            height: '40px',
            background: darkMode 
              ? 'linear-gradient(45deg, #BB86FC 0%, #9C4DCC 100%)' 
              : 'linear-gradient(45deg, #007AFF 0%, #0056CC 100%)',
            borderRadius: '30%',
            opacity: 0.08,
            animation: 'float 4s ease-in-out infinite reverse',
          }}
        />

        {/* Premium Icon with Glow */}
        <Box
          sx={{
            position: 'relative',
            mb: 3,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              background: darkMode 
                ? 'radial-gradient(circle, rgba(187, 134, 252, 0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(0, 122, 255, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: -1,
            }
          }}
        >
          <Box
            sx={{
              position: 'relative',
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(187, 134, 252, 0.15) 0%, rgba(156, 77, 204, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(0, 86, 204, 0.1) 100%)',
              borderRadius: '20px',
              padding: '16px',
              border: darkMode 
                ? '1px solid rgba(187, 134, 252, 0.2)'
                : '1px solid rgba(0, 122, 255, 0.15)',
            }}
          >
            <img 
              src="/darkmodefavicon.png" 
              alt="CourseMe Logo"
              style={{ 
                width: '2.5rem',
                height: '2.5rem',
                filter: darkMode 
                  ? 'drop-shadow(0 0 8px rgba(187, 134, 252, 0.3))' 
                  : 'drop-shadow(0 0 8px rgba(0, 122, 255, 0.3))',
                objectFit: 'contain',
              }} 
            />
          </Box>
        </Box>
        
        {/* Main Heading */}
            <Typography
              sx={{
            fontSize: '1.25rem',
            fontWeight: 800,
            background: darkMode 
              ? 'linear-gradient(135deg, #FFFFFF 0%, #BB86FC 100%)'
              : 'linear-gradient(135deg, #1D1D1F 0%, #007AFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
                textAlign: 'center',
                mb: 1,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
          Unlock Premium Features
            </Typography>
            
        {/* Status Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip
            icon={<RateReviewIcon sx={{ fontSize: '16px !important' }} />}
            label={`${reviewCount} Review${reviewCount !== 1 ? 's' : ''}`}
            size="small"
            sx={{
              backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.15)' : 'rgba(0, 122, 255, 0.1)',
              color: darkMode ? '#BB86FC' : '#007AFF',
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-icon': {
                color: darkMode ? '#BB86FC' : '#007AFF',
              }
            }}
          />
          <Chip
            icon={<StarIcon sx={{ fontSize: '16px !important' }} />}
            label={`${gradeCount} Grade${gradeCount !== 1 ? 's' : ''}`}
            size="small"
            sx={{
              backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.15)' : 'rgba(0, 122, 255, 0.1)',
              color: darkMode ? '#BB86FC' : '#007AFF',
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-icon': {
                color: darkMode ? '#BB86FC' : '#007AFF',
              }
            }}
          />
        </Box>
        
        {/* Description with Specific Benefits */}
            <Typography
              sx={{
            fontSize: '0.9rem',
                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                textAlign: 'center',
            mb: 3,
            lineHeight: 1.5,
            maxWidth: '320px',
            fontWeight: 500,
            fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              {needed > 0 
            ? `Complete ${needed} more review${needed > 1 ? 's' : ''} from ${requiredTerms.join(' or ')} to unlock:`
            : `🎉 Premium features unlocked! You have ${reviewCount} review${reviewCount !== 1 ? 's' : ''} and ${gradeCount} median grade${gradeCount !== 1 ? 's' : ''}.`
              }
            </Typography>
            
        {/* Feature Benefits List */}
        {needed > 0 && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                fontWeight: 600,
                mb: 1,
                fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              ✨ Get notified when someone drops a class
            </Typography>
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                fontWeight: 600,
                mb: 1,
                fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              📅 Add to Google & Apple Calendar in one click
            </Typography>
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                fontWeight: 600,
                fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              📊 Real-time enrollment data for the rest of the term
            </Typography>
          </Box>
        )}

        {/* Call to Action Button */}
        <Button
          onClick={handleNavigateToReviews}
          endIcon={<ArrowForwardIcon sx={{ fontSize: '18px' }} />}
          sx={{
            background: darkMode 
              ? 'linear-gradient(135deg, #BB86FC 0%, #9C4DCC 100%)'
              : 'linear-gradient(135deg, #007AFF 0%, #0056CC 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.95rem',
            fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
            textTransform: 'none',
            borderRadius: '14px',
            padding: '14px 28px',
            minHeight: '48px', // Ensure minimum touch target
            minWidth: '200px', // Ensure adequate button width
            position: 'relative',
            zIndex: 20, // Higher z-index to ensure it's above everything
            boxShadow: darkMode
              ? '0 12px 32px rgba(187, 134, 252, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
              : '0 12px 32px rgba(0, 122, 255, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            border: darkMode 
              ? '1px solid rgba(255, 255, 255, 0.2)'
              : '1px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            '&:hover': {
              transform: 'translateY(-3px) scale(1.03)',
              boxShadow: darkMode
                ? '0 16px 40px rgba(187, 134, 252, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                : '0 16px 40px rgba(0, 122, 255, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              background: darkMode 
                ? 'linear-gradient(135deg, #C89FFF 0%, #A855DD 100%)'
                : 'linear-gradient(135deg, #1A8FFF 0%, #0A66DD 100%)',
              border: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.4)',
            },
            '&:active': {
              transform: 'translateY(-1px) scale(0.99)',
            },
            // Ensure the button area is clearly defined
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              right: '-4px',
              bottom: '-4px',
              background: 'transparent',
              borderRadius: '18px',
              zIndex: -1,
            }
          }}
        >
          Write Your First Review
        </Button>

        {/* Progress Indicator */}
        <Box sx={{ mt: 2, width: '100%', maxWidth: '200px' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Progress
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: darkMode ? '#BB86FC' : '#007AFF',
                fontWeight: 700,
              }}
            >
              {totalContributions}/3
            </Typography>
          </Box>
          
          <Box
            sx={{
              height: '6px',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${Math.min((totalContributions / 3) * 100, 100)}%`,
                background: darkMode 
                  ? 'linear-gradient(90deg, #BB86FC 0%, #9C4DCC 100%)'
                  : 'linear-gradient(90deg, #007AFF 0%, #0056CC 100%)',
                borderRadius: '3px',
                transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          </Box>
        </Box>
      </Box> {/* Close Content Container with Background */}
    </Box>
  );
};

const TimetableGrid = ({
  courses,
  darkMode,
  handleCourseClick,
  handleAddCourse,
  handleRemoveCourse,
  handleNotifyDrop,
  handleAddToCalendar,
  handleAddToAppleCalendar,
  selectedCourses,
  isFallAddDropClosed,
  isPriorityEligible,
  notificationPriority,
  toggleNotificationPriority,
  enrollmentDataReady,
  isMobile,
  // New props to control feature availability
  enableNotifications = true,
  enableEnrollmentData = true,
  courseAvailabilityDate = "May 30", // When course availability opens
  // New props for review system
  currentTerm = "25X",
  userReviews = [],
  userGradeSubmissions = [],
  onAddReview = () => {}, // Callback to open review modal/page
  // Term type for proper data organization
  termType = 'fall', // 'summer' or 'fall'
}) => {
  
  // Debug logging to see what props are received
  console.log('TimetableGrid received props:');
  console.log('userReviews:', userReviews);
  console.log('userGradeSubmissions:', userGradeSubmissions);
  console.log('currentTerm:', currentTerm);
  
  // Check if user has enough reviews to unlock features
  const hasUnlockedFeatures = hasEnoughReviews(userReviews, userGradeSubmissions, currentTerm);

  // Memoize the base cell styles to prevent recalculation
  const lockedCellStyles = useMemo(() => ({
    pointerEvents: 'none',
    '&:hover': {},
    borderLeft: 'none',
    borderRight: 'none', 
    borderTop: 'none',
    borderBottom: 'none',
  }), []);

  const unlockedCellStyles = useMemo(() => ({
    pointerEvents: 'auto',
    '&:hover': {
      backgroundColor: darkMode 
        ? 'rgba(255, 255, 255, 0.04)' 
        : 'rgba(0, 0, 0, 0.02)',
    },
  }), [darkMode]);

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: darkMode 
            ? 'rgba(28, 31, 67, 0.85)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', // Safari support
          marginTop: '20px',
          boxShadow: darkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          borderRadius: '20px',
          overflowX: 'auto',
          maxWidth: '100%',
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          border: 'none',
          '&:hover': {
            boxShadow: darkMode
              ? '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)'
              : '0 12px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
          <TableHead
            sx={{
              backgroundColor: 'transparent',
              position: 'sticky',
              top: 0,
              zIndex: 1,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: darkMode 
                  ? 'rgba(45, 55, 89, 0.8)' 
                  : 'rgba(248, 250, 252, 0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '20px 20px 0 0',
                zIndex: -1,
              }
            }}
          >
            <TableRow>
              {/* Combined column for Subject/Number/Title/Section */}
              <TableCell
                sx={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                  textAlign: 'left',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  padding: '20px 24px',
                  border: 'none',
                  fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  width: '20%',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Course
              </TableCell>
              
              {/* Other table headers */}
              {[
                { header: 'Schedule', width: '12%', align: 'left' },
                { header: 'Location', width: '11%', align: 'left' },
                { header: 'Professor', width: '11%', align: 'left' },
                { header: 'Enrollment', width: '11%', align: 'center' },
                { header: 'Notifications', width: '11%', align: 'center' },
                { header: 'Calendar', width: '14%', align: 'center' },
                { header: 'Add', width: '8%', align: 'center' },
              ].map(({ header, width, align }, index) => (
                <TableCell
                  key={index}
                  sx={{
                    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    textAlign: align || 'left',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    padding: '20px 24px',
                    border: 'none',
                    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    width: width,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {courses.map((course, index) => {
              return (
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    cursor: 'default',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: darkMode 
                        ? 'rgba(255, 255, 255, 0.02)' 
                        : 'rgba(0, 0, 0, 0.01)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '24px',
                      right: '24px',
                      height: '1px',
                      backgroundColor: darkMode 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.06)',
                      opacity: index === courses.length - 1 ? 0 : 1,
                    }
                  }}
                >
                  {/* Course Cell: Subject + Number, Title, and Section */}
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(course);
                    }}
                    sx={{
                      padding: '20px 24px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      width: '20%',
                      maxWidth: '20%',
                      border: 'none',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: darkMode 
                          ? 'rgba(255, 255, 255, 0.03)' 
                          : 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                    className="course-row-content"
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Subject and Number */}
                      <Typography 
                        sx={{ 
                          color: darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)', 
                          fontWeight: 700,
                          fontSize: '1rem',
                          letterSpacing: '0.3px',
                          transition: 'color 0.2s ease',
                          '&:hover': {
                            color: darkMode ? '#BB86FC' : '#007AFF',
                          },
                        }}
                      >
                        {course.subj} {course.num}
                      </Typography>
                      
                      {/* Course Title */}
                      <Typography 
                        sx={{ 
                          color: darkMode ? '#BB86FC' : '#007AFF',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          lineHeight: 1.4,
                          fontStyle: course.title ? 'normal' : 'italic',
                          opacity: course.title ? 1 : 0.7,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          transition: 'opacity 0.2s ease',
                        }}
                      >
                        {course.title || 'No title available'}
                      </Typography>
                      
                      {/* Section */}
                      <Typography
                        sx={{
                          color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          lineHeight: 1.2,
                          letterSpacing: '0.2px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Section {course.sec}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Timing Cell */}
                  <TableCell
                    sx={{
                      color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                      padding: '20px 24px',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      width: '12%',
                      border: 'none',
                    }}
                    className="course-row-content"
                  >
                    {(() => {
                      const { mainTime, xHour } = formatTiming(course.timing);
                      
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {/* Main time */}
                          <Typography sx={{ 
                            color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            letterSpacing: '0.2px',
                          }}>
                            {mainTime}
                          </Typography>
                          
                          {/* X-hour (if present) */}
                          {xHour && (
                            <Tooltip title={`X-Hour: ${xHour}`} placement="top">
                              <Typography sx={{ 
                                color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                fontSize: '0.75rem', 
                                fontWeight: 500,
                                fontStyle: 'italic',
                                cursor: 'help',
                                padding: '2px 8px',
                                backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                                borderRadius: '12px',
                                display: 'inline-block',
                                letterSpacing: '0.1px',
                                '&:hover': {
                                  backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 122, 255, 0.2)',
                                  transform: 'scale(1.05)',
                                },
                                transition: 'all 0.2s ease',
                              }}>
                                +X-Hour
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })()}
                  </TableCell>

                  {/* Location Cell */}
                  <TableCell
                    sx={{
                      color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                      padding: '20px 24px',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      width: '11%',
                      border: 'none',
                    }}
                    className="course-row-content"
                  >
                    <Typography
                      sx={{
                        color: formatLocation(course.room, course.building) === 'Location not yet available'
                          ? (darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')
                          : (darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'),
                        fontStyle: formatLocation(course.room, course.building) === 'Location not yet available' ? 'italic' : 'normal',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        letterSpacing: '0.2px',
                      }}
                    >
                      {formatLocation(course.room, course.building)}
                    </Typography>
                  </TableCell>

                  {/* Instructor */}
                  <TableCell
                    sx={{
                      padding: '20px 24px',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      width: '11%',
                      maxWidth: '11%',
                      whiteSpace: 'normal',
                      border: 'none',
                      '& *': {
                        color: `${darkMode ? '#BB86FC' : '#007AFF'} !important`,
                        fontWeight: '600 !important',
                        fontSize: '0.9rem !important',
                        lineHeight: '1.4 !important',
                        textDecoration: 'none !important',
                        transition: 'color 0.2s ease !important',
                      },
                    }}
                    className="course-row-content"
                  >
                    <Box
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      <ProfessorCell 
                        instructor={course.instructor} 
                        darkMode={darkMode}
                      />
                    </Box>
                  </TableCell>

                  {/* Enrollment cell - with review gate */}
                  <TableCell 
                    align="center" 
                    sx={{ 
                      padding: '20px 24px', 
                      verticalAlign: 'middle', 
                      position: 'relative',
                      width: '11%',
                      border: 'none',
                      ...(hasUnlockedFeatures ? unlockedCellStyles : lockedCellStyles)
                    }}
                    className={hasUnlockedFeatures ? "course-row-content" : ""}
                  >
                    {!hasUnlockedFeatures ? (
                      // Only render the overlay in the middle column every 5 rows, but span across all 3
                      index % 8 === 2 && (
                        <AppleInspiredLockOverlay 
                          darkMode={darkMode}
                          currentTerm={currentTerm}
                          userReviews={userReviews}
                          userGradeSubmissions={userGradeSubmissions}
                        />
                      )
                    ) : enableEnrollmentData ? (
                      // Normal enrollment display when enabled and unlocked
                      !enrollmentDataReady ? (
                        <Typography 
                          sx={{ 
                            fontSize: '0.9rem', 
                            color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                            fontStyle: 'italic',
                            fontWeight: 500,
                          }}
                        >
                          Loading...
                        </Typography>
                      ) : !course.enrollmentStatus && !course.enrollmentLimit && !course.enrollmentCurrent ? (
                        <Typography 
                          sx={{ 
                            fontSize: '0.9rem', 
                            color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                            fontStyle: 'italic',
                            fontWeight: 500,
                          }}
                        >
                          No data
                        </Typography>
                      ) : course.enrollmentHasIP ? (
                        <EnrollmentDisplay status="ip" darkMode={darkMode}>
                          <EnrollmentText status="ip" darkMode={darkMode}>
                            IP Required
                          </EnrollmentText>
                        </EnrollmentDisplay>
                      ) 
                      : (
                        <EnrollmentDisplay status={course.enrollmentStatus} darkMode={darkMode}>
                          <EnrollmentText status={course.enrollmentStatus} darkMode={darkMode}>
                            {course.enrollmentCurrent !== null && course.enrollmentCurrent !== undefined 
                              ? course.enrollmentCurrent 
                              : '0'}/
                            {course.enrollmentLimit !== null && course.enrollmentLimit !== undefined 
                              ? course.enrollmentLimit 
                              : '0'}
                          </EnrollmentText>
                          {(course.enrollmentLimit || course.enrollmentLimit === 0) && 
                           (course.enrollmentCurrent || course.enrollmentCurrent === 0) && (
                            <EnrollmentProgressBar 
                              status={course.enrollmentStatus} 
                              darkMode={darkMode} 
                              percentage={((course.enrollmentCurrent || 0) / Math.max(1, (course.enrollmentLimit || 1))) * 100}
                            />
                          )}
                        </EnrollmentDisplay>
                      )
                    ) : (
                      // Course availability overlay when enrollment not enabled but unlocked
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '40px',
                          backgroundColor: darkMode 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.05)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '12px',
                          border: darkMode 
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : '1px solid rgba(0, 0, 0, 0.1)',
                          padding: '8px 12px',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.85rem',
                            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            textAlign: 'center',
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          Enrollment info opens {courseAvailabilityDate}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  {/* Notify When Available Button - with review gate */}
                  <TableCell 
                    sx={{ 
                      padding: '20px 24px', 
                      textAlign: 'center', 
                      verticalAlign: 'middle',
                      position: 'relative',
                      width: '11%',
                      border: 'none',
                      ...(hasUnlockedFeatures ? unlockedCellStyles : lockedCellStyles),
                      '& > *': {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textDecoration: 'none !important',
                        borderBottom: 'none !important',
                      }
                    }}
                    className={hasUnlockedFeatures ? "course-row-content" : ""}
                  >
                    {!hasUnlockedFeatures ? (
                      // Empty for locked state - overlay is handled by first column
                      null
                    ) : enableNotifications ? (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        width: '100%',
                        '& *': {
                          textDecoration: 'none !important',
                          borderBottom: 'none !important',
                        }
                      }}>
                        <NotificationButton 
                          course={course}
                          isPriorityEligible={isPriorityEligible}
                          isFallAddDropClosed={isFallAddDropClosed}
                          notificationPriority={notificationPriority}
                          toggleNotificationPriority={toggleNotificationPriority}
                          handleNotifyDrop={handleNotifyDrop}
                          darkMode={darkMode}
                        />
                      </Box>
                    ) : (
                      // Course availability overlay when notifications not enabled but unlocked
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '40px',
                          backgroundColor: darkMode 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.05)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '12px',
                          border: darkMode 
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : '1px solid rgba(0, 0, 0, 0.1)',
                          padding: '8px 12px',
                          cursor: 'not-allowed',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.85rem',
                            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            textAlign: 'center',
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          Notifications open {courseAvailabilityDate}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  {/* Add to Calendar Button - with review gate */}
                  <TableCell
                    sx={{
                      padding: '16px 20px',
                      textAlign: 'center',
                      height: '72px',
                      verticalAlign: 'middle',
                      width: '14%', // Slightly wider to accommodate the enhanced buttons
                      position: 'relative',
                      border: 'none',
                      ...(hasUnlockedFeatures ? unlockedCellStyles : lockedCellStyles)
                    }}
                    className={hasUnlockedFeatures ? "course-row-content" : ""}
                  >
                    {!hasUnlockedFeatures ? (
                      // Empty for locked state - overlay is handled by first column
                      null
                    ) : (
                      course.period !== 'ARR' && course.period !== 'FS' && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '10px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                        }}>
                          {/* Calendar Buttons Container */}
                          <Box sx={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Tooltip 
                              title="Add to Google Calendar" 
                              arrow 
                              placement="top"
                              PopperProps={{
                                sx: {
                                  '& .MuiTooltip-tooltip': {
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                                    backgroundColor: darkMode ? 'rgba(60, 60, 67, 0.95)' : 'rgba(0, 0, 0, 0.8)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                  }
                                }
                              }}
                            >
                              <span>
                                <GoogleCalendarButton 
                                  darkMode={darkMode} 
                                  onClick={() => handleAddToCalendar(course)}
                                  sx={{
                                    height: '42px',
                                    width: '42px',
                                  }}
                                >
                                  <div className="icon">
                                    <GoogleIcon />
                                  </div>
                                </GoogleCalendarButton>
                              </span>
                            </Tooltip>
                            
                            <Tooltip 
                              title="Add to Apple Calendar" 
                              arrow 
                              placement="top"
                              PopperProps={{
                                sx: {
                                  '& .MuiTooltip-tooltip': {
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                                    backgroundColor: darkMode ? 'rgba(60, 60, 67, 0.95)' : 'rgba(0, 0, 0, 0.8)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                  }
                                }
                              }}
                            >
                              <span>
                                <AppleCalendarButton 
                                  darkMode={darkMode} 
                                  onClick={() => handleAddToAppleCalendar(course)}
                                  sx={{
                                    height: '42px',
                                    width: '42px',
                                  }}
                                >
                                  <div className="icon">
                                    <AppleIcon />
                                  </div>
                                </AppleCalendarButton>
                              </span>
                            </Tooltip>
                          </Box>
                          
                          {/* Subtle Calendar Label */}
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                              fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              lineHeight: 1,
                              textAlign: 'center',
                              opacity: 0.8,
                              transition: 'opacity 0.2s ease',
                              '&:hover': {
                                opacity: 1,
                              }
                            }}
                          >
                            Add to Calendar
                          </Typography>
                        </Box>
                      )
                    )}
                  </TableCell>
                  
                  {/* Add Button Cell - not gated by reviews */}
                  <TableCell
                    sx={{
                      padding: '20px 24px',
                      textAlign: 'center',
                      width: '8%',
                      border: 'none',
                    }}
                    className="course-row-content"
                  >
                    {/* Check if course is already in selectedCourses */}
                    {selectedCourses.some(
                      (c) => c.subj === course.subj && c.num === course.num && c.sec === course.sec
                    ) ? (
                      <IconButton 
                        onClick={() => handleRemoveCourse(course)}
                        sx={{
                          color: '#FF3B30',
                          backgroundColor: 'rgba(255, 59, 48, 0.1)',
                          borderRadius: '12px',
                          padding: '8px',
                          transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 59, 48, 0.2)',
                            transform: 'scale(1.1) rotate(-5deg)',
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <IconButton 
                        onClick={() => handleAddCourse(course)}
                        sx={{ 
                          color: darkMode ? '#BB86FC' : '#007AFF',
                          backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                          borderRadius: '12px',
                          padding: '8px',
                          transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          '&:hover': {
                            backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 122, 255, 0.2)',
                            transform: 'scale(1.1) rotate(5deg)',
                          }
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default TimetableGrid;