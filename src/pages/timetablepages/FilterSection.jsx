// src/pages/timetablepages/FilterSection.jsx
import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, InputAdornment, IconButton, Paper,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RefreshIcon from '@mui/icons-material/Refresh';

const FilterSection = ({
  darkMode,
  searchTerm,
  handleSearch,
  selectedSubject,
  handleSubjectChange,
  subjects,
  showSelectedCourses,
  setShowSelectedCourses,
  isMobile,
  termType,
  setTermType,
  onRefreshEnrollments,
  isRefreshingEnrollments,
  showRefreshButton,
  hasUnlockedFeatures,
  enableEnrollmentData
}) => {
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  const handleSearchFocus = () => {
    // Only open dropdown if there's search text
    if (searchTerm.length > 0 && subjects.length > 0) {
      setIsSubjectDropdownOpen(true);
    }
  };

  const handleSearchBlur = () => {
    // Use setTimeout to allow click events on dropdown to fire before closing
    setTimeout(() => {
      setIsSubjectDropdownOpen(false);
    }, 200);
  };
  
  const handleSubjectSelect = (subject) => {
    handleSubjectChange({ target: { value: subject } });
    setIsSubjectDropdownOpen(false);
  };

  return (
    <Box sx={{
      width: '100%',
      mb: 3
    }}>
      {/* Main title */}
      <Typography
        variant="h1"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '2rem', sm: '3rem' },
          color: darkMode ? '#FFFFFF' : '#000000',
          marginBottom: '16px',
          fontFamily: 'SF Pro Display, sans-serif',
          transition: 'color 0.3s ease',
        }}
      >
        {termType === 'summer' ? 'Summer' : 'Fall'} 2025 Timetable.
      </Typography>
      
      {/* Horizontal Navigation Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Term Toggle Pills */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: '8px', 
              padding: '2px',
              backgroundColor: darkMode ? 'rgba(28, 31, 67, 0.8)' : 'rgba(240, 240, 245, 0.8)',
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              marginRight: '12px',
            }}
          >
            <Box
              onClick={() => setTermType('summer')}
              sx={{
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: termType === 'summer' 
                  ? (darkMode ? 'rgba(187, 134, 252, 0.15)' : 'rgba(0, 105, 62, 0.08)')
                  : 'transparent',
                color: termType === 'summer'
                  ? (darkMode ? '#BB86FC' : '#00693E')
                  : (darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'),
                fontWeight: termType === 'summer' ? 600 : 400,
                fontSize: '0.9rem',
                fontFamily: 'SF Pro Display, sans-serif',
                '&:hover': {
                  backgroundColor: termType !== 'summer'
                    ? (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')
                    : (darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.1)')
                }
              }}
            >
              Summer 2025
            </Box>
            <Box
              onClick={() => setTermType('fall')}
              sx={{
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: termType === 'fall' 
                  ? (darkMode ? 'rgba(187, 134, 252, 0.15)' : 'rgba(0, 105, 62, 0.08)')
                  : 'transparent',
                color: termType === 'fall'
                  ? (darkMode ? '#BB86FC' : '#00693E')
                  : (darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'),
                fontWeight: termType === 'fall' ? 600 : 400,
                fontSize: '0.9rem',
                fontFamily: 'SF Pro Display, sans-serif',
                '&:hover': {
                  backgroundColor: termType !== 'fall'
                    ? (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')
                    : (darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.1)')
                }
              }}
            >
              Fall 2025
            </Box>
          </Box>
          
          {/* My Courses Button */}
          <Button
            variant="text"
            startIcon={showSelectedCourses ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={() => setShowSelectedCourses(!showSelectedCourses)}
            sx={{
              color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              fontSize: '0.9rem',
              fontWeight: 500,
              textTransform: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
              }
            }}
          >
            My Courses
          </Button>

          {/* Refresh Enrollment Button */}
          {showRefreshButton && enableEnrollmentData && hasUnlockedFeatures && (
            <Button
              variant="text"
              size="small"
              startIcon={isRefreshingEnrollments ? (
                <CircularProgress size={16} sx={{ color: darkMode ? '#BB86FC' : '#571ce0' }} />
              ) : (
                <RefreshIcon />
              )}
              onClick={onRefreshEnrollments}
              disabled={isRefreshingEnrollments}
              sx={{
                color: darkMode ? '#BB86FC' : '#571ce0',
                fontSize: '0.9rem',
                fontWeight: 500,
                textTransform: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.08)' : 'rgba(87, 28, 224, 0.08)',
                },
                '&:disabled': {
                  opacity: 0.7,
                  color: darkMode ? 'rgba(187, 134, 252, 0.5)' : 'rgba(87, 28, 224, 0.5)',
                }
              }}
            >
              {isRefreshingEnrollments ? 'Refreshing...' : 'Refresh Enrollments'}
            </Button>
          )}
        </Box>
        
        {/* Search Box */}
        <Box sx={{ 
          position: 'relative',
          width: { xs: '100%', sm: '400px', md: '500px' },
          maxWidth: '100%',
        }}>
          <TextField
            variant="outlined"
            placeholder="Search by course, subject or instructor..."
            value={searchTerm}
            onChange={handleSearch}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            sx={{
              width: '100%',
              borderRadius: '30px',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              '& .MuiOutlinedInput-root': {
                borderRadius: '30px',
                backgroundColor: darkMode ? 'rgba(28, 31, 67, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.12)',
                },
                '&.Mui-focused': {
                  boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.15)',
                },
                '& fieldset': {
                  borderColor: 'transparent',
                  borderWidth: '1px',
                  transition: 'all 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'rgba(187, 134, 252, 0.5)' : 'rgba(0, 105, 62, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: darkMode ? '#BB86FC' : '#00693E',
                  borderWidth: '1px',
                },
              },
              '& .MuiInputBase-input': {
                padding: '10px 16px 10px 46px',
                fontSize: '0.9rem',
                color: darkMode ? '#FFFFFF' : '#000000',
                fontFamily: 'SF Pro Display, sans-serif',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment 
                  position="start" 
                  sx={{ 
                    position: 'absolute', 
                    left: '16px',
                    pointerEvents: 'none'
                  }}
                >
                  <SearchIcon sx={{ color: darkMode ? '#BB86FC' : '#00693E', fontSize: '20px' }} />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Subject filter dropdown */}
          {subjects.length > 0 && isSubjectDropdownOpen && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: '48px',
                left: 0,
                width: '100%',
                maxHeight: '300px',
                overflowY: 'auto',
                borderRadius: '12px',
                zIndex: 10,
                backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* "All Subjects" option at the top */}
              <Box
                onClick={() => handleSubjectSelect('')}
                sx={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid',
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  backgroundColor: selectedSubject === '' ? (darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.05)') : 'transparent',
                  color: selectedSubject === '' ? (darkMode ? '#BB86FC' : '#00693E') : (darkMode ? '#FFFFFF' : '#000000'),
                  fontWeight: selectedSubject === '' ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  },
                }}
              >
                <Typography sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>All Subjects</Typography>
                {selectedSubject === '' && (
                  <CheckCircleIcon sx={{ fontSize: '18px', color: darkMode ? '#BB86FC' : '#00693E' }} />
                )}
              </Box>
              
              {/* Filter subject items to match current search */}
              {subjects
                .filter(subject => !searchTerm || subject.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((subject, index) => (
                  <Box
                    key={index}
                    onClick={() => handleSubjectSelect(subject)}
                    sx={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: index < subjects.length - 1 ? '1px solid' : 'none',
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      backgroundColor: selectedSubject === subject ? (darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.05)') : 'transparent',
                      color: selectedSubject === subject ? (darkMode ? '#BB86FC' : '#00693E') : (darkMode ? '#FFFFFF' : '#000000'),
                      fontWeight: selectedSubject === subject ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      },
                    }}
                  >
                    <Typography sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>{subject}</Typography>
                    {selectedSubject === subject && (
                      <CheckCircleIcon sx={{ fontSize: '18px', color: darkMode ? '#BB86FC' : '#00693E' }} />
                    )}
                  </Box>
                ))}
            </Paper>
          )}
        </Box>
      </Box>
      
      {/* Selected subject pill/chip - will show beneath search field */}
      {selectedSubject && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.15)' : 'rgba(0, 105, 62, 0.08)',
            borderRadius: '20px',
            alignSelf: 'flex-start',
            width: 'fit-content',
          }}
        >
          <Typography
            sx={{
              color: darkMode ? '#BB86FC' : '#00693E',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginRight: '8px',
              fontFamily: 'SF Pro Display, sans-serif',
            }}
          >
            {selectedSubject}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleSubjectSelect('')}
            sx={{
              padding: '2px',
              color: darkMode ? '#BB86FC' : '#00693E',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.25)' : 'rgba(0, 105, 62, 0.15)',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: '16px' }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default FilterSection;