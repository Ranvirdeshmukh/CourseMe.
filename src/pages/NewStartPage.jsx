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
  const [isShrinkingAnimation, setIsShrinkingAnimation] = useState(false);
  const [shrinkStep, setShrinkStep] = useState(0);
  const [textOpacity, setTextOpacity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const theme = useTheme();
  const appStyles = useAppStyles(); // Use our custom hook for font consistency
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const targetText = "CourseMe.";
  const maxSteps = Math.ceil(targetText.length / 2);
  
  // Text scrambling animation effect
  useEffect(() => {
    // Elegant character set - more refined, less chaotic
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const elegantChars = "CourseMe."; // Occasionally use letters from the target word
    const subtleGlitch = "▫▪◦•"; // Minimal, elegant glitch characters
    
    let frame = 0;
    const totalFrames = 75; // Slightly faster but still smooth
    const finalHoldFrames = 45; // Much longer pause to appreciate the logo (1.5 seconds at 30fps)
    let holdCount = 0;
    let isComplete = false;
    
    // Each character will have its own "solution time" - more elegant timing
    const textLength = targetText.length;
    const solutionTimes = Array.from({ length: textLength }, (_, i) => {
      // More elegant, wave-like timing pattern
      const waveOffset = Math.sin((i / textLength) * Math.PI) * 15;
      const baseTime = 25 + (i * 2.5) + waveOffset;
      return Math.min(baseTime, 65);
    });
    
    const scramble = () => {
      if (isComplete) {
        holdCount++;
        if (holdCount > finalHoldFrames) {
          setIsAnimationComplete(true);
        }
        return;
      }
      
      frame++;
      
      let displayString = '';
      let allSolved = true;
      
      for (let i = 0; i < textLength; i++) {
        const solutionTime = solutionTimes[i];
        
        if (frame >= solutionTime) {
          // Character is solved - show the correct character
          displayString += targetText[i];
        } else {
          // Character is still scrambling - more elegant approach
          allSolved = false;
          
          // Calculate scrambling intensity with smoother falloff
          const timeToSolution = solutionTime - frame;
          const intensity = Math.max(0.05, Math.min(1, timeToSolution / 25));
          
          // Use more refined character selection
          let charSet = chars;
          
          if (intensity < 0.4 && Math.random() < 0.6) {
            // When close to solution, favor letters from the target word
            charSet = elegantChars + targetText[i] + targetText[i].toLowerCase() + targetText[i].toUpperCase();
          } else if (intensity > 0.7 && Math.random() < 0.15) {
            // Minimal elegant glitch effects only occasionally
            charSet = subtleGlitch;
          } else if (intensity < 0.7 && Math.random() < 0.3) {
            // Mix in some target word characters for coherence
            charSet = chars + elegantChars;
          }
          
          // Single character selection for elegance (no multiple scrambling)
          const scrambledChar = charSet[Math.floor(Math.random() * charSet.length)];
          displayString += scrambledChar;
        }
      }
      
      setDisplayText(displayString);
      
      // Check if all characters are solved
      if (allSolved || frame > totalFrames) {
        isComplete = true;
        setDisplayText(targetText); // Ensure final text is correct
      }
    };
    
    // Run the animation at 30fps for elegant, smooth movement
    const interval = setInterval(scramble, 1000 / 30);
    
    return () => clearInterval(interval);
  }, []);
  
  // "Eating" animation effect that starts after scrambling completes
  useEffect(() => {
    if (isAnimationComplete && !isEatingAnimation && !isTransitioning) {
      setIsEatingAnimation(true);
      
      // Start the eating animation immediately without delay
      const textLength = targetText.length;
      let currentStep = 0;
      const maxSteps = Math.ceil(textLength / 2);
      
      const eatText = () => {
        // Animation complete check
        if (currentStep > maxSteps) {
          // Start the shrinking underscores animation
          setIsShrinkingAnimation(true);
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
          }, 50); // Faster transition (reduced from 100ms)
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
          const nextDelay = Math.max(20, 50 - currentStep * 4); // Faster eating animation
          setTimeout(eatText, nextDelay);
        }
      };
      
      // Start the animation sequence immediately
      eatText();
    }
  }, [isAnimationComplete, isEatingAnimation, isTransitioning, targetText]);
  
  // New effect for shrinking underscores animation
  useEffect(() => {
    if (isShrinkingAnimation && !isTransitioning) {
      const initialUnderscores = targetText.length;
      let currentLength = initialUnderscores;
      let step = 0;
      
      const shrinkUnderscores = () => {
        // Determine the number of underscores to show
        if (step === 0) {
          currentLength = 6; // Start with "______"
        } else if (step === 1) {
          currentLength = 4; // Then "____"
        } else if (step === 2) {
          currentLength = 3; // Then "___"
        } else if (step === 3) {
          currentLength = 2; // Then "__"
        } else if (step === 4) {
          currentLength = 1; // Then "_"
        } else if (step === 5) {
          // Start direct transition to landing page
          setIsTransitioning(true);
          return;
        }
        
        // Center the underscores
        const newText = Array(currentLength).fill('_').join('');
        setDisplayText(newText);
        setShrinkStep(step);
        
        // Advance to next step
        step++;
        
        // Schedule next step with a faster delay
        setTimeout(shrinkUnderscores, 100); // Faster transition (reduced from 180ms)
      };
      
      // Start the shrinking animation
      shrinkUnderscores();
    }
  }, [isShrinkingAnimation, isTransitioning, targetText.length]);
  
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
    
    // Enhanced rendering for scramble animation with character-by-character effects
    if (!isAnimationComplete && displayText) {
      return displayText.split('').map((char, index) => {
        const isCorrectChar = char === targetText[index];
        const isPeriod = char === '.';
        const isGlitchChar = ['█', '▓', '▒', '░', '▄', '▀', '▐', '▌', '▆', '▇'].includes(char);
        
        // Create dynamic styling based on character state
        const charStyle = {
          color: isPeriod ? '#f26655' : isCorrectChar ? '#FFFFFF' : isGlitchChar ? '#FF6B9D' : '#B0B0B0',
          opacity: isCorrectChar ? 1 : isGlitchChar ? 0.8 + (Math.random() * 0.2) : 0.6 + (Math.random() * 0.4),
          textShadow: isCorrectChar 
            ? '0 0 15px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.2)' 
            : isPeriod 
              ? '0 0 20px rgba(242, 102, 85, 0.8), 0 0 40px rgba(242, 102, 85, 0.4)'
              : isGlitchChar
                ? `0 0 10px rgba(255, 107, 157, 0.8), ${Math.random() * 4 - 2}px 0 8px rgba(255, 255, 255, 0.3)`
                : `0 0 8px rgba(176, 176, 176, ${Math.random() * 0.6 + 0.2})`,
          transition: isCorrectChar ? 'all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
          transform: isCorrectChar 
            ? 'scale(1)' 
            : isGlitchChar 
              ? `scale(${0.9 + Math.random() * 0.2}) skew(${Math.random() * 4 - 2}deg)`
              : `scale(${0.92 + Math.random() * 0.16})`,
          display: 'inline-block',
          animation: isCorrectChar 
            ? 'character-solve 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
            : isGlitchChar && Math.random() < 0.5
              ? 'glitch-pulse 0.2s ease-in-out'
              : !isCorrectChar && Math.random() < 0.2 
                ? 'subtle-flicker 0.15s ease-in-out' 
                : 'none',
          filter: isGlitchChar ? `hue-rotate(${Math.random() * 60}deg)` : 'none',
          // Add transform origin for better 3D rotation
          transformOrigin: 'center center',
          // Add transform style for 3D
          transformStyle: 'preserve-3d',
        };
        
        return (
          <span 
            key={`${index}-${char}-${Date.now()}`} // More dynamic key to trigger re-renders
            style={charStyle}
          >
            {char}
          </span>
        );
      });
    }
    
    // Normal rendering for completed text
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
        // Add perspective for better 3D rotation visibility
        perspective: '1000px',
        // Add keyframes for the flicker animation
        '@keyframes subtle-flicker': {
          '0%': { opacity: 0.7, transform: 'scale(0.95)' },
          '50%': { opacity: 0.9, transform: 'scale(1.02)' },
          '100%': { opacity: 0.7, transform: 'scale(0.95)' }
        },
        '@keyframes character-solve': {
          '0%': { 
            opacity: 0.8, 
            transform: 'scale(0.95) rotateY(5deg)',
            textShadow: '0 0 8px rgba(255, 255, 255, 0.6)',
            filter: 'blur(0.5px)'
          },
          '100%': { 
            opacity: 1, 
            transform: 'scale(1) rotateY(0deg)',
            textShadow: '0 0 15px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.2)',
            filter: 'blur(0px)'
          }
        },
        '@keyframes glitch-pulse': {
          '0%': { textShadow: '0 0 5px rgba(176, 176, 176, 0.5)' },
          '25%': { textShadow: '2px 0 5px rgba(255, 0, 255, 0.7), -2px 0 5px rgba(0, 255, 255, 0.7)' },
          '50%': { textShadow: '0 0 5px rgba(176, 176, 176, 0.5)' },
          '75%': { textShadow: '-2px 0 5px rgba(255, 255, 0, 0.7), 2px 0 5px rgba(255, 0, 0, 0.7)' },
          '100%': { textShadow: '0 0 5px rgba(176, 176, 176, 0.5)' }
        }
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
            textShadow: isShrinkingAnimation ? '0 0 15px rgba(255, 255, 255, 0.3)' : isEatingAnimation && eatingStep > maxSteps ? '0 0 25px rgba(255, 255, 255, 0.9)' : '0 0 15px rgba(255, 255, 255, 0.2)',
            opacity: isShrinkingAnimation && isTransitioning ? 0 : isAnimationComplete ? 1 : 0.95,
            transition: isTransitioning ? 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            transform: isTransitioning ? 'scale(0.85) translateY(10px)' : isEatingAnimation && eatingStep > maxSteps ? 'scale(1.1)' : isEatingAnimation ? `scale(${1 + eatingStep * 0.01})` : 'scale(1)',
            display: 'inline-block',
            textAlign: 'center',
            // Add transform-style to enable 3D transforms on child elements
            transformStyle: 'preserve-3d',
          }}
        >
          {renderTextWithColoredPeriod()}
        </Typography>
      </Box>
    </Box>
  );
};

export default NewStartPage; 