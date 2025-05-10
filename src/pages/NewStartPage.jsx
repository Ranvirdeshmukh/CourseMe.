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
  const maxSteps = Math.ceil(targetText.length / 2);
  
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
        const maxSteps = Math.ceil(textLength / 2);
        
        const eatText = () => {
          // Animation complete check
          if (currentStep > maxSteps) {
            // Do a quick final flash before transitioning
            setEatingStep(maxSteps + 10); // Boost the step count for dramatic scaling
            
            // Start transition after a very brief pause
            setTimeout(() => {
              setIsTransitioning(true);
            }, 120);
            return;
          }
          
          // Create new text with characters being replaced by underscores from both ends
          let newText = Array(textLength).fill(' '); // Start with spaces
          
          // Final step - all underscores
          if (currentStep === maxSteps) {
            for (let i = 0; i < textLength; i++) {
              newText[i] = '_';
            }
            
            // Accelerate to the final animation after a very short pause
            setTimeout(() => {
              currentStep++;
              eatText();
            }, 100);
          } else {
            // Fill in the not-yet-eaten letters from the original text
            for (let i = currentStep; i < textLength - currentStep; i++) {
              newText[i] = targetText[i];
            }
            
            // Add underscores at the eaten positions
            for (let i = 0; i < currentStep; i++) {
              newText[i] = '_'; // Left side underscores
              newText[textLength - 1 - i] = '_'; // Right side underscores
            }
            
            setDisplayText(newText.join(''));
            currentStep++;
            setEatingStep(currentStep);
            
            // Accelerate animation speed as it progresses
            const nextDelay = Math.max(30, 70 - currentStep * 3);
            setTimeout(eatText, nextDelay);
          }
        };
        
        // Start the animation sequence
        eatText();
        
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
      }, 300); // Shorter delay for faster transition
    }
  }, [isTransitioning, navigate, displayText]);

  // Function to render the text with colored period and "eaten" effect
  const renderTextWithColoredPeriod = () => {
    if (!displayText) return null;
    
    // If we're in eating animation or transitioning
    if (isEatingAnimation) {
      // If the text contains a period
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
          transition: isTransitioning ? 'opacity 0.3s cubic-bezier(0.2, 0, 0, 1)' : 'opacity 0.4s ease-out',
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
            textShadow: isEatingAnimation && eatingStep > maxSteps ? '0 0 25px rgba(255, 255, 255, 0.9)' : '0 0 15px rgba(255, 255, 255, 0.2)',
            opacity: isAnimationComplete ? 1 : 0.95,
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            transform: isTransitioning ? 'scale(0.2)' : isEatingAnimation && eatingStep > maxSteps ? 'scale(1.3)' : isEatingAnimation ? `scale(${1 + eatingStep * 0.02})` : 'scale(1)',
          }}
        >
          {renderTextWithColoredPeriod()}
        </Typography>
      </Box>
    </Box>
  );
};

export default NewStartPage; 