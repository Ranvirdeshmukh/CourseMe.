import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  TextField, 
  InputAdornment,
  Button,
  Typography, 
  Collapse, 
  CircularProgress,
  Paper,
  Chip,
  LinearProgress,
  Fade,
  Tooltip,
  List,
  ListItem,
  ClickAwayListener
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';
import ParticleTextCarousel from '../components/ParticleTextCarousel';
import { doc, getDoc } from 'firebase/firestore';

const MobileLandingPage = ({ 
  darkMode, 
  handleSearch, 
  question, 
  setQuestion, 
  loading, 
  answer, 
  department, 
  courseNumber, 
  documentName, 
  showScrollMessage,
  scrollProgress,
  difficulty,
  sentiment,
  getDifficultyLevel,
  getSentimentLevel,
  getColor,
  currentUser,
  handleLoginRedirect,
  typingMessages,
  // New props for autocomplete
  searchSuggestions = [],
  showSuggestions = false,
  setShowSuggestions = () => {},
  handleSearchInputChange = () => {},
  handleSuggestionClick = () => {},
  isTyping = false,
  popularSearches = [],
  searchProfessors
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const navigate = useNavigate();

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
  };

  // Style with CSS keyframes for animations - mobile version
  const mobileStyles = {
    '@keyframes subtlePulse': {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '50%': { transform: 'scale(1.05)', opacity: 0.9 },
      '100%': { transform: 'scale(1)', opacity: 1 }
    },
    '@keyframes fadeIn': {
      '0%': { opacity: 0, transform: 'translateX(-10px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' }
    },
    '@keyframes float': {
      '0%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-5px)' },
      '100%': { transform: 'translateY(0px)' }
    }
  };

  // Mobile-specific ScaleMeter component
  const MobileScaleMeter = ({ value, title, getLevelFunc }) => (
    <Tooltip
      title={`${getLevelFunc(value)} (${value.toFixed(2)})`}
      placement="top"
      arrow
    >
      <Box sx={{ width: '100%', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
          {title}
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: 8,
            bgcolor: '#e0e0e0',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${((value + 1) / 2) * 100}%`,
              height: '100%',
              bgcolor: getColor(value),
              transition: 'width 0.5s ease-in-out',
            }}
          />
        </Box>
      </Box>
    </Tooltip>
  );

  // Format the AI answer with markdown - mobile optimized
  const formatAnswer = (text) => {
    const customRenderers = {
      p: ({ children }) => (
        <Typography
          variant="body1"
          sx={{
            color: darkMode ? '#ffffff' : '#333333',
            textAlign: 'left',
            mb: 2,
            fontSize: '0.95rem',
          }}
        >
          {children}
        </Typography>
      ),
      strong: ({ children }) => (
        <Box component="span" sx={{ fontWeight: 'bold' }}>
          {children}
        </Box>
      ),
      h1: ({ children }) => (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            my: 1.5,
            color: darkMode ? '#ffffff' : '#333333',
          }}
        >
          {children}
        </Typography>
      ),
      h2: ({ children }) => (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            my: 1.5,
            color: darkMode ? '#ffffff' : '#333333',
          }}
        >
          {children}
        </Typography>
      ),
    };
  
    return (
      <ReactMarkdown components={customRenderers} remarkPlugins={[remarkGfm]}>
        {text}
      </ReactMarkdown>
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch(e);
    // Don't collapse search after submitting on mobile to maintain context
  };

  return (
    <Box sx={{ width: '100%', ...mobileStyles }}>
      {/* Mobile Search Bar */}
      <Box sx={{ 
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 10,
        display: { xs: 'block', sm: 'none' }
      }}>
        {/* Search Icon Button */}
        {!searchExpanded && (
          <IconButton 
            onClick={toggleSearch}
            sx={{
              backgroundColor: darkMode ? 'rgba(87, 28, 224, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(87, 28, 224, 1)' : 'rgba(0, 0, 0, 1)',
              },
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              animation: answer ? 'none' : 'pulse 2s infinite'
            }}
          >
            <SearchIcon />
          </IconButton>
        )}

        {/* Expandable Search Bar */}
        <Collapse in={searchExpanded} timeout="auto">
          <Box
            component="form"
            onSubmit={handleFormSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              bgcolor: darkMode ? 'rgba(12, 15, 51, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              p: 2,
              borderRadius: '12px',
              width: '100vw',
              maxWidth: '350px',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
              animation: 'fadeIn 0.3s ease-out',
              position: 'relative'
            }}
          >
            <Box sx={{ display: 'flex', mb: showSuggestions ? 0 : 2, position: 'relative' }}>
              <ClickAwayListener onClickAway={() => {
                setShowSuggestions(false);
                // Don't collapse the entire search bar when clicking away from suggestions
              }}>
                <Box sx={{ flexGrow: 1, position: 'relative' }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search courses..."
                    value={question}
                    onChange={handleSearchInputChange}
                    autoComplete="off"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '25px',
                        bgcolor: darkMode ? '#252836' : '#f5f5f5',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: darkMode ? '#bbbbbb' : '#757575' }} />
                        </InputAdornment>
                      ),
                      endAdornment: question ? (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setQuestion('');
                              setShowSuggestions(false);
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                  
                  {/* Mobile search suggestions dropdown */}
                  {showSuggestions && (
                    <Paper
                      elevation={3}
                      sx={{
                        position: 'absolute',
                        top: '50px',
                        left: 0,
                        right: 0,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        borderRadius: '12px',
                        zIndex: 10,
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                        bgcolor: darkMode ? '#1C093F' : '#ffffff',
                      }}
                    >
                      <List dense disablePadding>
                        {isTyping ? (
                          <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={20} color="inherit" />
                          </ListItem>
                        ) : (
                          searchSuggestions.map((suggestion, index) => (
                            <ListItem
                              button
                              key={index}
                              onClick={() => {
                                handleSuggestionClick(suggestion);
                                // Keep the search expanded after selection
                              }}
                              sx={{
                                py: 1.5,
                                borderBottom: index < searchSuggestions.length - 1
                                  ? '1px solid rgba(0, 0, 0, 0.05)'
                                  : 'none',
                              }}
                            >
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                width: '100%',
                                color: darkMode ? '#ffffff' : '#333333' 
                              }}>
                                <Typography sx={{ 
                                  mr: 1.5, 
                                  fontSize: '1.2rem',
                                  width: '24px',
                                  textAlign: 'center'
                                }}>
                                  {suggestion.icon}
                                </Typography>
                                <Box sx={{ 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  flex: 1
                                }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ fontWeight: suggestion.type === 'recent' ? 400 : 500 }}
                                  >
                                    {suggestion.text}
                                  </Typography>
                                  {suggestion.type === 'course' && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                        display: 'block'
                                      }}
                                    >
                                      View course details
                                    </Typography>
                                  )}
                                  {suggestion.type === 'professor' && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                        display: 'block'
                                      }}
                                    >
                                      View professor profile
                                    </Typography>
                                  )}
                                </Box>
                                {suggestion.type === 'professor' && (
                                  <Box
                                    sx={{
                                      bgcolor: darkMode ? 'rgba(87, 28, 224, 0.2)' : 'rgba(87, 28, 224, 0.1)',
                                      borderRadius: '4px',
                                      px: 1,
                                      py: 0.3,
                                      ml: 1,
                                      minWidth: 'auto'
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: darkMode ? '#bb86fc' : '#571CE0',
                                        fontSize: '0.7rem',
                                        fontWeight: 'medium'
                                      }}
                                    >
                                      Prof
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </ListItem>
                          ))
                        )}
                      </List>
                    </Paper>
                  )}
                </Box>
              </ClickAwayListener>

              <IconButton 
                onClick={toggleSearch} 
                sx={{ ml: 1, color: darkMode ? '#F26655' : '#757575' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            {!showSuggestions && (
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading || !question.trim()}
                sx={{
                  mt: 1,
                  backgroundColor: darkMode ? '#bb86fc' : '#000000',
                  color: '#FFFFFF',
                  borderRadius: '25px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: darkMode ? '#9b6efc' : '#571CE0',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
              </Button>
            )}
            
            {/* Display popular searches for mobile when no query */}
            {!question && !showSuggestions && popularSearches.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ 
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  display: 'block',
                  mb: 1
                }}>
                  Popular searches:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {popularSearches.slice(0, 3).map((search, index) => (
                    <Chip
                      key={index}
                      label={search.query}
                      size="small"
                      onClick={() => {
                        setQuestion(search.query);
                        handleSearch(new Event('submit'));
                      }}
                      sx={{
                        bgcolor: darkMode ? 'rgba(87, 28, 224, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                        color: darkMode ? '#ffffff' : '#333333',
                        fontSize: '0.75rem',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Heading and Mobile Navigation */}
      <Box sx={{ pt: 4, pb: 2 }}>
        {/* Mobile Heading */}
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            fontSize: '1.75rem',
            color: darkMode ? '#FFFFFF' : '#000000',
            mb: '20px',
            letterSpacing: '0.03rem',
            textAlign: 'center',
            px: 2,
            height: '80px', // Fixed height for the container
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ParticleTextCarousel
            messages={typingMessages}
            typingDelay={2500}
            darkMode={darkMode}
            currentUser={currentUser}
            isFirstLogin={localStorage.getItem(`hasLoggedIn_${currentUser?.uid}`) === 'true' && 
                          !localStorage.getItem(`hasSeenWelcome_${currentUser?.uid}`)}
          />
        </Typography>
        
        {/* Include the MobileNavigation component */}
        <MobileNavigation 
          darkMode={darkMode} 
          currentUser={currentUser} 
          navigate={navigate} 
          handleLoginRedirect={handleLoginRedirect} 
        />
      </Box>

      {/* Mobile AI Answer Section */}
      {answer && (
        <Paper
          elevation={3}
          sx={{
            mt: 2,
            p: 2,
            bgcolor: darkMode ? '#0C0F33' : '#f9f9f9',
            borderRadius: 2,
            width: '100%',
            boxShadow: darkMode
              ? '0px 4px 20px rgba(255, 255, 255, 0.1)'
              : '0px 4px 20px rgba(0, 0, 0, 0.05)',
            color: darkMode ? '#ffffff' : '#333333',
          }}
        >
          {/* Course info chips - Mobile layout (stacked) */}
          {(department || courseNumber || difficulty !== null || sentiment !== null) && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {department && (
                  <Chip
                    label={`Department: ${department}`}
                    color={darkMode ? 'default' : 'primary'}
                    size="small"
                    sx={{
                      bgcolor: darkMode ? '#0C0F33' : 'primary.main',
                      color: '#ffffff',
                    }}
                  />
                )}
                {courseNumber && (
                  <Chip
                    label={`Course: ${courseNumber}`}
                    color={darkMode ? 'default' : 'secondary'}
                    size="small"
                    sx={{
                      bgcolor: darkMode ? '#00693e' : 'secondary.main',
                      color: '#ffffff',
                    }}
                  />
                )}
              </Box>
              
              {/* Mobile Scale Meters */}
              <Box sx={{ mt: 1.5 }}>
                {difficulty !== null && (
                  <MobileScaleMeter
                    value={difficulty}
                    title="Layup Meter"
                    getLevelFunc={getDifficultyLevel}
                  />
                )}
                {sentiment !== null && (
                  <MobileScaleMeter
                    value={sentiment}
                    title="Quality Meter"
                    getLevelFunc={getSentimentLevel}
                  />
                )}
              </Box>

              {/* Mobile scroll message */}
              {showScrollMessage && documentName && (
                <Fade in={showScrollMessage}>
                  <Box
                    onClick={() =>
                      documentName && navigate(`/departments/${department}/courses/${documentName}`)
                    }
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      bgcolor: darkMode ? '#424242' : '#f0f8ff',
                      p: 1.5,
                      mt: 2,
                      borderRadius: 2,
                      boxShadow: darkMode
                        ? '0 2px 5px rgba(255, 255, 255, 0.1)'
                        : '0 2px 5px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        color: darkMode ? '#bb86fc' : '#1976d2',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                      }}
                    >
                      Tap for Course Details
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={scrollProgress * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        width: '80%',
                        bgcolor: darkMode ? '#bbbbbb' : '#bbdefb',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: darkMode ? '#bb86fc' : '#1976d2',
                        },
                      }}
                    />
                  </Box>
                </Fade>
              )}
            </Box>
          )}

          {/* Render the AI's answer with markdown */}
          <Box sx={{ textAlign: 'left', mb: 2 }}>
            {formatAnswer(
              department && courseNumber
                ? answer.replace(new RegExp(`^${department}\\s*${courseNumber}\\s*`), '')
                : answer
            )}
          </Box>

          {/* Mobile note below the AI response */}
          <Typography
            variant="body2"
            sx={{ 
              color: darkMode ? '#bbbbbb' : '#888888', 
              mt: 2,
              fontSize: '0.8rem',
              textAlign: 'center'
            }}
          >
            This AI chatbot is in early development.
          </Typography>
        </Paper>
      )}

      {/* Mobile Footer */}
      <Box sx={{ 
        mt: 4, 
        textAlign: 'center',
        px: 2,
        pb: 2,
        display: { xs: 'block', sm: 'none' }
      }}>
        <Typography
          variant="body2"
          sx={{
            color: darkMode ? '#ffffff' : '#333333',
            fontSize: '0.775rem',
            fontFamily: 'SF Pro Display, sans-serif',
            mb: 0.5,
          }}
        >
          © 2025 CourseMe. All Rights Reserved.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: darkMode ? '#cccccc' : '#666666',
            fontSize: '0.75rem',
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 400,
          }}
        >
          Built with <span>💚</span> in Dartmouth Dorms
        </Typography>
      </Box>
    </Box>
  );
};

export default MobileLandingPage; 