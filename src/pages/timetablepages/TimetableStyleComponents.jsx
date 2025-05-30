// src/pages/timetablepages/TimetableStyleComponents.jsx
import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import React from 'react';

// Google Calendar Button - Fixed to prevent darkMode prop from reaching DOM
export const GoogleCalendarButton = styled(ButtonBase)(({ theme, darkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: darkMode ? 'rgba(66, 133, 244, 0.12)' : 'rgba(255, 255, 255, 0.8)',
  borderRadius: '50%',
  height: '44px',
  width: '44px',
  padding: 0,
  color: darkMode ? '#8ab4f8' : '#4285F4',
  fontFamily: 'Google Sans, Roboto, arial, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 500,
  boxShadow: darkMode 
    ? '0 1px 2px rgba(0, 0, 0, 0.2)'
    : '0 1px 2px rgba(60, 64, 67, 0.1)',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  border: darkMode ? '1px solid rgba(66, 133, 244, 0.3)' : '1px solid rgba(218, 220, 224, 0.8)',
  '&:hover': {
    backgroundColor: darkMode ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.08)',
    boxShadow: darkMode 
      ? '0 2px 4px rgba(0, 0, 0, 0.3)'
      : '0 1px 3px rgba(60, 64, 67, 0.2)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    backgroundColor: darkMode ? 'rgba(66, 133, 244, 0.3)' : 'rgba(66, 133, 244, 0.12)',
    transform: 'translateY(0)',
  },
  '&:focus': {
    outline: 'none',
    boxShadow: darkMode 
      ? '0 0 0 2px rgba(138, 180, 248, 0.5)'
      : '0 0 0 2px rgba(66, 133, 244, 0.3)',
  },
  '& .icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

// Apple Calendar Button - Fixed to prevent darkMode prop from reaching DOM
export const AppleCalendarButton = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== 'darkMode',
})(({ theme, darkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
  borderRadius: '50%',
  height: '44px',
  width: '44px',
  padding: 0,
  color: darkMode ? '#ffffff' : '#1d1d1f',
  fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '0.85rem',
  boxShadow: 'none',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
  backdropFilter: darkMode ? 'blur(20px)' : 'none',
  '&:hover': {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
    transform: 'scale(1.02)',
  },
  '&:active': {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
    transform: 'scale(0.98)',
  },
  '&:focus': {
    outline: 'none',
    boxShadow: darkMode 
      ? '0 0 0 2px rgba(255, 255, 255, 0.3)'
      : '0 0 0 2px rgba(0, 0, 0, 0.06)',
  },
  '& .icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: darkMode ? 1 : 0.9,
  },
}));

// Google Icon
export const GoogleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
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

// Apple Icon
export const AppleIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
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