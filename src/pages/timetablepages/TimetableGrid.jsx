// src/pages/timetablepages/TimetableGrid.jsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Box, Tooltip, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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
  isMobile
}) => {
  return (
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
            {/* Combined column for Subject/Number/Title/Section */}
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
                width: '30%', // Wider cell for combined content
              }}
            >
              Course
            </TableCell>
            
            {/* Other table headers */}
            {[
              'Timing',
              'Room',
              'Building',
              'Instructor',
              'Enrollment',
              'Add to Calendar',
              'Notifications',
              'Add',
            ].map((header, index) => (
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
                {/* Course Cell: Subject + Number, Title, and Section */}
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

                <TableCell
  sx={{
    color: darkMode ? '#FFFFFF' : '#1D1D1F',
    padding: '10px',
    fontWeight: 400,
    fontSize: '0.95rem',
    textAlign: 'left',
    transition: 'color 0.3s ease',
    fontFamily: 'SF Pro Display, sans-serif',
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

                {/* Room */}
                <TableCell
                  sx={{
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    padding: '10px',
                    fontWeight: 400,
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    transition: 'color 0.3s ease',
                    fontFamily: 'SF Pro Display, sans-serif',
                  }}
                >
                  {course.room || 'N/A'}
                </TableCell>

                {/* Building */}
                <TableCell
                  sx={{
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    padding: '10px',
                    fontWeight: 400,
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    transition: 'color 0.3s ease',
                    fontFamily: 'SF Pro Display, sans-serif',
                  }}
                >
                  {course.building || 'N/A'}
                </TableCell>

                {/* Instructor */}
                <TableCell
                  sx={{
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    padding: '10px',
                    fontWeight: 400,
                    fontSize: '0.95rem',
                    textAlign: 'left',
                    transition: 'color 0.3s ease',
                    fontFamily: 'SF Pro Display, sans-serif',
                    width: '150px',
                    maxWidth: '150px',
                    whiteSpace: 'normal',
                  }}
                >
                  <ProfessorCell instructor={course.instructor} darkMode={darkMode} />
                </TableCell>

                {/* Enrollment cell */}
                <TableCell align="center" sx={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                  {!enrollmentDataReady ? (
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
                  )}
                </TableCell>

                {/* Add to Calendar Button */}
                <TableCell
                  sx={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    height: '48px',
                    verticalAlign: 'middle',
                    width: '160px',
                  }}
                >
                  {course.period !== 'ARR' && course.period !== 'FS' && (
                    <Box sx={{ 
                      display: 'flex', 
                      gap: '12px',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Tooltip title="Add to Google Calendar" arrow placement="top">
                        <span>
                        <GoogleCalendarButton 
                            isDarkMode={darkMode} 
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
                  )}
                </TableCell>

                {/* Notify When Available Button */}
                <NotificationButton 
                  course={course}
                  isPriorityEligible={isPriorityEligible}
                  isFallAddDropClosed={isFallAddDropClosed}
                  notificationPriority={notificationPriority}
                  toggleNotificationPriority={toggleNotificationPriority}
                  handleNotifyDrop={handleNotifyDrop}
                  darkMode={darkMode}
                />
                
                {/* Add Button Cell */}
                <TableCell
                  sx={{
                    padding: '12px',
                    textAlign: 'left',
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
  );
};

export default TimetableGrid;