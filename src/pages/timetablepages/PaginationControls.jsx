// src/pages/timetablepages/PaginationControls.jsx
import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  handlePreviousPage, 
  handleNextPage, 
  darkMode 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '20px',
      }}
    >
      <IconButton
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        sx={{
          marginRight: '10px',
          color: '#007AFF',
          '&.Mui-disabled': {
            color: darkMode ? '#555555' : '#999999',
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Typography
        variant="body1"
        sx={{
          color: darkMode ? '#FFFFFF' : '#1D1D1F',
          transition: 'color 0.3s ease',
        }}
      >
        Page {currentPage} of {totalPages}
      </Typography>

      <IconButton
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        sx={{
          marginLeft: '10px',
          color: '#007AFF',
          '&.Mui-disabled': {
            color: darkMode ? '#555555' : '#999999',
          },
        }}
      >
        <ArrowForwardIcon />
      </IconButton>
    </Box>
  );
};

export default PaginationControls;