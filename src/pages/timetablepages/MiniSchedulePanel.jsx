// src/pages/timetablepages/MiniSchedulePanel.jsx
import React from 'react';
import { 
  Box, Paper, Typography, IconButton, Button, 
  Divider, TextField, Slide 
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleVisualization from './ScheduleVisualization';

const MiniSchedulePanel = ({
  open,
  expanded,
  darkMode,
  selectedCourses,
  searchTerm,
  handleSearch,
  handleRemoveCourse,
  handleAddCourse,
  courses,
  toggleSize,
  handleClose,
  setViewMode
}) => {
  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: expanded ? '50%' : '320px',
          bgcolor: darkMode ? 'rgba(28, 31, 67, 0.97)' : 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(10px)',
          borderLeft: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          boxShadow: '-5px 0px 25px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: darkMode ? '#FFFFFF' : '#000000',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Weekly Schedule Planner
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedCourses.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setViewMode('calendar');
                  handleClose();
                }}
                startIcon={<FullscreenIcon />}
                sx={{
                  color: darkMode ? '#BB86FC' : '#00693E',
                  borderColor: darkMode ? '#BB86FC' : '#00693E',
                  '&:hover': {
                    borderColor: darkMode ? '#9A66EA' : '#00522F',
                    backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.08)' : 'rgba(0, 105, 62, 0.08)',
                  },
                  fontSize: '0.8rem',
                  py: 0.5,
                }}
              >
                Full View
              </Button>
            )}
            <IconButton 
              onClick={toggleSize} 
              size="small"
              sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}
            >
              {expanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
            </IconButton>
            <IconButton 
              onClick={handleClose} 
              size="small"
              sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {selectedCourses.length > 0 ? (
            <Box sx={{ p: 2, flexGrow: 1 }}>
              <ScheduleVisualization 
                selectedCourses={selectedCourses} 
                darkMode={darkMode} 
                onRemoveCourse={handleRemoveCourse}
              />
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              p: 4,
              flexGrow: 1,
            }}>
              <CalendarMonthIcon sx={{ fontSize: 60, color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', mb: 2 }} />
              <Typography sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textAlign: 'center' }}>
                No courses added yet
              </Typography>
              <Typography sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textAlign: 'center', mt: 1 }}>
                Press the "Add" button next to courses in the table
              </Typography>
            </Box>
          )}
        </Box>
        
        {selectedCourses.length > 0 && (
          <>
            <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: darkMode ? '#BB86FC' : '#00693E', fontWeight: 600 }}>
                Your Selected Courses:
              </Typography>
              <Box sx={{ maxHeight: '180px', overflowY: 'auto' }}>
                {selectedCourses.map((course, index) => (
                  <Box 
                    key={`${course.subj}${course.num}-${index}`}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.5,
                      borderBottom: index < selectedCourses.length - 1 ? 
                        (darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)') : 'none'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
                      {course.subj} {course.num}: {course.title.length > 20 ? `${course.title.substring(0, 20)}...` : course.title}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveCourse(course)}
                      sx={{ color: darkMode ? '#FF5252' : '#D32F2F' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
        
        {/* Quick Add Section */}
        <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: darkMode ? '#BB86FC' : '#00693E', fontWeight: 600 }}>
            Quick Add Courses:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Course Code (e.g., COSC 1)"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                sx: {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  color: darkMode ? '#FFFFFF' : '#000000',
                  fontSize: '0.9rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? '#BB86FC' : '#00693E',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
            {courses.slice(0, 5).map((course, index) => (
              <Box 
                key={`quick-${course.subj}${course.num}-${index}`}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  borderBottom: index < Math.min(courses.length, 5) - 1 ? 
                    (darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)') : 'none'
                }}
              >
                <Typography variant="body2" sx={{ color: darkMode ? '#FFFFFF' : '#000000', fontSize: '0.85rem' }}>
                  {course.subj} {course.num}: {course.title?.length > 15 ? `${course.title.substring(0, 15)}...` : course.title}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleAddCourse(course)}
                  sx={{ 
                    color: darkMode ? '#BB86FC' : '#00693E',
                    backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.1)',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.2)',
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {courses.length > 5 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  mt: 1, 
                  color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  fontStyle: 'italic'
                }}
              >
                + {courses.length - 5} more courses available
              </Typography>
            )}
            {courses.length === 0 && (
              <Typography 
                variant="body2" 
                sx={{ 
                  py: 2,
                  color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}
              >
                Type to search for courses
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};

export default MiniSchedulePanel;