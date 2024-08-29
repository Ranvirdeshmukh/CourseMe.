import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Typography, Box } from '@mui/material';
import { Animate } from 'react-simple-animate';
import ReactTypingEffect from 'react-typing-effect';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const GetStartedPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showText, setShowText] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const pageRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowText(true);
    }, 500);

    const handleScroll = () => {
      if (pageRef.current) {
        const scrollPosition = window.scrollY;
        const viewportHeight = window.innerHeight;
        const scrollHeight = viewportHeight * 0.5; // Reduce scroll height to 50% of viewport
        const progress = Math.min(scrollPosition / scrollHeight, 1);
        setScrollProgress(progress);
    
        if (progress >= 0.9) {
          window.removeEventListener('scroll', handleScroll);
          setTimeout(() => {
            window.scrollTo(0, 0); // Reset scroll position to the top
            navigate(currentUser ? '/landing' : '/login');
          }, 300);
        }
      }
    };
    

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentUser, navigate]);

  const questions = [
    "Need help choosing your courses?",
    "Want to organise your Timetable?",
    "Need help finding out which classes are easy?",
    "Trouble studying on Friday night when you'd rather be partying?",
    "Trouble balancing your course load?"
  ];

  return (
    <Box 
      ref={pageRef}
      sx={{ 
        backgroundColor: '#E4E2DC', 
        height: '150vh', // Reduce total height to 150% of viewport
        width: '100%', 
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          height: '100vh',
          transform: `translateY(${-scrollProgress * 50}vh)`, // Reduce translation
          transition: 'transform 0.2s ease-out', // Faster transition
          opacity: 1 - scrollProgress,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          paddingLeft: '20px',
        }}
      >
        {showText && (
          <Animate
            play
            start={{ opacity: 0, transform: 'translateY(-10px)' }}
            end={{ opacity: 1, transform: 'translateY(0)' }}
            duration={1.5}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                fontWeight: 600,
                color: '#1D1D1F',
                textAlign: 'left',
                padding: '20px 0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                marginTop: '20px',
              }}
            >
              <ReactTypingEffect
                text={questions}
                typingDelay={1000}
                speed={50}
                eraseSpeed={30}
                eraseDelay={3000}
                displayTextRenderer={(text, i) => {
                  return (
                    <div>
                      {text.split('').map((char, i) => {
                        return <span key={i}>{char}</span>;
                      })}
                    </div>
                  );
                }}
              />
            </Typography>
          </Animate>
        )}

        <Box
          sx={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'bounce 2s infinite',
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
          <Typography variant="body1" sx={{ mb: 1, fontFamily: 'SF Pro Display, sans-serif' }}>
            Scroll to continue
          </Typography>
          <KeyboardArrowDownIcon fontSize="large" />
        </Box>

        <Box
          sx={{
            position: 'absolute',
            bottom: '20px',
            right: '40px',
          }}
        >
          <img
            src="/1.png"
            alt="Logo"
            style={{ height: '30px' }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default GetStartedPage;