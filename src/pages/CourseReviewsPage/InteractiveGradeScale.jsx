import React, { useState, useEffect } from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { styled } from '@mui/material/styles';

const fullGrades = ['F', 'D', 'C', 'B', 'A'];
const allGrades = ['F', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A'];
const doubleGrades = ['F/D-', 'D-/D', 'D/D+', 'D+/C-', 'C-/C', 'C/C+', 'C+/B-', 'B-/B', 'B/B+', 'B+/A-', 'A-/A'];

// StyledSlider now accepts a darkMode prop to adjust colors accordingly.
const StyledSlider = styled(Slider, {
  shouldForwardProp: (prop) => prop !== 'darkMode',
})(({ theme, darkMode }) => ({
  color: darkMode ? '#34C759' : theme.palette.primary.main,
  height: 8,
  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: darkMode ? '#333333' : '#fff',
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active': {
      boxShadow: 'inherit',
    },
  },
  '& .MuiSlider-valueLabel': {
    fontSize: 14,
    fontWeight: 'bold',
    top: -6,
    backgroundColor: 'unset',
    color: darkMode ? '#FFFFFF' : theme.palette.text.primary,
    '&:before': {
      display: 'none',
    },
    '& *': {
      background: 'transparent',
      color: darkMode ? '#fff' : '#000',
    },
  },
  '& .MuiSlider-track': {
    border: 'none',
    height: 4,
  },
  '& .MuiSlider-rail': {
    opacity: 0.5,
    backgroundColor: darkMode ? '#555555' : '#bfbfbf',
    height: 4,
  },
  '& .MuiSlider-mark': {
    backgroundColor: darkMode ? '#555555' : '#bfbfbf',
    height: 5,
    width: 3,
    marginTop: -2,
    '&.MuiSlider-markActive': {
      opacity: 1,
      backgroundColor: darkMode ? '#34C759' : 'currentColor',
    },
  },
}));

const InteractiveGradeScale = ({ value, onChange, darkMode }) => {
  const [sliderValue, setSliderValue] = useState(allGrades.indexOf(value) * 2);

  useEffect(() => {
    setSliderValue(allGrades.indexOf(value) * 2);
  }, [value]);

  const handleChange = (event, newValue) => {
    setSliderValue(newValue);
    const index = Math.floor(newValue / 2);
    const isDoubleGrade = newValue % 2 !== 0;

    if (isDoubleGrade) {
      onChange(doubleGrades[index]);
    } else {
      onChange(allGrades[index]);
    }

    // Haptic feedback (if supported)
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  const marks = allGrades.flatMap((grade, index) => {
    const isFullGrade = fullGrades.includes(grade);
    const isHalfGrade = grade.includes('+') || grade.includes('-');
    const fullMark = {
      value: index * 2,
      label: isFullGrade ? grade : '',
      style: {
        height: isFullGrade ? 16 : isHalfGrade ? 10 : 6,
        width: isFullGrade ? 2 : 1,
        marginTop: isFullGrade ? -6 : isHalfGrade ? -3 : -1,
      },
    };
    const doubleMark =
      index < allGrades.length - 1
        ? {
            value: index * 2 + 1,
            label: '',
            style: {
              height: 8,
              width: 1,
              marginTop: -2,
            },
          }
        : null;
    return doubleMark ? [fullMark, doubleMark] : [fullMark];
  });

  const valueLabelFormat = (value) => {
    const index = Math.floor(value / 2);
    return value % 2 === 0 ? allGrades[index] : doubleGrades[index];
  };

  return (
    <Box
      sx={{
        width: '100%',
        mt: 4,
        mb: 4,
        color: darkMode ? '#FFFFFF' : '#333333',
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          mb: 3,
          color: darkMode ? '#FFFFFF' : '#333333',
        }}
      >
        Median Grade
      </Typography>
      <Box sx={{ px: 2 }}>
        <StyledSlider
          darkMode={darkMode}
          aria-label="Grade marks"
          value={sliderValue}
          min={0}
          max={(allGrades.length - 1) * 2}
          step={1}
          valueLabelDisplay="on"
          marks={marks}
          onChange={handleChange}
          valueLabelFormat={valueLabelFormat}
          sx={{
            '& .MuiSlider-markLabel': {
              fontSize: '1rem',
              fontWeight: 'bold',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default InteractiveGradeScale;
