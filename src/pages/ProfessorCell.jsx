import React, { memo, useCallback } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const ProfessorCell = memo(({ instructor, darkMode }) => {
  const navigate = useNavigate();
  const professorId = instructor ? instructor.split(',')[0].trim().replace(/\s+/g, '_') : null;

  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (professorId) {
      navigate(`/professors/${professorId}`);
      window.scrollTo(0, 0);
    }
  }, [professorId, navigate]);

  return (
    <Box
      onClick={handleClick}
      sx={{
        // Always remove underline by default
        textDecoration: 'none',
        // If clickable, use brand color; otherwise normal text
        color: professorId
          ? (darkMode ? '#007AFF' : '#571ce0')
          : (darkMode ? '#FFFFFF' : '#1D1D1F'),
        fontWeight: 400,
        fontSize: '0.81rem',
        cursor: professorId ? 'pointer' : 'default',
        lineHeight: '1.2',
        transition: 'color 0.3s ease, text-decoration 0.3s ease',
        // Only underline on hover if there's a valid professorId
        '&:hover': professorId
          ? { textDecoration: 'underline' }
          : {},
      }}
    >
      {instructor}
    </Box>
  );
}); 