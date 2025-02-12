// components/UniversalFooter.js
import React from 'react';
import { Box, Link, Typography } from '@mui/material';

const UniversalFooter = ({ darkMode }) => {
  // Use the same color scheme as your AllClassesPage:
  const backgroundColor = darkMode ? '#1C1F43' : '#F9F9F9';
  const textColor = darkMode ? '#FFFFFF' : '#333333';
  const borderTop = '2px solidrgb(187, 230, 145)'; // Accent color remains the same in both modes
  const linkColor = darkMode ? '#00693e' : '#00693e'; // Accent color for links

  return (
    <Box
      component="footer"
      sx={{
        textAlign: 'center',
        py: 2,
        mt: 'auto',
        backgroundColor,
        color: textColor,
        borderTop,
      }}
    >
      <Typography variant="body2">
        Have any concerns? Contact{' '}
        <Link 
          href="mailto:team@courseme.ai" 
          underline="hover"
          sx={{ color: linkColor, fontWeight: 'bold' }}
        >
          team@courseme.ai
        </Link>
      </Typography>
    </Box>
  );
};

export default UniversalFooter;
