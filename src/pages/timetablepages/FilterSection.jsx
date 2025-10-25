// src/pages/timetablepages/FilterSection.jsx
import React, { useState, useMemo } from 'react';
import {
  Box, TextField, Button, Typography, InputAdornment, IconButton, Paper,
  CircularProgress, Chip, FormControl, Select, MenuItem
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
  enableEnrollmentData,
  // Major filtering props
  selectedMajor,
  handleMajorChange,
  majors,
  clearAllFilters,
  // Instructor filtering props
  selectedInstructor,
  handleInstructorChange,
  filteredInstructors
}) => {
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  // Memoize filtered subjects for better performance
  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects;
    return subjects.filter(subject => 
      subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]);



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

  const handleInstructorSelect = (instructor) => {
    handleInstructorChange({ target: { value: instructor } });
    setIsSubjectDropdownOpen(false);
  };

  const hasActiveFilters = selectedSubject || selectedMajor || selectedInstructor;

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
        {termType === 'summer' ? 'Summer' : termType === 'winter' ? 'Winter' : 'Fall'} {termType === 'winter' ? '2026' : '2025'} Timetable.
      </Typography>
      
      {/* Horizontal Navigation Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
            <Box
              onClick={() => setTermType('winter')}
              sx={{
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: termType === 'winter' 
                  ? (darkMode ? 'rgba(187, 134, 252, 0.15)' : 'rgba(0, 105, 62, 0.08)')
                  : 'transparent',
                color: termType === 'winter'
                  ? (darkMode ? '#BB86FC' : '#00693E')
                  : (darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'),
                fontWeight: termType === 'winter' ? 600 : 400,
                fontSize: '0.9rem',
                fontFamily: 'SF Pro Display, sans-serif',
                '&:hover': {
                  backgroundColor: termType !== 'winter'
                    ? (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')
                    : (darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.1)')
                }
              }}
            >
              Winter 2026
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

          {/* Major Selection Dropdown */}
          {majors && majors.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={selectedMajor || ''}
                onChange={handleMajorChange}
                displayEmpty
                sx={{
                  color: darkMode ? '#FFFFFF' : '#000000',
                  backgroundColor: darkMode ? 'rgba(28, 31, 67, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '6px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(187, 134, 252, 0.5)' : 'rgba(0, 105, 62, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? '#BB86FC' : '#00693E',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                      color: darkMode ? '#FFFFFF' : '#000000',
                      maxHeight: 300,
                    }
                  }
                }}
              >
                <MenuItem value="">
                  <em>All Majors</em>
                </MenuItem>
                {majors.map((major) => (
                  <MenuItem key={major} value={major}>
                    {major}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="text"
              size="small"
              onClick={clearAllFilters}
              sx={{
                color: darkMode ? '#FF6B6B' : '#D32F2F',
                fontSize: '0.8rem',
                fontWeight: 500,
                textTransform: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                }
              }}
            >
              Clear All
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
            placeholder="Search by course name, subject, or instructor..."
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
          
          {/* Enhanced dropdown for subjects and instructors */}
          {(filteredSubjects.length > 0 || filteredInstructors.length > 0) && isSubjectDropdownOpen && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: '48px',
                left: 0,
                width: '100%',
                maxHeight: '400px',
                overflowY: 'auto',
                borderRadius: '12px',
                zIndex: 10,
                backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Subjects Section */}
              {filteredSubjects.length > 0 && (
                <>
                  <Box sx={{
                    padding: '8px 16px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderBottom: '1px solid',
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Departments
                    </Typography>
                  </Box>
                  
                  {/* "All Subjects" option */}
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
                    <Typography sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>All Departments</Typography>
                    {selectedSubject === '' && (
                      <CheckCircleIcon sx={{ fontSize: '18px', color: darkMode ? '#BB86FC' : '#00693E' }} />
                    )}
                  </Box>
                  
                  {/* Subject items */}
                  {filteredSubjects.map((subject, index) => (
                    <Box
                      key={`subject-${index}`}
                      onClick={() => handleSubjectSelect(subject)}
                      sx={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        borderBottom: index < filteredSubjects.length - 1 ? '1px solid' : 'none',
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
                </>
              )}
              
              {/* Instructors Section */}
              {filteredInstructors.length > 0 && (
                <>
                  <Box sx={{
                    padding: '8px 16px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderBottom: '1px solid',
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Instructors
                    </Typography>
                  </Box>
                  
                  {/* "All Instructors" option */}
                  <Box
                    onClick={() => handleInstructorSelect('')}
                    sx={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid',
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      backgroundColor: selectedInstructor === '' ? (darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.05)') : 'transparent',
                      color: selectedInstructor === '' ? (darkMode ? '#BB86FC' : '#00693E') : (darkMode ? '#FFFFFF' : '#000000'),
                      fontWeight: selectedInstructor === '' ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      },
                    }}
                  >
                    <Typography sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>All Instructors</Typography>
                    {selectedInstructor === '' && (
                      <CheckCircleIcon sx={{ fontSize: '18px', color: darkMode ? '#BB86FC' : '#00693E' }} />
                    )}
                  </Box>
                  
                  {/* Instructor items */}
                  {filteredInstructors.map((instructor, index) => (
                    <Box
                      key={`instructor-${index}`}
                      onClick={() => handleInstructorSelect(instructor)}
                      sx={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        borderBottom: index < filteredInstructors.length - 1 ? '1px solid' : 'none',
                        borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        backgroundColor: selectedInstructor === instructor ? (darkMode ? 'rgba(187, 134, 252, 0.1)' : 'rgba(0, 105, 62, 0.05)') : 'transparent',
                        color: selectedInstructor === instructor ? (darkMode ? '#BB86FC' : '#00693E') : (darkMode ? '#FFFFFF' : '#000000'),
                        fontWeight: selectedInstructor === instructor ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': {
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        },
                      }}
                    >
                      <Typography sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>{instructor}</Typography>
                      {selectedInstructor === instructor && (
                        <CheckCircleIcon sx={{ fontSize: '18px', color: darkMode ? '#BB86FC' : '#00693E' }} />
                      )}
                    </Box>
                  ))}
                </>
              )}
            </Paper>
          )}
        </Box>
      </Box>


      
      {/* Active Filters Display */}
      {(selectedSubject || selectedMajor || selectedInstructor) && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          mt: 2
        }}>
          <Typography variant="body2" sx={{ 
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            mr: 1
          }}>
            Active filters:
          </Typography>
          
          {selectedSubject && (
            <Chip
              label={`Dept: ${selectedSubject}`}
              onDelete={() => handleSubjectChange({ target: { value: '' } })}
              sx={{
                backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.15)' : 'rgba(0, 105, 62, 0.08)',
                color: darkMode ? '#BB86FC' : '#00693E',
                '& .MuiChip-deleteIcon': {
                  color: darkMode ? '#BB86FC' : '#00693E',
                }
              }}
            />
          )}
          
          {selectedMajor && (
            <Chip
              label={`Major: ${selectedMajor}`}
              onDelete={() => handleMajorChange({ target: { value: '' } })}
              sx={{
                backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.15)' : 'rgba(0, 105, 62, 0.08)',
                color: darkMode ? '#BB86FC' : '#00693E',
                '& .MuiChip-deleteIcon': {
                  color: darkMode ? '#BB86FC' : '#00693E',
                }
              }}
            />
          )}
          
          {selectedInstructor && (
            <Chip
              label={`Instructor: ${selectedInstructor}`}
              onDelete={() => handleInstructorChange({ target: { value: '' } })}
              sx={{
                backgroundColor: darkMode ? 'rgba(187, 252, 134, 0.15)' : 'rgba(76, 175, 80, 0.08)',
                color: darkMode ? '#4CAF50' : '#2E7D32',
                '& .MuiChip-deleteIcon': {
                  color: darkMode ? '#4CAF50' : '#2E7D32',
                }
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default FilterSection;