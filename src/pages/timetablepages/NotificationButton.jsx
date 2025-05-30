// src/components/timetablepages/NotificationButton.jsx
import React from 'react';
import { Box, IconButton, Tooltip, Typography, TableCell } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LockIcon from '@mui/icons-material/Lock';

const NotificationButton = ({
  course,
  isPriorityEligible,
  isFallAddDropClosed,
  notificationPriority,
  toggleNotificationPriority,
  handleNotifyDrop,
  darkMode
}) => {
  const getTooltipText = () => {
    if (isFallAddDropClosed) {
      return "Summer add/drop notifications will open on 8:00 AM Mon, Mar 31";
    } else if (course.isNotified) {
      return "Click to remove notification";
    } else {
      return "Get notified if someone drops this class";
    }
  };

  return (
    <TableCell sx={{ padding: '12px', textAlign: 'left' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <Tooltip title={getTooltipText()}>
          <span>
            <IconButton 
              onClick={() => handleNotifyDrop(course)} 
              disabled={isFallAddDropClosed}
              sx={{ 
                backgroundColor: course.isNotified && course.notificationPriority === 'priority'
                  ? (darkMode ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)')
                  : course.isNotified
                    ? (darkMode ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)')
                    : (darkMode ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 122, 255, 0.05)'),
                '&:hover': { 
                  backgroundColor: course.isNotified && course.notificationPriority === 'priority'
                    ? (darkMode ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 59, 48, 0.15)')
                    : course.isNotified
                      ? (darkMode ? 'rgba(0, 122, 255, 0.3)' : 'rgba(0, 122, 255, 0.15)')
                      : (darkMode ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)')
                },
                '&.Mui-disabled': {
                  backgroundColor: darkMode ? 'rgba(150, 150, 150, 0.1)' : 'rgba(150, 150, 150, 0.05)'
                },
                border: course.isNotified && course.notificationPriority === 'priority'
                  ? '1px solid rgba(255, 59, 48, 0.5)'
                  : 'none'
              }}
            >
              {isFallAddDropClosed ? (
                <LockIcon sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)', fontSize: '1.2rem' }} />
              ) : (
                course.isNotified === true ? (
                  course.notificationPriority === 'priority' ? (
                    <NotificationsActiveIcon sx={{ color: '#FF3B30', fontSize: '1.2rem' }} />
                  ) : (
                    <NotificationsActiveIcon sx={{ color: '#007AFF', fontSize: '1.2rem' }} />
                  )
                ) : (
                  <NotificationsNoneIcon sx={{ color: '#007AFF', fontSize: '1.2rem' }} />
                )
              )}
            </IconButton>
          </span>
        </Tooltip>
        
        {isPriorityEligible && !course.isNotified && !isFallAddDropClosed && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: notificationPriority === 'priority' 
                ? (darkMode ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)')
                : 'transparent',
              '&:hover': {
                backgroundColor: notificationPriority === 'priority'
                  ? (darkMode ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)')
                  : (darkMode ? 'rgba(150, 150, 150, 0.1)' : 'rgba(150, 150, 150, 0.05)')
              }
            }}
            onClick={toggleNotificationPriority}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                color: notificationPriority === 'priority'
                  ? '#FF3B30'
                  : darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontWeight: 600,
                letterSpacing: '0.02em'
              }}
            >
              Priority
            </Typography>
          </Box>
        )}
      </Box>
    </TableCell>
  );
};

export default NotificationButton;