import React from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';

const MobileNavigation = ({ darkMode, currentUser, navigate, handleLoginRedirect }) => {
  // Mobile-specific button style
  const mobileButtonStyle = {
    width: '100%',
    height: '70px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '10px 15px',
    marginBottom: '10px',
    backgroundColor: darkMode ? 'rgba(87, 28, 224, 0.2)' : '#f0f0f0',
    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
      backgroundColor: darkMode ? 'rgba(87, 28, 224, 0.3)' : '#e6e6e6',
    }
  };

  return (
    <Box
      sx={{
        display: { xs: 'flex', sm: 'none' }, // Show on mobile, hide on sm and up
        flexDirection: 'column',
        width: '100%',
        mb: 4,
        padding: '10px 5px',
        marginTop: '16px'
      }}
    >
      {/* Classes - Mobile Style */}
      <ButtonBase
        onClick={() => (currentUser ? navigate('/classes') : handleLoginRedirect())}
        sx={mobileButtonStyle}
      >
        <Box sx={{ 
          mr: 3, 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: darkMode ? 'rgba(87, 28, 224, 0.3)' : '#e0e0e0',
        }}>
          <Typography sx={{ fontSize: '1.5rem' }}>📚</Typography>
        </Box>
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ 
            fontWeight: 'bold', 
            fontSize: '1rem',
            color: darkMode ? '#FFFFFF' : '#000000'
          }}>
            Classes
          </Typography>
          <Typography sx={{ 
            fontSize: '0.8rem',
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666'
          }}>
            Explore courses at Dartmouth
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Typography sx={{ fontSize: '1.2rem' }}>›</Typography>
        </Box>
      </ButtonBase>

      {/* Layups - Mobile Style */}
      <ButtonBase
        onClick={() => (currentUser ? navigate('/layups') : handleLoginRedirect())}
        sx={mobileButtonStyle}
      >
        <Box sx={{ 
          mr: 3, 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: darkMode ? 'rgba(87, 28, 224, 0.3)' : '#e0e0e0',
        }}>
          <Typography sx={{ fontSize: '1.5rem' }}>🎯</Typography>
        </Box>
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ 
            fontWeight: 'bold', 
            fontSize: '1rem',
            color: darkMode ? '#FFFFFF' : '#000000'
          }}>
            Layups
          </Typography>
          <Typography sx={{ 
            fontSize: '0.8rem',
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666'
          }}>
            Find your easy A
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Typography sx={{ fontSize: '1.2rem' }}>›</Typography>
        </Box>
      </ButtonBase>

      {/* Professors - Mobile Style */}
      <ButtonBase
        onClick={() => (currentUser ? navigate('/professors') : handleLoginRedirect())}
        sx={mobileButtonStyle}
      >
        <Box sx={{ 
          mr: 3, 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: darkMode ? 'rgba(87, 28, 224, 0.3)' : '#e0e0e0',
        }}>
          <Typography sx={{ fontSize: '1.5rem' }}>👨‍🏫</Typography>
        </Box>
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ 
            fontWeight: 'bold', 
            fontSize: '1rem',
            color: darkMode ? '#FFFFFF' : '#000000'
          }}>
            Professors
          </Typography>
          <Typography sx={{ 
            fontSize: '0.8rem',
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666'
          }}>
            AI-powered professor insights
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Typography sx={{ fontSize: '1.2rem' }}>›</Typography>
        </Box>
      </ButtonBase>

      {/* Timetable - Mobile Style */}
      <ButtonBase
        onClick={() => (currentUser ? navigate('/timetable') : handleLoginRedirect())}
        sx={mobileButtonStyle}
      >
        <Box sx={{ 
          mr: 3, 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: darkMode ? 'rgba(87, 28, 224, 0.3)' : '#e0e0e0',
        }}>
          <Typography sx={{ fontSize: '1.5rem' }}>🗓️</Typography>
        </Box>
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={{ 
            fontWeight: 'bold', 
            fontSize: '1rem',
            color: darkMode ? '#FFFFFF' : '#000000'
          }}>
            Timetable
          </Typography>
          <Typography sx={{ 
            fontSize: '0.8rem',
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666'
          }}>
            Smart scheduling, seamless sync
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Typography sx={{ fontSize: '1.2rem' }}>›</Typography>
        </Box>
      </ButtonBase>

      {/* Schedule Visualizer - Mobile Style with NEW label */}
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: '-8px',
            right: '8px',
            backgroundColor: '#F50057',
            color: '#fff',
            padding: '2px 8px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            borderRadius: '12px',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          New
        </Box>

        <ButtonBase
          onClick={() => (currentUser ? navigate('/timetable', { state: { openVisualization: true } }) : handleLoginRedirect())}
          sx={mobileButtonStyle}
        >
          <Box sx={{ 
            mr: 3, 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: darkMode ? 'rgba(87, 28, 224, 0.3)' : '#e0e0e0',
          }}>
            <Typography sx={{ fontSize: '1.5rem' }}>📅</Typography>
          </Box>
          <Box sx={{ textAlign: 'left' }}>
            <Typography sx={{ 
              fontWeight: 'bold', 
              fontSize: '1rem',
              color: darkMode ? '#FFFFFF' : '#000000'
            }}>
              Schedule Visualizer
            </Typography>
            <Typography sx={{ 
              fontSize: '0.8rem',
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#666666'
            }}>
              Plan your perfect schedule
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Typography sx={{ fontSize: '1.2rem' }}>›</Typography>
          </Box>
        </ButtonBase>
      </Box>


    </Box>
  );
};

export default MobileNavigation; 