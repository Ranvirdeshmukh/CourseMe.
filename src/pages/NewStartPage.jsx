import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import useAppStyles from '../hooks/useAppStyles';

const NewStartPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [displayText, setDisplayText] = useState('');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [isEatingAnimation, setIsEatingAnimation] = useState(false);
  const [eatingStep, setEatingStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const theme = useTheme();
  const appStyles = useAppStyles(); // Use our custom hook for font consistency
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const targetText = "CourseMe.";
  
  // Text scrambling animation effect
  useEffect(() => {
    // Characters to use for scrambling effect
    const chars = "!<>-_\\/[]{}—=+*^?#________";
    
    let frame = 0;
    const frameRate = 25;
    const finalFrameHold = 22; // frames to hold at the end (reduced from 30)
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
  
  // "Eating" animation effect that starts after scrambling completes
  useEffect(() => {
    if (isAnimationComplete && !isEatingAnimation && !isTransitioning) {
      setIsEatingAnimation(true);
      
      // Hold the complete text for a moment before eating animation
      setTimeout(() => {
        // Start the eating animation
        const textLength = targetText.length;
        let currentStep = 0;
        const underscoreSequence = []; // Array to store growing underscore sequence
        
        const eatText = () => {
          if (currentStep >= textLength) {
            // Eating animation complete, start transition
            setIsTransitioning(true);
            return;
          }
          
          // Add a new underscore to the growing sequence
          underscoreSequence.push('_');
          
          // Create the new display text: remaining characters + underscore sequence
          const remainingText = targetText.substring(currentStep);
          const newText = underscoreSequence.join('') + remainingText;
          
          setDisplayText(newText);
          currentStep++;
          setEatingStep(currentStep);
        };
        
        // Run the eating animation at a slower pace than scramble
        const eatInterval = setInterval(eatText, 150);
        
        return () => clearInterval(eatInterval);
      }, 600); // Short delay before starting the eating animation
    }
  }, [isAnimationComplete, isEatingAnimation, isTransitioning, targetText]);
  
  // Implement a short transition before navigation
  useEffect(() => {
    if (isTransitioning) {
      // Set transition data in sessionStorage for the landing page to use
      sessionStorage.setItem('comingFromIntro', 'true');
      sessionStorage.setItem('eatenText', displayText);
      
      // Navigate after a brief transition
      setTimeout(() => {
        navigate('/landing', { replace: true });
      }, 800); // Longer delay for the full effect
    }
  }, [isTransitioning, navigate, displayText]);

  // Function to render the text with colored period and "eaten" effect
  const renderTextWithColoredPeriod = () => {
    if (!displayText) return null;
    
    // If we're in eating animation or transitioning
    if (isEatingAnimation) {
      // If the text still contains a period (hasn't been eaten yet)
      if (displayText.includes('.')) {
        const periodIndex = displayText.indexOf('.');
        const beforePeriod = displayText.substring(0, periodIndex);
        const afterPeriod = displayText.substring(periodIndex + 1);
        
        return (
          <>
            {beforePeriod}
            <span style={{ color: '#f26655' }}>.</span>
            {afterPeriod}
          </>
        );
      }
    }
    
    // Normal rendering for scramble animation
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
          opacity: isTransitioning ? 0 : 1,
          transition: isTransitioning ? 'opacity 0.8s ease-out' : 'opacity 0.4s ease-out',
        }}
      >
        {/* Text with scrambling and eating animation */}
        <Typography
          variant="h1"
          sx={{
            fontFamily: appStyles.fontFamily, // Use our common font stack
            fontWeight: 600,
            fontSize: { xs: '3rem', sm: '4rem', md: '6rem' },
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            textShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
            opacity: isAnimationComplete ? 1 : 0.95,
            transition: 'all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
            transform: isTransitioning ? 'scale(0.9)' : isEatingAnimation ? `scale(${1 + eatingStep * 0.01})` : 'scale(1)',
          }}
        >
          {renderTextWithColoredPeriod()}
        </Typography>
      </Box>
    </Box>
  );
};

export default NewStartPage; 