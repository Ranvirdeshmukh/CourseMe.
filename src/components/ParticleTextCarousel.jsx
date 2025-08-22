import React, { useState, useEffect, useCallback } from 'react';
import ParticleTextAnimation from './ParticleTextAnimation';

const ParticleTextCarousel = ({ 
  messages, 
  typingDelay = 3000, 
  darkMode,
  currentUser,
  isFirstLogin
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [nextText, setNextText] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Function to handle animation completion
  const handleAnimationComplete = useCallback(() => {
    // Mark that the user has seen the welcome message if needed
    if (currentUser && currentIndex === 0 && isFirstLogin && 
        !localStorage.getItem(`hasSeenWelcome_${currentUser.uid}`)) {
      localStorage.setItem(`hasSeenWelcome_${currentUser.uid}`, 'true');
    }
    
    // Schedule the next message after delay
    const timer = setTimeout(() => {
      // Start transition
      setIsTransitioning(true);
      
      // After a short delay to allow the fade-out to begin, prepare the next text
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % messages.length;
        setNextText(messages[nextIndex]);
        
        // After the outgoing animation completes, update the current index and displayed text
        setTimeout(() => {
          setCurrentIndex(nextIndex);
          setDisplayedText(messages[nextIndex]);
          setIsTransitioning(false);
        }, 800); // Match the transition duration in the component
      }, 200);
    }, typingDelay);
    
    return () => clearTimeout(timer);
  }, [messages, typingDelay, currentUser, currentIndex, isFirstLogin, messages.length]);

  // Update displayed text when index changes
  useEffect(() => {
    if (messages.length > 0 && isReady) {
      setDisplayedText(messages[currentIndex]);
    }
  }, [currentIndex, messages, isReady]);

  // Initialize with slight delay to ensure proper rendering
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (messages.length > 0) {
        setDisplayedText(messages[0]);
        setIsReady(true);
      }
    }, 500);
    
    return () => clearTimeout(initTimer);
  }, [messages]);

  // Check if text is a time-based greeting
  const isTimeBasedGreeting = (text) => {
    if (!text) return false;
    
    // Check for traditional greetings
    if (
      text.startsWith('Good morning') || 
      text.startsWith('Good afternoon') || 
      text.startsWith('Good evening')
    ) return true;
    
    // Check for new greeting variations
    if (
      text.startsWith('Morning') ||
      text.startsWith('Afternoon') ||
      text.startsWith('Evening') ||
      text.startsWith('Hello, early bird') ||
      text.startsWith('Fresh morning') ||
      text.startsWith('Mid-day hello') ||
      text.startsWith('Hello this evening') ||
      text.startsWith('Night owl') ||
      text.startsWith('Burning the midnight oil') ||
      text.startsWith('Late night scholar') ||
      text.startsWith('Still studying') ||
      text.startsWith('Up late hustling') ||
      text.startsWith('Welcome back')
    ) return true;
    
    return false;
  };

  // Custom color logic based on message type
  const getTextColor = () => {
    const isWelcomeMessage = currentUser && currentIndex === 0;
    const isTimeGreeting = isWelcomeMessage && displayedText && isTimeBasedGreeting(displayedText);
    const isJoinPrompt = !currentUser && currentIndex === 0 && displayedText && displayedText.includes('Join them');
    const isSecondSentence = !currentUser ? currentIndex === 1 : currentIndex === 1;
    
    if (darkMode) return "#FFFFFF";
    
    if (isJoinPrompt) return "#e91e63"; // Hot pink for "Join them?" prompt
    if (isWelcomeMessage && isFirstLogin) return "#ff5722"; // Exciting orange for first-time users
    
    if (isTimeGreeting) {
      // Morning variations
      if (displayedText.startsWith('Good morning') || 
          displayedText.startsWith('Morning') ||
          displayedText.startsWith('Rise and shine') ||
          displayedText.startsWith('Hello, early bird') ||
          displayedText.startsWith('Fresh morning')) {
        return "#FF9800"; // Orange for morning
      }
      
      // Afternoon variations
      if (displayedText.startsWith('Good afternoon') || 
          displayedText.startsWith('Afternoon') ||
          displayedText.startsWith('Mid-day hello')) {
        return "#00693e"; // Green for afternoon
      }
      
      // Evening variations
      if (displayedText.startsWith('Good evening') || 
          displayedText.startsWith('Evening') ||
          displayedText.startsWith('Hello this evening')) {
        return "#3F51B5"; // Indigo for evening
      }
      
      // Late night variations
      if (displayedText.startsWith('Night owl') ||
          displayedText.startsWith('Burning the midnight oil') ||
          displayedText.startsWith('Late night scholar') ||
          displayedText.startsWith('Still studying') ||
          displayedText.startsWith('Up late hustling')) {
        return "#673AB7"; // Deep purple for night
      }
      
      if (displayedText.startsWith('Welcome back')) {
        return "#00693e"; // Green for fallback
      }
      
      return "#00693e"; // Default green for other greetings
    }
    
    if (isSecondSentence) return "#571ce0"; // Purple for second sentence
    return "#000000"; // Black for other sentences
  };

  // Handle period/exclamation/question mark styling
  const parseEndingPunctuation = (text) => {
    if (!text) return '';
    
    const hasFullStop = text.endsWith('.');
    const hasExclamation = text.endsWith('!');
    const hasQuestion = text.endsWith('?');
    
    if (!hasFullStop && !hasExclamation && !hasQuestion) {
      return text;
    }
    
    const textWithoutEnding = text.slice(0, -1);
    return textWithoutEnding;
  };

  // Get ending punctuation color
  const getEndingPunctuationColor = () => {
    if (!displayedText) return "#F26655";
    
    // Special case: Question mark for "All of Dartmouth uses it, don't you?" should be white
    if (displayedText.includes("All of Dartmouth uses it, don't you") && displayedText.endsWith('?')) {
      return darkMode ? "#FFFFFF" : "#FFFFFF";
    }
    
    // Special case: Exclamation mark for "Welcome aboard!" messages should be white
    if (displayedText.includes("Welcome aboard") && displayedText.endsWith('!')) {
      return darkMode ? "#FFFFFF" : "#FFFFFF";
    }
    
    // All other punctuation marks remain red
    if (displayedText.endsWith('?')) return "#F26655";
    if (displayedText.endsWith('.') || displayedText.endsWith('!')) return "#F26655";
    return getTextColor();
  };
  
  // Get ending punctuation
  const getEndingPunctuation = () => {
    if (!displayedText) return '';
    
    if (displayedText.endsWith('.') || displayedText.endsWith('!') || displayedText.endsWith('?')) {
      return displayedText.slice(-1);
    }
    return '';
  };

  // Only render the component when we have messages and are ready
  if (!isReady || messages.length === 0 || !displayedText) {
    return null;
  }

  return (
    <ParticleTextAnimation
      text={parseEndingPunctuation(displayedText)}
      textColor={getTextColor()}
      onComplete={handleAnimationComplete}
      darkMode={darkMode}
      endingPunctuation={getEndingPunctuation()}
      endingPunctuationColor={getEndingPunctuationColor()}
      isTransitioning={isTransitioning}
    />
  );
};

export default ParticleTextCarousel; 