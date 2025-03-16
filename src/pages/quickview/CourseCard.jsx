import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip } from '@mui/material';
import { periodCodeToTiming } from '../timetablepages/googleCalendarLogic';

const CourseCard = ({ course, darkMode }) => {
  // Get the timing info for tooltip display
  const timingInfo = course.period ? periodCodeToTiming[course.period] || "No timing information" : "No scheduled time";
  
  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            {course.subj} {course.num} - {course.sec}
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', mb: 0.5 }}>
            {course.title}
          </Typography>
          <Typography sx={{ 
            fontSize: '0.9rem', 
            mb: 1, 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            padding: '2px 5px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            letterSpacing: '0.5px'
          }}>
            Period {course.period}: {timingInfo}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem' }}>
            Instructor: {course.instructor || 'TBD'}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem' }}>
            Location: {course.building || 'TBD'} {course.room || ''}
          </Typography>
        </Box>
      }
      placement="top"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: darkMode ? 'rgba(38, 41, 73, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: darkMode ? '#FFFFFF' : '#000000',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            maxWidth: 'none',
            borderRadius: '8px',
            p: 0,
            '& .MuiTooltip-arrow': {
              color: darkMode ? 'rgba(38, 41, 73, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            }
          }
        }
      }}
    >
      <Card
        sx={{
          backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
          color: darkMode ? '#FFFFFF' : '#000000',
          boxShadow: darkMode
            ? '0 4px 12px rgba(255, 255, 255, 0.1)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          mb: 2,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: darkMode
              ? '0 8px 20px rgba(255, 255, 255, 0.15)'
              : '0 8px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <CardContent>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 1 }}>
            {course.subj} {course.num}
          </Typography>
          <Typography variant="body2" color={darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'} sx={{ mb: 1 }}>
            {course.title}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="caption" color={darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}>
              {course.instructor}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                backgroundColor: darkMode ? 'rgba(187, 134, 252, 0.2)' : 'rgba(0, 105, 62, 0.1)',
                color: darkMode ? '#BB86FC' : '#00693E',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              {course.period || 'ARR'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default CourseCard; 