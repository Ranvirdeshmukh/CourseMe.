import React, { useMemo } from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { periodCodeToTiming } from './googleCalendarLogic';

// Calendar schedule visualization component
const ScheduleVisualization = ({ selectedCourses, darkMode }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hourSlots = [];
  
  // Generate hour slots from 8am to 9pm (covers all Dartmouth class times)
  for (let hour = 8; hour <= 21; hour++) {
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hourSlots.push(`${displayHour}:00 ${ampm}`);
    hourSlots.push(`${displayHour}:30 ${ampm}`);
  }

  // Function to parse time strings (e.g. "10:10-11:15") and convert to grid positions
  const parseTimeToGridPosition = (timeStr) => {
    const [start, end] = timeStr.split('-');
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    // Convert to 24-hour format if needed
    const start24Hour = (startHour >= 1 && startHour <= 6) ? startHour + 12 : startHour;
    const end24Hour = (endHour >= 1 && endHour <= 6) ? endHour + 12 : endHour;
    
    const startPosition = (start24Hour - 8) * 2 + (startMinute >= 30 ? 1 : 0);
    const endPosition = (end24Hour - 8) * 2 + (endMinute > 0 ? 1 : 0);
    
    return { start: startPosition, end: endPosition, duration: endPosition - startPosition };
  };

  // Function to parse day codes like "MWF" or "TuTh" to grid column indices
  const parseDaysToCols = (dayStr) => {
    const dayMap = {
      'M': 0, // Monday
      'Tu': 1, // Tuesday
      'W': 2, // Wednesday
      'Th': 3, // Thursday
      'F': 4, // Friday
    };
    
    const dayPattern = /(Th|Tu|M|W|F)/g;
    const matches = dayStr.match(dayPattern) || [];
    return matches.map(day => dayMap[day]);
  };

  // Generate a consistent color based on course subject+number
  const hashStringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Ensure colors are vibrant but not too light
    const h = hash % 360;
    const s = 65 + (hash % 20); // 65-85%
    const l = darkMode ? 65 : 45; // Lighter in dark mode, darker in light mode
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  // Process courses to get their schedule information
  const courseSchedules = useMemo(() => {
    return selectedCourses.map(course => {
      const timing = periodCodeToTiming[course.period];
      if (!timing) return null;
      
      // Skip courses with ARR or FS periods (arranged or foreign study)
      if (course.period === 'ARR' || course.period === 'FS') return null;
      
      // Split by comma to handle different meeting patterns (e.g., regular + X-hour)
      const scheduleItems = [];
      const timingParts = timing.split(', ');
      
      timingParts.forEach((part, index) => {
        try {
          const [days, times] = part.trim().split(' ');
          if (!times || !times.includes('-')) return;
          
          const dayColumns = parseDaysToCols(days);
          const { start, end, duration } = parseTimeToGridPosition(times);
          
          // For each day, add a schedule item
          dayColumns.forEach(col => {
            scheduleItems.push({
              day: col,
              startSlot: start,
              endSlot: end,
              duration: duration,
              course: course,
              isXHour: index > 0,
              // Generate a unique shade based on course subject
              colorHash: hashStringToColor(course.subj + course.num)
            });
          });
        } catch (error) {
          console.error('Error parsing course time:', error);
        }
      });
      
      return scheduleItems;
    }).filter(Boolean).flat();
  }, [selectedCourses]);

  // Find time conflicts for highlighting
  const conflicts = useMemo(() => {
    const slots = {};
    const conflicts = new Set();
    
    courseSchedules.forEach(item => {
      for (let slot = item.startSlot; slot < item.endSlot; slot++) {
        const key = `${item.day}-${slot}`;
        if (slots[key]) {
          conflicts.add(slots[key].id);
          conflicts.add(`${item.course.subj}${item.course.num}-${item.day}-${item.startSlot}`);
        } else {
          slots[key] = {
            id: `${item.course.subj}${item.course.num}-${item.day}-${item.startSlot}`,
            course: item.course
          };
        }
      }
    });
    
    return conflicts;
  }, [courseSchedules]);

  // If no courses to display, show a message
  if (selectedCourses.length === 0) {
    return (
      <Paper
        elevation={3}
        sx={{
          backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          marginBottom: '32px',
          textAlign: 'center',
          color: darkMode ? '#FFFFFF' : '#000000',
        }}
      >
        <Typography variant="h6">
          Add courses to view your weekly schedule
        </Typography>
      </Paper>
    );
  }

  // If no valid course schedules (all ARR or FS), show a message
  if (courseSchedules.length === 0) {
    return (
      <Paper
        elevation={3}
        sx={{
          backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          marginBottom: '32px',
          textAlign: 'center',
          color: darkMode ? '#FFFFFF' : '#000000',
        }}
      >
        <Typography variant="h6">
          Your selected courses don't have scheduled meeting times
        </Typography>
        <Typography variant="body2" sx={{ marginTop: '8px' }}>
          Courses with "ARR" (Arranged) or "FS" (Foreign Study) periods don't appear in the visual schedule
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '24px',
        marginBottom: '32px',
        boxShadow: darkMode
          ? '0 6px 16px rgba(255, 255, 255, 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        overflow: 'auto'
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: darkMode ? '#FFFFFF' : '#000000',
          marginBottom: '16px',
          fontFamily: 'SF Pro Display, sans-serif',
          textAlign: 'center'
        }}
      >
        Weekly Schedule Visualization
      </Typography>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'auto repeat(5, 1fr)',
        minWidth: '800px', // Ensure the grid is wide enough
        position: 'relative'
      }}>
        {/* Time column */}
        <Box sx={{ gridColumn: '1', gridRow: '1' }}></Box>
        
        {/* Day headers */}
        {days.map((day, index) => (
          <Box 
            key={day}
            sx={{
              gridColumn: index + 2,
              gridRow: '1',
              textAlign: 'center',
              padding: '8px',
              fontWeight: 600,
              borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              color: darkMode ? '#FFFFFF' : '#000000',
            }}
          >
            {day}
          </Box>
        ))}
        
        {/* Time slots */}
        {hourSlots.map((time, index) => (
          <React.Fragment key={`time-${index}`}>
            <Box 
              sx={{
                gridColumn: '1',
                gridRow: index + 2,
                padding: '4px 8px',
                fontSize: '0.75rem',
                borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                textAlign: 'right',
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                whiteSpace: 'nowrap'
              }}
            >
              {time}
            </Box>
            
            {/* Grid cells for each day */}
            {days.map((day, dayIndex) => (
              <Box
                key={`cell-${dayIndex}-${index}`}
                sx={{
                  gridColumn: dayIndex + 2,
                  gridRow: index + 2,
                  height: '30px',
                  borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                }}
              />
            ))}
          </React.Fragment>
        ))}
        
        {/* Course blocks */}
        {courseSchedules.map((item, index) => {
          const courseId = `${item.course.subj}${item.course.num}-${item.day}-${item.startSlot}`;
          const hasConflict = conflicts.has(courseId);
          
          // Extract the timing info from the periodCodeToTiming for display in tooltip
          const timingInfo = periodCodeToTiming[item.course.period] || "No timing information";
          
          return (
            <Tooltip
              key={`course-${index}`}
              title={
                <Box sx={{ p: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {item.course.subj} {item.course.num} - {item.course.sec}
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                    {item.course.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#FFB74D', fontWeight: 'bold' }}>
                    {days[item.day]} {item.isXHour ? '(X-Hour)' : ''}
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
                    Period {item.course.period}: {timingInfo}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>
                    Instructor: {item.course.instructor || 'TBD'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>
                    Location: {item.course.building || 'TBD'} {item.course.room || ''}
                  </Typography>
                  {hasConflict && (
                    <Typography sx={{ color: '#FF3B30', fontWeight: 'bold', mt: 1, fontSize: '0.9rem' }}>
                      ⚠️ Time conflict with another course
                    </Typography>
                  )}
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
              <Box
                sx={{
                  position: 'absolute',
                  left: `calc(${(item.day + 1) * (100 / 6)}% + 1px)`,
                  top: `calc(30px + ${item.startSlot * 30}px)`,
                  width: `calc(${100 / 6}% - 2px)`,
                  height: `calc(${item.duration * 30}px - 1px)`,
                  backgroundColor: item.colorHash,
                  border: hasConflict ? '2px solid #FF3B30' : 'none',
                  borderRadius: '4px',
                  padding: '4px',
                  overflow: 'hidden',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#FFFFFF', // White text for better readability
                  textShadow: '0px 1px 2px rgba(0,0,0,0.5)', // Text shadow for legibility
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: item.isXHour ? 0.7 : 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  '&:hover': {
                    zIndex: 2,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    transform: 'scale(1.01)',
                  }
                }}
              >
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {item.course.subj} {item.course.num}
                </Typography>
                {item.duration > 1 && (
                  <>
                    <Typography sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.isXHour ? 'X-Hour' : item.course.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', mt: 'auto', opacity: 0.85 }}>
                      {hourSlots[item.startSlot].split(' ')[0]} - {hourSlots[item.endSlot-1].split(' ')[0]} {hourSlots[item.startSlot].split(' ')[1]}
                    </Typography>
                  </>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      
      {/* Legend for conflicts */}
      {conflicts.size > 0 && (
        <Box sx={{ 
          marginTop: '16px', 
          padding: '8px', 
          backgroundColor: darkMode ? 'rgba(255,59,48,0.2)' : 'rgba(255,59,48,0.1)', 
          borderRadius: '4px',
          color: darkMode ? '#FF3B30' : '#FF3B30'
        }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
            ⚠️ Warning: Your schedule has time conflicts (highlighted with red borders).
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ScheduleVisualization; 