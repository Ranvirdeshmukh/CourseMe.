// src/pages/timetablepages/TimetableGrid.jsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Box, Tooltip, Typography, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RateReviewIcon from '@mui/icons-material/RateReview';
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
          backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
          marginTop: '10px',
          boxShadow: darkMode
            ? '0 6px 16px rgba(255, 255, 255, 0.1)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
          borderRadius: '12px',
          overflowX: 'auto',
          maxWidth: '100%',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          border: darkMode
            ? '1px solid rgba(187, 134, 252, 0.2)'
            : '1px solid rgba(0, 105, 62, 0.1)',
          '&:hover': {
            boxShadow: darkMode
              ? '0 3px 10px rgba(255, 255, 255, 0.2)'
              : '0 3px 10px rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
          <TableHead
            sx={{
              backgroundColor: darkMode ? '#333333' : '#F8F8F8',
              position: 'sticky',
              top: 0,
              zIndex: 1,
              transition: 'background-color 0.3s ease',
            }}
          >
            <TableRow>
              {/* Combined column for Subject/Number/Title/Section - made narrower */}
              <TableCell
                sx={{
                  color: darkMode ? '#FFFFFF' : '#333333',
                  textAlign: 'left',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '16px 12px',
                  borderBottom: '2px solid #E0E0E0',
                  borderColor: darkMode ? '#444444' : '#E0E0E0',
                  backgroundColor: darkMode ? '#333333' : '#F8F8F8',
                  fontFamily: 'SF Pro Display, sans-serif',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                  width: '20%', // Reduced from 30% to 20%
                }}
              >
                Course
              </TableCell>
              
              {/* Other table headers - adjusted widths */}
              {[
                { header: 'Timing', width: '12%' },
                { header: 'Location', width: '12%' },
                { header: 'Instructor', width: '12%' },
                { header: 'Enrollment', width: '12%' },
                { header: 'Notifications', width: '12%' },
                { header: 'Add to Calendar', width: '12%' },
                { header: 'Add', width: '8%' },
              ].map(({ header, width }, index) => (
                <TableCell
                  key={index}
                  sx={{
                    color: darkMode ? '#FFFFFF' : '#333333',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '1rem',
                    padding: '16px 12px',
                    borderBottom: '2px solid #E0E0E0',
                    borderColor: darkMode ? '#444444' : '#E0E0E0',
                    backgroundColor: darkMode ? '#333333' : '#F8F8F8',
                    fontFamily: 'SF Pro Display, sans-serif',
                    transition: 'background-color 0.3s ease, color 0.3s ease',
                    width: width,
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {courses.map((course, index) => {
              const rowBackground =
                index % 2 === 0
                  ? darkMode
                    ? '#1C1F43'
                    : '#FFFFFF'
                  : darkMode
                  ? '#24273c'
                  : '#F9F9F9';

              return (
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor: rowBackground,
                    transition: 'background-color 0.3s ease',
                    '&:hover': {
                      backgroundColor: darkMode ? '#2a2a2a' : '#E5E5EA',
                    },
                    cursor: 'default',
                  }}
                >
                  {/* Course Cell: Subject + Number, Title, and Section - made narrower */}
                  <TableCell
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(course);
                    }}
                    sx={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'color 0.3s ease',
                      fontFamily: 'SF Pro Display, sans-serif',
                      width: '20%', // Reduced from 30% to 20%
                      maxWidth: '20%',
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {/* Subject and Number (darker color) */}
                      <Typography 
                        sx={{ 
                          color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)', 
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {course.subj} {course.num}
                      </Typography>
                      
                      {/* Course Title (color-highlighted) */}
                      <Typography 
                        sx={{ 
                          color: darkMode ? '#BB86FC' : '#571ce0',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                          lineHeight: 1.3,
                          fontStyle: course.title ? 'normal' : 'italic',
                          // Add text overflow handling for long titles
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {course.title || 'No title available'}
                      </Typography>
                      
                      {/* Section (always show) */}
                      <Typography
                        sx={{
                          color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                          fontSize: '0.85rem',
                          fontWeight: 400,
                          lineHeight: 1.2,
                          mt: 0.5,
                        }}
                      >
                        Section {course.sec}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Timing Cell - now wider */}
                  <TableCell
                    sx={{
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                      padding: '10px',
                      fontWeight: 400,
                      fontSize: '0.95rem',
                      textAlign: 'left',
                      transition: 'color 0.3s ease',
                      fontFamily: 'SF Pro Display, sans-serif',
                      width: '12%',
                    }}
                  >
                    {(() => {
                      const { mainTime, xHour } = formatTiming(course.timing);
                      
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          {/* Main time */}
                          <Typography sx={{ 
                            color: darkMode ? '#FFFFFF' : '#1D1D1F',
                            fontSize: '0.95rem',
                            fontWeight: 400,
                          }}>
                            {mainTime}
                          </Typography>
                          
                          {/* X-hour (if present) */}
                          {xHour && (
                            <Tooltip title={`X-Hour: ${xHour}`} placement="top">
                              <Typography sx={{ 
                                color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                fontSize: '0.85rem', 
                                fontWeight: 400,
                                fontStyle: 'italic',
                                cursor: 'help',
                                mt: 0.5,
                                '&:hover': {
                                  textDecoration: 'underline',
                                  textDecorationStyle: 'dotted',
                                }
                              }}>
                                +X-Hour
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })()}
                  </TableCell>

                  {/* Location Cell (merged Room and Building) - now wider */}
                  <TableCell
                    sx={{
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                      padding: '10px',
                      fontWeight: 400,
                      fontSize: '0.95rem',
                      textAlign: 'left',
                      transition: 'color 0.3s ease',
                      fontFamily: 'SF Pro Display, sans-serif',
                      width: '12%',
                    }}
                  >
                    <Typography
                      sx={{
                        color: formatLocation(course.room, course.building) === 'Location not yet available'
                          ? (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')
                          : (darkMode ? '#FFFFFF' : '#1D1D1F'),
                        fontStyle: formatLocation(course.room, course.building) === 'Location not yet available' ? 'italic' : 'normal',
                        fontSize: '0.95rem',
                        fontWeight: 400,
                      }}
                    >
                      {formatLocation(course.room, course.building)}
                    </Typography>
                  </TableCell>

                  {/* Instructor - match course title style exactly with working links */}
                  <TableCell
                    sx={{
                      padding: '10px',
                      fontWeight: 400,
                      fontSize: '0.95rem',
                      textAlign: 'left',
                      transition: 'color 0.3s ease',
                      fontFamily: 'SF Pro Display, sans-serif',
                      width: '12%',
                      maxWidth: '12%',
                      whiteSpace: 'normal',
                      // Apply the styling directly to the cell to override ProfessorCell defaults
                      '& *': {
                        color: `${darkMode ? '#BB86FC' : '#571ce0'} !important`, // Match course title color exactly
                        fontWeight: '500 !important', // Match course title weight
                        fontSize: '0.95rem !important',
                        lineHeight: '1.3 !important',
                        textDecoration: 'none !important',
                        '&:hover': {
                          textDecoration: 'underline !important', // Match course title hover effect
                        },
                      },
                    }}
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

                  {/* Enrollment cell - with review gate (first column of three-column span) */}
                  <TableCell 
                    align="center" 
                    sx={{ 
                      padding: '12px 16px', 
                      verticalAlign: 'middle', 
                      position: 'relative',
                      width: '12%',
                      // Remove borders for locked columns
                      ...(!hasUnlockedFeatures && {
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                      })
                    }}
                  >
                    {!hasUnlockedFeatures ? (
                      // Only render the overlay in the middle column every 5 rows, but span across all 3
                      index % 5 === 2 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: '-200%', // Extend to cover all 3 columns
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
                            {(() => {
                              const requiredTerms = getPreviousTerms(currentTerm);
                              const { reviewCount, gradeCount } = getContributionCounts(userReviews, userGradeSubmissions, currentTerm);
                              const totalContributions = reviewCount + gradeCount;
                              const needed = Math.max(0, 3 - totalContributions);
                              
                              if (needed > 0) {
                                return `Need ${needed} more contribution${needed > 1 ? 's' : ''} from ${requiredTerms.join(' or ')} to unlock. You have ${reviewCount} review${reviewCount !== 1 ? 's' : ''} and ${gradeCount} median${gradeCount !== 1 ? 's' : ''}.`;
                              } else {
                                return `You have ${reviewCount} review${reviewCount !== 1 ? 's' : ''} and ${gradeCount} median${gradeCount !== 1 ? 's' : ''} from ${requiredTerms.join(' and ')}.`;
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
                            fontStyle: 'italic'
                          }}
                        >
                          Loading...
                        </Typography>
                      ) : !course.enrollmentStatus && !course.enrollmentLimit && !course.enrollmentCurrent ? (
                        <Typography 
                          sx={{ 
                            fontSize: '0.9rem', 
                            color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                            fontStyle: 'italic'
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
                          borderRadius: '8px',
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

                  {/* Notify When Available Button - with review gate (middle column) */}
                  <TableCell 
                    sx={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      verticalAlign: 'middle',
                      position: 'relative',
                      width: '12%',
                      // Remove borders for locked columns
                      ...(!hasUnlockedFeatures && {
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                      }),
                      // Add these styles to ensure proper centering
                      '& > *': {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textDecoration: 'none !important', // Remove underlines
                        borderBottom: 'none !important',   // Remove bottom border/line
                      }
                    }}
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
                          textDecoration: 'none !important', // Remove any text decoration
                          borderBottom: 'none !important',   // Remove any bottom borders
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
                          borderRadius: '8px',
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

                  {/* Add to Calendar Button - with review gate (third column) */}
                  <TableCell
                    sx={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      height: '48px',
                      verticalAlign: 'middle',
                      width: '12%',
                      position: 'relative',
                      // Remove borders for locked columns
                      ...(!hasUnlockedFeatures && {
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                      })
                    }}
                  >
                    {!hasUnlockedFeatures ? (
                      // Empty for locked state - overlay is handled by first column
                      null
                    ) : (
                      course.period !== 'ARR' && course.period !== 'FS' && (
                        <Box sx={{ 
                          display: 'flex', 
                          gap: '12px',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Tooltip title="Add to Google Calendar" arrow placement="top">
                            <span>
                            <GoogleCalendarButton 
                                darkMode={darkMode} 
                                onClick={() => handleAddToCalendar(course)}
                            >
                                <div className="icon">
                                <GoogleIcon />
                                </div>
                            </GoogleCalendarButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title="Add to Apple Calendar" arrow placement="top">
                            <span>
                              <AppleCalendarButton darkMode={darkMode} onClick={() => handleAddToAppleCalendar(course)}>
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
                      padding: '12px',
                      textAlign: 'left',
                      width: '8%',
                    }}
                  >
                    {/* Check if course is already in selectedCourses */}
                    {selectedCourses.some(
                      (c) => c.subj === course.subj && c.num === course.num && c.sec === course.sec
                    ) ? (
                      <IconButton onClick={() => handleRemoveCourse(course)}>
                        <DeleteIcon sx={{ color: '#FF3B30' }} />
                      </IconButton>
                    ) : (
                      <IconButton 
                        onClick={() => handleAddCourse(course)}
                        sx={{ 
                          color: darkMode ? '#BB86FC' : '#00693E',
                          backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.1)',
                          '&:hover': {
                            backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.2)',
                          }
                        }}
                      >
                        <AddIcon />
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