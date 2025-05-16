// src/pages/timetablepages/LoadingState.jsx
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingState = ({ darkMode }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
      }}
    >
      <CircularProgress sx={{ color: '#007AFF' }} size={60} />
      <Typography
        variant="h6"
        sx={{
          marginTop: '20px',
          fontFamily: 'SF Pro Display, sans-serif',
          color: darkMode ? '#FFFFFF' : 'black',
          textAlign: 'center',
          padding: '0 20px',
          transition: 'color 0.3s ease',
        }}
      >
        Great things take time—please hold on while we fetch the latest data for you!
      </Typography>
    </Box>
  );
};

export default LoadingState;