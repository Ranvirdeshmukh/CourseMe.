import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const NewStartPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const pageRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const targetText = "CourseMe.";
  
  // Text scrambling animation effect
  useEffect(() => {
    // Characters to use for scrambling effect
    const chars = "!<>-_\\/[]{}—=+*^?#________";
    
    let frame = 0;
    const frameRate = 25;
    const finalFrameHold = 30; // frames to hold at the end
    let holdCount = 0;
    let isComplete = false;
    
    const scramble = () => {
      if (isComplete) {
        holdCount++;
        if (holdCount > finalFrameHold) {
          setIsAnimationComplete(true);
        }
        return;
      }
      
      frame++;
      
      // Calculate progress - how much of target text to show correctly
      const progress = Math.min(frame / frameRate, 1);
      const textLength = targetText.length;
      const scrambleLength = Math.floor(textLength * progress);
      
      // Build the displayed text:
      // 1. Characters that should now be correct
      // 2. Scrambled characters for the rest
      let displayString = '';
      
      for (let i = 0; i < textLength; i++) {
        if (i < scrambleLength) {
          displayString += targetText[i];
        } else if (i === scrambleLength) {
          // Active scrambling character
          const charIndex = Math.floor(Math.random() * chars.length);
          displayString += chars[charIndex];
        } else {
          // Spaces for not-yet-reached characters
          displayString += " ";
        }
      }
      
      setDisplayText(displayString);
      
      // Check if we've completed the animation
      if (progress >= 1) {
        isComplete = true;
      }
    };
    
    // Run the animation at 30fps
    const interval = setInterval(scramble, 1000 / 30);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle scroll progress and navigation
  useEffect(() => {
    const handleScroll = () => {
      if (pageRef.current) {
        const scrollPosition = window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollHeight = viewportHeight * 0.5;
        const progress = Math.min(scrollPosition / scrollHeight, 1);
        setScrollProgress(progress);
    
        if (progress >= 0.9) {
          window.removeEventListener('scroll', handleScroll);
          setTimeout(() => {
            window.scrollTo(0, 0);
            navigate(currentUser ? '/landing' : '/login');
          }, 300);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentUser, navigate]);

  // Function to render the text with colored period
  const renderTextWithColoredPeriod = () => {
    if (!displayText) return null;
    
    // If we have a period at the end
    if (displayText.endsWith('.')) {
      const textWithoutPeriod = displayText.slice(0, -1);
      return (
        <>
          {textWithoutPeriod}
          <span style={{ color: '#f26655' }}>.</span>
        </>
      );
    }
    
    return displayText;
  };

  return (
    <Box 
      ref={pageRef}
      sx={{ 
        height: '150vh',
        width: '100%', 
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#1C093F', // Dark purple background color used in the app
      }}
    >
      <Box
        sx={{
          height: '100vh',
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 1 - scrollProgress,
          transition: 'opacity 0.3s ease-in',
        }}
      >
        {/* Text with scrambling animation */}
        <Typography
          variant="h1"
          sx={{
            fontFamily: '"SF Pro Display", sans-serif',
            fontWeight: 600, // Changed from 700 to 600 (semi-bold)
            fontSize: { xs: '3rem', sm: '4rem', md: '6rem' },
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            textShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
            opacity: isAnimationComplete ? 1 : 0.95,
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          {renderTextWithColoredPeriod()}
        </Typography>
      </Box>

      {/* Scroll indicator */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: '15px', sm: '20px', md: '25px' },
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'bounce 2s infinite',
          opacity: isAnimationComplete ? (1 - scrollProgress) : 0,
          zIndex: 2,
          transition: 'opacity 0.5s ease-in-out',
          '@keyframes bounce': {
            '0%, 20%, 50%, 80%, 100%': {
              transform: 'translateY(0) translateX(-50%)',
            },
            '40%': {
              transform: 'translateY(-30px) translateX(-50%)',
            },
            '60%': {
              transform: 'translateY(-15px) translateX(-50%)',
            },
          },
        }}
      >
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 1, 
            fontFamily: 'SF Pro Display, sans-serif',
            color: 'white',
            fontWeight: 500,
            textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
          }}
        >
          Scroll to continue
        </Typography>
        <KeyboardArrowDownIcon 
          fontSize={isMobile ? "medium" : "large"} 
          sx={{ color: 'white' }}
        />
      </Box>
    </Box>
  );
};

export default NewStartPage; 