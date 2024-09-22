import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

const TimeBlock = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  margin: theme.spacing(0.5),
  minWidth: '60px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[3],
  },
}));

const TimeText = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.primary.main,
}));

const DayText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
}));

const ModernTimeDisplay = ({ period, fullDescription }) => {
  const periodToTime = {
    '8': '7:45 AM - 8:35 AM',
    '9L': '8:50 AM - 9:55 AM',
    '9S': '9:05 AM - 9:55 AM',
    '10': '10:10 AM - 11:15 AM',
    '10A': '10:10 AM - 12:00 PM',
    '11': '11:30 AM - 12:35 PM',
    '12': '12:50 PM - 1:55 PM',
    '2': '2:10 PM - 3:15 PM',
    '2A': '2:25 PM - 4:15 PM',
    '3A': '3:30 PM - 5:20 PM',
    '3B': '4:30 PM - 6:20 PM',
    '6A': '6:30 PM - 8:20 PM',
    '6B': '6:30 PM - 9:30 PM',
  };

  const periodToDays = {
    '8': 'MTThF',
    '9L': 'MWF',
    '9S': 'MTuWThF',
    '10': 'MWF',
    '10A': 'TuTh',
    '11': 'MWF',
    '12': 'MWF',
    '2': 'MWF',
    '2A': 'TuTh',
    '3A': 'MW',
    '3B': 'TuTh',
    '6A': 'MTh',
    '6B': 'W',
  };

  const [startTime, endTime] = periodToTime[period]?.split(' - ') || ['', ''];
  const days = periodToDays[period] || '';

  return (
    <Tooltip title={fullDescription || periodToTime[period] || 'Time not specified'}>
      <Box display="flex" alignItems="center">
        <TimeBlock>
          <TimeText variant="body2">{startTime}</TimeText>
          <DayText>{days}</DayText>
        </TimeBlock>
        <Typography variant="body2" sx={{ mx: 1 }}>-</Typography>
        <TimeBlock>
          <TimeText variant="body2">{endTime}</TimeText>
          <DayText>{period}</DayText>
        </TimeBlock>
      </Box>
    </Tooltip>
  );
};

export default ModernTimeDisplay;