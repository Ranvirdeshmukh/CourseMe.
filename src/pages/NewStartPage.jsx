import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

const NewStartPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [displayText, setDisplayText] = useState('');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
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
  
  // Auto-navigate after animation completes
  useEffect(() => {
    if (isAnimationComplete) {
      // Wait for a brief pause after animation completes before navigating
      const transitionTimeout = setTimeout(() => {
        navigate(currentUser ? '/landing' : '/login');
      }, 1500); // 1.5 seconds delay
      
      return () => clearTimeout(transitionTimeout);
    }
  }, [isAnimationComplete, navigate, currentUser]);

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
      sx={{ 
        height: '100vh',
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
          transition: 'opacity 0.8s ease-in-out',
          opacity: isAnimationComplete ? 0.5 : 1, // Start fading out when animation completes
        }}
      >
        {/* Text with scrambling animation */}
        <Typography
          variant="h1"
          sx={{
            fontFamily: '"SF Pro Display", sans-serif',
            fontWeight: 600,
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
    </Box>
  );
};

export default NewStartPage; 