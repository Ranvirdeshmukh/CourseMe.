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
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';
import ReactTypingEffect from 'react-typing-effect';
import { doc, getDoc } from 'firebase/firestore';
import CloudOutlined from '@mui/icons-material/CloudOutlined';

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
  currentTime,
  formatTime,
  formatDate,
  weatherData
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
  };

  const toggleWeatherExpanded = () => {
    setWeatherExpanded(!weatherExpanded);
  };

  // Handle weather click to open detailed weather information
  const handleWeatherClick = () => {
    if (!weatherData?.lat || !weatherData?.lon) return;
    
    // Get detailed user agent info to determine device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Check if the user is on an iOS device specifically (iPhone, iPad)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    if (isIOS) {
      // For iOS devices, try to use the weather URL scheme (might work on some versions)
      // But since deep linking is unreliable, provide a reliable fallback immediately
      try {
        // First try Apple Maps with weather display
        window.location.href = `maps://weathercallout?lat=${weatherData.lat}&lon=${weatherData.lon}`;
        
        // Set a short timeout to redirect to Weather web search if the deep link doesn't work
        setTimeout(() => {
          const cityName = weatherData.city ? encodeURIComponent(weatherData.city) : '';
          window.open(
            `https://www.google.com/search?q=weather+${cityName ? 'in+' + cityName : weatherData.lat + ',' + weatherData.lon}`, 
            '_blank'
          );
        }, 300);
      } catch (e) {
        // If there's any error, use Google Weather search
        const cityName = weatherData.city ? encodeURIComponent(weatherData.city) : '';
        window.open(
          `https://www.google.com/search?q=weather+${cityName ? 'in+' + cityName : weatherData.lat + ',' + weatherData.lon}`, 
          '_blank'
        );
      }
    } else {
      // For all other devices (Android, desktop, etc.), use Google Weather
      const cityName = weatherData.city ? encodeURIComponent(weatherData.city) : '';
      const searchQuery = cityName 
        ? `weather in ${cityName}`
        : `weather ${weatherData.lat},${weatherData.lon}`;
      
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  // Style with CSS keyframes for time pulse animation - mobile version
  const mobileStyles = {
    '@keyframes mobileTimePulse': {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.8 },
      '100%': { opacity: 1 }
    },
    '@keyframes mobileSubtleFade': {
      '0%': { opacity: 0.7 },
      '50%': { opacity: 1 },
      '100%': { opacity: 0.7 }
    },
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

  // Add a function to refresh the weather data
  const refreshWeather = () => {
    // Show refreshing state
    setIsRefreshing(true);
    
    // Call the global refresh function if available
    if (window.weatherUtils && window.weatherUtils.getUserLocation) {
      window.weatherUtils.getUserLocation();
      
      // Reset the refreshing state after a delay
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1500);
    } else {
      console.error('Weather utilities not available');
      setIsRefreshing(false);
    }
  };

  return (
    <Box sx={{ width: '100%', ...mobileStyles }}>
      {/* Mobile Weather & Time Widget */}
      {currentUser && weatherData && (
        <Box
          sx={{
            position: 'fixed',
            left: '12px',
            top: '58px',
            zIndex: 10,
            display: { xs: 'flex', sm: 'none' },
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'fadeIn 0.5s ease-out',
            pointerEvents: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: darkMode 
                ? 'rgba(28, 9, 63, 0.75)' 
                : 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: weatherExpanded ? '8px 12px' : '8px',
              boxShadow: darkMode
                ? '0 3px 10px rgba(0,0,0,0.2), 0 0 1px rgba(255,255,255,0.15) inset'
                : '0 3px 10px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.05) inset',
              border: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.12)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              width: weatherExpanded ? 'auto' : '42px',
              height: weatherExpanded ? 'auto' : '42px',
              overflow: 'hidden',
              userSelect: 'none',
              animation: !weatherExpanded 
                ? 'subtlePulse 4s infinite, float 6s ease-in-out infinite'
                : 'none',
              '&:hover': {
                boxShadow: darkMode
                  ? '0 5px 15px rgba(0,0,0,0.25), 0 0 2px rgba(255,255,255,0.2) inset'
                  : '0 5px 15px rgba(0,0,0,0.15), 0 0 2px rgba(0,0,0,0.1) inset',
                transform: 'translateY(-2px)',
              },
            }}
            onClick={toggleWeatherExpanded}
          >
            {!weatherExpanded ? (
              // Collapsed state - only show weather icon or time
              <Tooltip title="Tap for weather & time" placement="right">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {weatherData.icon ? (
                    <img 
                      src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} 
                      alt={weatherData.desc}
                      style={{ 
                        width: '26px', 
                        height: '26px',
                        filter: darkMode ? 'brightness(1.2)' : 'contrast(0.9)',
                      }}
                    />
                  ) : (
                    <AccessTimeIcon sx={{ 
                      fontSize: '1.2rem',
                      color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                    }} />
                  )}
                </Box>
              </Tooltip>
            ) : (
              // Expanded state
              <Box sx={{ animation: 'fadeIn 0.3s ease-out' }}>
                {/* Time & Weather Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  width: '100%',
                  marginBottom: '4px',
                }}>
                  {/* Time Display */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginRight: '8px',
                  }}>
                    <AccessTimeIcon sx={{ 
                      fontSize: '0.8rem',
                      color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                      marginRight: '4px',
                    }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"SF Pro Display", system-ui, sans-serif',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        color: darkMode ? '#FFFFFF' : '#000000',
                        letterSpacing: '0.01rem',
                        animation: 'mobileTimePulse 4s infinite',
                      }}
                    >
                      {formatTime(currentTime).split(' ')[0]}
                      <span style={{ 
                        fontSize: '0.65rem', 
                        marginLeft: '2px',
                        opacity: 0.8,
                      }}>
                        {formatTime(currentTime).split(' ')[1]}
                      </span>
                    </Typography>
                  </Box>

                  {/* Weather Display with Refresh */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWeatherClick();
                      }}
                    >
                      <img 
                        src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} 
                        alt={weatherData.desc}
                        style={{ 
                          width: '24px', 
                          height: '24px',
                          filter: darkMode ? 'brightness(1.2)' : 'contrast(0.9)',
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'SF Pro Display, system-ui, sans-serif',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          color: darkMode ? '#FFFFFF' : '#000000',
                        }}
                      >
                        {weatherData.tempDisplay || Math.round(weatherData.temp)}°
                      </Typography>
                    </Box>
                    
                    {/* Refresh Button */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshWeather();
                      }}
                      sx={{
                        padding: '2px',
                        ml: 0.5,
                        color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                        animation: isRefreshing ? 'spin 1.5s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    >
                      <RefreshIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Date Display */}
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'SF Pro Display, system-ui, sans-serif',
                    fontSize: '0.65rem',
                    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                    textAlign: 'center',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  {formatDate(currentTime)}
                </Typography>
                
                {/* Location */}
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'SF Pro Display, system-ui, sans-serif',
                    fontSize: '0.65rem',
                    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CloudOutlined sx={{ fontSize: '0.7rem', mr: 0.5, opacity: 0.7 }} />
                  {weatherData.city || weatherData.desc || 'Dartmouth'}
                </Typography>
                
                {/* Close button for expanded view */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 0.5,
                  opacity: 0.7,
                }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    tap to close
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}

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
              backgroundColor: darkMode ? '#1C093F' : '#ffffff',
              padding: '10px',
              borderRadius: '10px',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
              width: '100vw',
              maxWidth: '100%',
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 1200,
            }}
          >
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <TextField
                autoFocus
                fullWidth
                variant="outlined"
                placeholder="Ask anything about courses..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    backgroundColor: darkMode ? '#0C0F33' : '#f5f5f5',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color={darkMode ? 'primary' : 'action'} />
                    </InputAdornment>
                  )
                }}
              />
              <IconButton 
                onClick={toggleSearch} 
                sx={{ ml: 1 }}
                color={darkMode ? 'primary' : 'default'}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              type="submit"
              disabled={loading}
              disableElevation
              sx={{
                backgroundColor: darkMode ? '#bb86fc' : '#000000',
                borderRadius: '20px',
                color: 'white',
                fontWeight: 'bold',
                mt: 1,
                width: '100%',
                '&:hover': {
                  backgroundColor: darkMode ? '#9b6efc' : '#571CE0',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
            </Button>
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
          }}
        >
          <ReactTypingEffect
            text={typingMessages}
            typingDelay={1000}
            speed={80}
            eraseSpeed={50}
            eraseDelay={currentUser ? 2000 : 3000}
            displayTextRenderer={(text, i) => {
              const isWelcomeMessage = currentUser && i === 0;
              const isFirstLogin = localStorage.getItem(`hasLoggedIn_${currentUser?.uid}`) === 'true' && 
                                  !localStorage.getItem(`hasSeenWelcome_${currentUser?.uid}`);
              const isJoinPrompt = !currentUser && i === 0 && text.includes('Join them');
              const isSecondSentence = !currentUser ? i === 1 : i === 1;
              
              // Set color based on message type
              const sentenceColor = darkMode
                ? '#FFFFFF'
                : isJoinPrompt
                ? '#e91e63' // Hot pink for "Join them?" prompt
                : isWelcomeMessage && isFirstLogin
                ? '#ff5722' // Exciting orange for first-time users
                : isWelcomeMessage
                ? '#00693e' // Green for returning users
                : isSecondSentence
                ? '#571ce0' // Purple for second sentence
                : '#000000'; // Black for other sentences
              
              const hasFullStop = text.endsWith('.');
              const hasExclamation = text.endsWith('!');
              const hasQuestion = text.endsWith('?');
              const textWithoutEnding = hasFullStop ? text.slice(0, -1) : 
                                         hasExclamation ? text.slice(0, -1) : 
                                         hasQuestion ? text.slice(0, -1) : text;
              const ending = hasFullStop ? '.' : 
                             hasExclamation ? '!' : 
                             hasQuestion ? '?' : '';
  
              return (
                <span>
                  <span
                    style={{
                      color: sentenceColor,
                      fontFamily: 'SF Pro Display, sans-serif',
                      fontWeight: '600',
                    }}
                  >
                    {textWithoutEnding}
                  </span>
                  {ending && <span style={{ color: ending === '?' ? '#e91e63' : '#F26655' }}>{ending}</span>}
                </span>
              );
            }}
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