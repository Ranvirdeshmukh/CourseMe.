import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const GetStartedPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const pageRef = useRef(null);
  const videoRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Handle video positioning based on aspect ratio
  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current) {
        const video = videoRef.current;
        const videoAspectRatio = video.videoWidth / video.videoHeight;
        const windowAspectRatio = window.innerWidth / window.innerHeight;

        if (videoAspectRatio > windowAspectRatio) {
          video.style.width = 'auto';
          video.style.height = '100%';
        } else {
          video.style.width = '100%';
          video.style.height = 'auto';
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return (
    <Box 
      ref={pageRef}
      sx={{ 
        height: '150vh',
        width: '100%', 
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          height: '100vh',
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          opacity: 1 - scrollProgress,
          overflow: 'hidden', // Prevent video overflow
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.2)', // Optional overlay for better text visibility
            zIndex: 1
          }
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'cover',
          }}
        >
          <source 
  src="/ss/kite-export.mp4" 
  type="video/mp4"
/>
<source 
  src="/ss/kite-export.mp4" 
  type="video/webm"
/>
          Your browser does not support the video tag.
        </video>
      </Box>

      {/* Centered Logo */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: '15px', sm: '20px', md: '25px' },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          opacity: 1 - scrollProgress,
        }}
      >
        <img
          src="/2.png"
          alt="Logo"
          style={{
            height: isMobile ? '25px' : isTablet ? '30px' : '35px',
            width: 'auto',
          }}
        />
      </Box>

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
          opacity: 1 - scrollProgress,
          zIndex: 2,
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

export default GetStartedPage;