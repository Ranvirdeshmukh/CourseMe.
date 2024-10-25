import React, { useState } from 'react';
import { 
  Box, Typography, FormControl, InputLabel, Select, MenuItem, 
  Button, Grid, Paper, styled 
} from '@mui/material';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.js';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  maxWidth: '42rem',
  margin: '0 auto',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(209, 213, 219, 0.3)',
  padding: theme.spacing(4)
}));

const StyledFormButton = styled(Button)(({ theme, selected }) => ({
  padding: theme.spacing(1.5),
  width: '100%',
  textTransform: 'none',
  borderRadius: '12px',
  fontSize: '0.875rem',
  backgroundColor: selected ? theme.palette.primary.main : 'rgb(249, 250, 251)',
  color: selected ? '#fff' : 'rgb(75, 85, 99)',
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : 'rgb(243, 244, 246)',
  },
  transition: 'all 0.2s ease-in-out',
  transform: selected ? 'scale(1.05)' : 'scale(1)',
  boxShadow: selected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: 'rgb(249, 250, 251)',
  borderRadius: '12px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgb(209, 213, 219)'
  }
}));

const CourseInputDataForm = ({ courseId, allProfessors }) => {
  const { currentUser } = useAuth();
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [formData, setFormData] = useState({
    xHourRequired: 1,
    workload: 1,
    difficulty: 1,
    grading: 1,
    quality: 1,
    enjoyment: 1
  });

  const handleProfessorChange = (event) => {
    setSelectedProfessor(event.target.value);
  };

  const handleOptionSelect = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      alert('You must be logged in to submit data.');
      return;
    }
    if (!selectedProfessor) {
      alert('Please select a professor.');
      return;
    }

    try {
      const courseRef = doc(db, 'courses', courseId);
      const newData = {
        professor: selectedProfessor,
        ...formData,
        timestamp: new Date(),
        userId: currentUser.uid
      };

      await updateDoc(courseRef, {
        inputData: arrayUnion(newData)
      });

      alert('Data submitted successfully!');
      setSelectedProfessor('');
      setFormData({
        xHourRequired: 1,
        workload: 1,
        difficulty: 1,
        grading: 1,
        quality: 1,
        enjoyment: 1
      });
    } catch (error) {
      console.error('Error submitting data:', error);
      alert('Failed to submit data. Please try again.');
    }
  };

  const sliderLabels = {
    xHourRequired: ['None', 'Rarely', 'Sometimes', 'Often', 'Required'],
    workload: ['Very Light', 'Light', 'Moderate', 'Heavy', 'Very Heavy'],
    difficulty: ['Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard'],
    grading: ['Very Lenient', 'Lenient', 'Fair', 'Strict', 'Very Strict'],
    quality: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
    enjoyment: ['Not Enjoyable', 'Somewhat Enjoyable', 'Neutral', 'Enjoyable', 'Very Enjoyable']
  };

  return (
    <StyledPaper elevation={0}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 500, 
          color: 'rgb(17, 24, 39)'
        }}>
          Course Feedback
        </Typography>
      </Box>
      
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel id="professor-select-label" sx={{ 
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'rgb(55, 65, 81)'
          }}>
            Professor
          </InputLabel>
          <StyledSelect
            labelId="professor-select-label"
            value={selectedProfessor}
            label="Professor"
            onChange={handleProfessorChange}
          >
            {allProfessors.map((professor, index) => (
              <MenuItem key={index} value={professor}>{professor}</MenuItem>
            ))}
          </StyledSelect>
        </FormControl>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(sliderLabels).map(([key, labels]) => (
            <Box key={key}>
              <Typography sx={{ 
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'rgb(55, 65, 81)',
                mb: 2
              }}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Typography>
              <Grid container spacing={1}>
                {labels.map((label, index) => (
                  <Grid item xs={12/5} key={index}>
                    <StyledFormButton
                      onClick={() => handleOptionSelect(key, index + 1)}
                      selected={formData[key] === index + 1}
                      variant={formData[key] === index + 1 ? "contained" : "outlined"}
                    >
                      {label}
                    </StyledFormButton>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 4,
            py: 1.5,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            background: 'linear-gradient(to right, #2563eb, #3b82f6)',
            '&:hover': {
              background: 'linear-gradient(to right, #1d4ed8, #2563eb)',
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Submit Feedback
        </Button>
      </form>
    </StyledPaper>
  );
};

export default CourseInputDataForm;