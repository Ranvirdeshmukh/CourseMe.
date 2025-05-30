// src/pages/timetablepages/TimetableGrid.jsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Box, Tooltip, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
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
const hasEnoughReviews = (reviews = [], gradeSubmissions = [], currentTerm = '25S') => {
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
const getContributionCounts = (reviews = [], gradeSubmissions = [], currentTerm = '25S') => {
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

// Frosted overlay component for locked features
const FrostedOverlay = ({ darkMode, onAddReview, currentTerm, userReviews = [], userGradeSubmissions = [], showMessage = false }) => {
  const requiredTerms = getPreviousTerms(currentTerm);
  const reviewCount = userReviews.filter(review => 
    requiredTerms.includes(review.term)
  ).length;
  const gradeCount = userGradeSubmissions.filter(submission => 
    requiredTerms.includes(submission.Term)
  ).length;
  const totalContributions = reviewCount + gradeCount;
  const needed = Math.max(0, 3 - totalContributions);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: darkMode 
          ? 'rgba(28, 31, 67, 0.85)' 
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: '8px',
        padding: '16px',
        zIndex: 10,
        cursor: 'default',
      }}
    >
      {showMessage && (
        <>
          <LockIcon 
            sx={{ 
              fontSize: '2rem', 
              color: darkMode ? '#BB86FC' : '#571ce0',
              mb: 1,
              opacity: 0.8
            }} 
          />
          
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: darkMode ? '#FFFFFF' : '#1D1D1F',
              textAlign: 'center',
              mb: 1,
              lineHeight: 1.4,
            }}
          >
            Unlock with Course Reviews
          </Typography>
          
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              textAlign: 'center',
              mb: 2,
              lineHeight: 1.3,
              maxWidth: '200px',
            }}
          >
            {needed > 0 
              ? `Need ${needed} more review${needed > 1 ? 's' : ''} from ${requiredTerms.join(' or ')} to unlock`
              : `You have ${totalContributions} contributions from ${requiredTerms.join(' and ')}`
            }
          </Typography>
          
        </>
      )}
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
  currentTerm = "25S",
  userReviews = [],
  userGradeSubmissions = [],
  onAddReview = () => {}, // Callback to open review modal/page
}) => {
  
  // Debug logging to see what props are received
  console.log('TimetableGrid received props:');
  console.log('userReviews:', userReviews);
  console.log('userGradeSubmissions:', userGradeSubmissions);
  console.log('currentTerm:', currentTerm);
  
  // Check if user has enough reviews to unlock features
  const hasUnlockedFeatures = hasEnoughReviews(userReviews, userGradeSubmissions, currentTerm);

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
                { header: 'Schedule', width: '12%' },
                { header: 'Location', width: '12%' },
                { header: 'Professor', width: '12%' },
                { header: 'Enrollment', width: '12%' },
                { header: 'Notifications', width: '12%' },
                { header: 'Calendar', width: '12%' },
                { header: 'Add', width: '8%' },
              ].map(({ header, width }, index) => (
                <TableCell
                  key={index}
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
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    cursor: 'default',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: darkMode 
                        ? 'rgba(255, 255, 255, 0.03)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      transform: 'scale(1.005)',
                      '& .course-row-content': {
                        backgroundColor: darkMode 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.03)',
                      }
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
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      width: '20%',
                      maxWidth: '20%',
                      border: 'none',
                      position: 'relative',
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
                          '&:hover': {
                            color: darkMode ? '#BB86FC' : '#007AFF',
                            transform: 'translateX(2px)',
                          },
                          transition: 'all 0.2s ease',
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
                          '&:hover': {
                            transform: 'translateX(2px)',
                          },
                          transition: 'all 0.2s ease',
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
                      transition: 'all 0.3s ease',
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
                      transition: 'all 0.3s ease',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      width: '12%',
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
                      transition: 'all 0.3s ease',
                      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                      width: '12%',
                      maxWidth: '12%',
                      whiteSpace: 'normal',
                      border: 'none',
                      '& *': {
                        color: `${darkMode ? '#BB86FC' : '#007AFF'} !important`,
                        fontWeight: '600 !important',
                        fontSize: '0.9rem !important',
                        lineHeight: '1.4 !important',
                        textDecoration: 'none !important',
                        '&:hover': {
                          transform: 'translateX(2px) !important',
                          textDecoration: 'none !important',
                        },
                        transition: 'all 0.2s ease !important',
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
                      width: '12%',
                      border: 'none',
                      ...(!hasUnlockedFeatures && {
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                      })
                    }}
                    className="course-row-content"
                  >
                    {!hasUnlockedFeatures ? (
                      // Only render the overlay in the middle column every 5 rows, but span across all 3
                      index % 5 === 2 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '8px',
                            left: 0,
                            right: '-200%',
                            bottom: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: darkMode 
                              ? 'rgba(28, 31, 67, 0.95)' 
                              : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            padding: '20px',
                            zIndex: 10,
                            cursor: 'default',
                            boxShadow: darkMode
                              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                              : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          <LockIcon 
                            sx={{ 
                              fontSize: '2.5rem', 
                              color: darkMode ? '#BB86FC' : '#007AFF',
                              mb: 2,
                              opacity: 0.9
                            }} 
                          />
                          
                          <Typography
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 700,
                              color: darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)',
                              textAlign: 'center',
                              mb: 1,
                              lineHeight: 1.4,
                              letterSpacing: '0.3px',
                            }}
                          >
                            Unlock Premium Features
                          </Typography>
                          
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                              textAlign: 'center',
                              mb: 2,
                              lineHeight: 1.4,
                              maxWidth: '240px',
                              fontWeight: 500,
                            }}
                          >
                            {(() => {
                              const requiredTerms = getPreviousTerms(currentTerm);
                              const { reviewCount, gradeCount } = getContributionCounts(userReviews, userGradeSubmissions, currentTerm);
                              const totalContributions = reviewCount + gradeCount;
                              const needed = Math.max(0, 3 - totalContributions);
                              
                              if (needed > 0) {
                                return `Complete ${needed} more review${needed > 1 ? 's' : ''} from ${requiredTerms.join(' or ')} to unlock enrollment data, notifications, and calendar features.`;
                              } else {
                                return `You have ${reviewCount} review${reviewCount !== 1 ? 's' : ''} and ${gradeCount} median grade${gradeCount !== 1 ? 's' : ''} from ${requiredTerms.join(' and ')}.`;
                              }
                            })()}
                          </Typography>
                          
                        </Box>
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
                      width: '12%',
                      border: 'none',
                      ...(!hasUnlockedFeatures && {
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                      }),
                      '& > *': {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textDecoration: 'none !important',
                        borderBottom: 'none !important',
                      }
                    }}
                    className="course-row-content"
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
                      padding: '20px 24px',
                      textAlign: 'left',
                      height: '48px',
                      verticalAlign: 'middle',
                      width: '12%',
                      position: 'relative',
                      border: 'none',
                      ...(!hasUnlockedFeatures && {
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                      })
                    }}
                    className="course-row-content"
                  >
                    {!hasUnlockedFeatures ? (
                      // Empty for locked state - overlay is handled by first column
                      null
                    ) : (
                      course.period !== 'ARR' && course.period !== 'FS' && (
                        <Box sx={{ 
                          display: 'flex', 
                          gap: '8px',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Tooltip title="Add to Google Calendar" arrow placement="top">
                            <span>
                              <GoogleCalendarButton 
                                darkMode={darkMode} 
                                onClick={() => handleAddToCalendar(course)}
                                sx={{
                                  height: '36px',
                                  width: '36px',
                                  borderRadius: '50%',
                                  transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                  '&:hover': {
                                    transform: 'scale(1.1) translateY(-1px)',
                                  }
                                }}
                              >
                                <div className="icon">
                                  <GoogleIcon />
                                </div>
                              </GoogleCalendarButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title="Add to Apple Calendar" arrow placement="top">
                            <span>
                              <AppleCalendarButton 
                                darkMode={darkMode} 
                                onClick={() => handleAddToAppleCalendar(course)}
                                sx={{
                                  height: '36px',
                                  width: '36px',
                                  borderRadius: '50%',
                                  transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                  '&:hover': {
                                    transform: 'scale(1.1) translateY(-1px)',
                                  }
                                }}
                              >
                                <div className="icon">
                                  <AppleIcon />
                                </div>
                              </AppleCalendarButton>
                            </span>
                          </Tooltip>
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