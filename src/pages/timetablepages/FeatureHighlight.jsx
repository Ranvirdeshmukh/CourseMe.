// src/pages/timetablepages/FeatureHighlight.jsx
import React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

const FeatureHighlight = ({ 
  show, 
  darkMode, 
  onClose, 
  onTryNow 
}) => {
  if (!show) return null;
  
  return (
    <ClickAwayListener onClickAway={onClose}>
      <Box
        sx={{
          position: 'absolute',
          bottom: 76,
          right: 0,
          width: 280,
          padding: '16px',
          borderRadius: '14px',
          backgroundColor: darkMode 
            ? 'rgba(60, 60, 80, 0.95)' 
            : 'rgba(255, 255, 255, 0.98)',
          color: darkMode ? '#FFFFFF' : '#000000',
          boxShadow: darkMode 
            ? '0 10px 25px rgba(0, 0, 0, 0.5)' 
            : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(20px)',
          border: darkMode 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(0, 0, 0, 0.05)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          fontSize: '14px',
          fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
          transform: 'translateX(-40px)',
          opacity: 1,
          animation: 'fadeSlideIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
          '@keyframes fadeSlideIn': {
            from: {
              opacity: 0,
              transform: 'translateX(-20px) translateY(10px)'
            },
            to: {
              opacity: 1,
              transform: 'translateX(-40px) translateY(0)'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarMonthIcon 
            sx={{ 
              color: darkMode ? '#FFFFFF' : '#007AFF',
              mr: 1.5,
              fontSize: 22
            }} 
          />
          <Typography sx={{ 
            fontWeight: 600, 
            fontSize: '16px',
            color: darkMode ? '#FFFFFF' : '#000000'
          }}>
            New! Weekly Schedule
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{ 
              padding: '4px',
              color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography sx={{ mb: 1.5, lineHeight: 1.4 }}>
          Visualize your class schedule by day and time with our new weekly planner.
        </Typography>
        
        <Button
          variant="text"
          onClick={onTryNow}
          endIcon={<ArrowRightAltIcon />}
          sx={{
            alignSelf: 'flex-start',
            color: darkMode ? '#BB86FC' : '#007AFF',
            fontWeight: 500,
            padding: '4px 8px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.08)' : 'rgba(0, 122, 255, 0.08)', 
            }
          }}
        >
          Try it now
        </Button>
        
        <Box sx={{ 
          position: 'absolute',
          bottom: -10,
          right: 30,
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: darkMode
            ? '10px solid rgba(60, 60, 80, 0.95)'
            : '10px solid rgba(255, 255, 255, 0.98)',
          zIndex: 1002,
        }} />
      </Box>
    </ClickAwayListener>
  );
};

export default FeatureHighlight;
