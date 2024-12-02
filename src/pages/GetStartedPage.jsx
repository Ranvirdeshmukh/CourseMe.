import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// This flag ensures we only preload videos once, even if the component remounts
let isPreloading = false;

// This function handles the aggressive preloading of video content
const preloadVideos = () => {
  // Guard against multiple preload attempts
  if (isPreloading) return;
  isPreloading = true;

  // Define all possible video sources that might be needed
  const videos = [
    '/ss/kite-export.mp4',
    '/ss/kite-export.webm',
    '/ss/kite-export_mobile.mp4',
    '/ss/kite-export_mobile.webm'
  ];

  // For each video, we create both preload links and hidden video elements
  videos.forEach(url => {
    // Create high-priority preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = url;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);

    // Create hidden video element to start buffering immediately
    const hiddenVideo = document.createElement('video');
    hiddenVideo.style.display = 'none';
    hiddenVideo.preload = 'auto';
    hiddenVideo.muted = true;
    hiddenVideo.src = url;
    hiddenVideo.load(); // Force the browser to start loading
    document.body.appendChild(hiddenVideo);

    // Clean up the hidden video after it has initiated buffering
    setTimeout(() => hiddenVideo.remove(), 1000);
  });
};

// Start preloading immediately when this file is imported
preloadVideos();

const GetStartedPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const pageRef = useRef(null);
  const videoRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Select appropriate video sources based on device type
  const videoSources = isMobile 
    ? [
        { src: '/ss/kite-export_mobile.mp4', type: 'video/mp4' },
        { src: '/ss/kite-export_mobile.webm', type: 'video/webm' }
      ]
    : [
        { src: '/ss/kite-export.mp4', type: 'video/mp4' },
        { src: '/ss/kite-export.webm', type: 'video/webm' }
      ];

  // Enhanced video loading with multiple event listeners for fastest possible start
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    video.setAttribute('fetchpriority', 'high');

    // Function to handle showing the video at the earliest possible moment
    const showVideo = () => {
      if (!isVideoLoaded) {
        setIsVideoLoaded(true);
        video.play().catch(error => {
          console.warn('Auto-play failed:', error);
          // Even if autoplay fails, we still show the first frame
          setIsVideoLoaded(true);
        });
      }
    };

    // Listen for multiple events to catch the earliest possible moment to play
    const events = ['loadstart', 'loadeddata', 'canplay', 'canplaythrough'];
    events.forEach(event => {
      video.addEventListener(event, showVideo);
    });

    // Force immediate loading
    video.load();
    
    // Try playing immediately - some browsers might be ready already
    video.play().catch(console.warn);

    // Clean up event listeners
    return () => {
      events.forEach(event => {
        video.removeEventListener(event, showVideo);
      });
    };
  }, []);

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

    // Initial positioning
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  return (
    <Box 
      ref={pageRef}
      sx={{ 
        height: '150vh',
        width: '100%', 
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#571ce0', // Prevents white flash before video loads
      }}
    >
      <Box
        sx={{
          height: '100vh',
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          opacity: isVideoLoaded ? 1 - scrollProgress : 0,
          overflow: 'hidden',
          transition: 'opacity 0.3s ease-in',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
          poster={isMobile ? "/ss/video-poster-mobile.jpg" : "/ss/video-poster.jpg"}
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
            opacity: isVideoLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in',
          }}
        >
          {videoSources.map((source, index) => (
            <source 
              key={index}
              src={source.src}
              type={source.type}
            />
          ))}
          Your browser does not support the video tag.
        </video>
      </Box>

      {/* Logo */}
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
          opacity: isVideoLoaded ? (1 - scrollProgress) : 0,
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