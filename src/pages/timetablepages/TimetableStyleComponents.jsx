// src/pages/timetablepages/TimetableStyleComponents.jsx
import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import React from 'react';

// Enhanced Google Calendar Button - More prominent with Apple-inspired design
export const GoogleCalendarButton = styled(ButtonBase)(({ theme, darkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // Enhanced background with subtle gradient
  background: darkMode 
    ? 'linear-gradient(135deg, rgba(66, 133, 244, 0.15) 0%, rgba(66, 133, 244, 0.08) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(66, 133, 244, 0.02) 100%)',
  borderRadius: '50%', // Circular design consistent with other buttons
  height: '42px',
  width: '42px',
  padding: 0,
  color: darkMode ? '#8AB4F8' : '#4285F4',
  fontFamily: 'SF Pro Display, Google Sans, Roboto, arial, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 600,
  // Enhanced shadow for depth
  boxShadow: darkMode 
    ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(66, 133, 244, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    : '0 3px 12px rgba(66, 133, 244, 0.15), 0 1px 3px rgba(60, 64, 67, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  cursor: 'pointer',
  // Refined border
  border: darkMode 
    ? '1px solid rgba(66, 133, 244, 0.25)' 
    : '1px solid rgba(66, 133, 244, 0.1)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  position: 'relative',
  overflow: 'hidden',
  
  // Subtle inner glow effect
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: darkMode
      ? 'radial-gradient(circle at 50% 0%, rgba(66, 133, 244, 0.1) 0%, transparent 50%)'
      : 'radial-gradient(circle at 50% 0%, rgba(66, 133, 244, 0.05) 0%, transparent 50%)',
    borderRadius: '50%',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  
  '&:hover': {
    background: darkMode 
      ? 'linear-gradient(135deg, rgba(66, 133, 244, 0.25) 0%, rgba(66, 133, 244, 0.12) 100%)'
      : 'linear-gradient(135deg, rgba(66, 133, 244, 0.08) 0%, rgba(66, 133, 244, 0.04) 100%)',
    boxShadow: darkMode 
      ? '0 6px 20px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(66, 133, 244, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
      : '0 4px 20px rgba(66, 133, 244, 0.2), 0 2px 6px rgba(60, 64, 67, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    transform: 'translateY(-2px) scale(1.05)',
    border: darkMode 
      ? '1px solid rgba(66, 133, 244, 0.4)' 
      : '1px solid rgba(66, 133, 244, 0.2)',
    
    '&::before': {
      opacity: 1,
    },
  },
  
  '&:active': {
    transform: 'translateY(-1px) scale(1.02)',
    boxShadow: darkMode 
      ? '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(66, 133, 244, 0.3)'
      : '0 2px 8px rgba(66, 133, 244, 0.2), 0 1px 3px rgba(60, 64, 67, 0.15)',
  },
  
  '&:focus': {
    outline: 'none',
    boxShadow: darkMode 
      ? '0 0 0 3px rgba(138, 180, 248, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)'
      : '0 0 0 3px rgba(66, 133, 244, 0.25), 0 3px 12px rgba(66, 133, 244, 0.15)',
  },
  
  '& .icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
    transition: 'transform 0.2s ease',
  },
  
  '&:hover .icon': {
    transform: 'scale(1.1)',
  },
}));

// Enhanced Apple Calendar Button - More prominent with signature Apple design
export const AppleCalendarButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== 'darkMode',
})(({ theme, darkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // Signature Apple translucent design
  background: darkMode 
    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(0, 0, 0, 0.01) 100%)',
  borderRadius: '50%', // Circular design consistent with other buttons
  height: '42px',
  width: '42px',
  padding: 0,
  color: darkMode ? '#FFFFFF' : '#1D1D1F',
  fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 600,
  // Apple's signature shadow style
  boxShadow: darkMode
    ? '0 4px 12px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 3px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  cursor: 'pointer',
  border: darkMode 
    ? '1px solid rgba(255, 255, 255, 0.15)' 
    : '1px solid rgba(0, 0, 0, 0.06)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  position: 'relative',
  overflow: 'hidden',
  
  // Apple's signature light reflection
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: darkMode
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%)',
    borderRadius: '50% 50% 0 0',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  
  '&:hover': {
    background: darkMode 
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(0, 0, 0, 0.02) 100%)',
    boxShadow: darkMode
      ? '0 6px 20px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
      : '0 4px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
    transform: 'translateY(-2px) scale(1.05)',
    border: darkMode 
      ? '1px solid rgba(255, 255, 255, 0.25)' 
      : '1px solid rgba(0, 0, 0, 0.08)',
    
    '&::before': {
      opacity: 1,
    },
  },
  
  '&:active': {
    transform: 'translateY(-1px) scale(1.02)',
    background: darkMode 
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(0, 0, 0, 0.02) 100%)',
    boxShadow: darkMode
      ? '0 2px 8px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1)'
      : '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  
  '&:focus': {
    outline: 'none',
    boxShadow: darkMode 
      ? '0 0 0 3px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25)'
      : '0 0 0 3px rgba(0, 122, 255, 0.25), 0 3px 12px rgba(0, 0, 0, 0.08)',
  },
  
  '& .icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: darkMode ? 1 : 0.9,
    position: 'relative',
    zIndex: 1,
    transition: 'all 0.2s ease',
  },
  
  '&:hover .icon': {
    opacity: 1,
    transform: 'scale(1.1)',
  },
}));

// Enhanced Google Icon with better sizing
export const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

// Enhanced Apple Icon with better sizing
export const AppleIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

// Enrollment Display components - Fixed to prevent darkMode prop from reaching DOM
export const EnrollmentDisplay = styled('div', {
  shouldForwardProp: (prop) => prop !== 'status' && prop !== 'darkMode',
})(({ theme, status, darkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '6px',
  backgroundColor: status === 'full' 
    ? (darkMode ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)')
    : status === 'open'
      ? (darkMode ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.05)')
      : status === 'ip'
        ? (darkMode ? 'rgba(255, 204, 0, 0.1)' : 'rgba(255, 204, 0, 0.05)')
        : 'transparent',
  fontFamily: 'SF Pro Display, sans-serif',
}));

export const EnrollmentText = styled('div', {
  shouldForwardProp: (prop) => prop !== 'status' && prop !== 'darkMode',
})(({ theme, status, darkMode }) => ({
  fontWeight: 600,
  fontSize: '0.9rem',
  color: status === 'full' 
    ? (darkMode ? '#ff6b6b' : '#ff3b30')
    : status === 'open'
      ? (darkMode ? '#40c057' : '#34c759')
      : status === 'ip'
        ? (darkMode ? '#ffd43b' : '#ffcc00')
        : (darkMode ? '#adb5bd' : '#8e8e93'),
}));

export const EnrollmentProgressBar = styled('div', {
  shouldForwardProp: (prop) => prop !== 'status' && prop !== 'darkMode' && prop !== 'percentage',
})(({ theme, status, darkMode, percentage }) => ({
  width: '100%',
  height: '4px',
  marginTop: '6px',
  backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  borderRadius: '2px',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${Math.min(percentage, 100)}%`,
    backgroundColor: status === 'full' 
      ? (darkMode ? '#ff6b6b' : '#ff3b30')
      : status === 'open'
        ? (darkMode ? '#40c057' : '#34c759')
        : status === 'ip'
          ? (darkMode ? '#ffd43b' : '#ffcc00')
          : (darkMode ? '#adb5bd' : '#8e8e93'),
    transition: 'width 0.3s ease'
  }
}));