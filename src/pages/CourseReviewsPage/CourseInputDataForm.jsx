import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, FormControl, InputLabel, Select, MenuItem, 
  Slider, Button, Grid, Paper 
} from '@mui/material';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.js';

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

  const handleSliderChange = (name) => (event, newValue) => {
    setFormData({ ...formData, [name]: newValue });
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
      // Reset form
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
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Course Input Data
      </Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="professor-select-label">Professor</InputLabel>
          <Select
            labelId="professor-select-label"
            value={selectedProfessor}
            label="Professor"
            onChange={handleProfessorChange}
          >
            {allProfessors.map((professor, index) => (
              <MenuItem key={index} value={professor}>{professor}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Grid container spacing={3}>
          {Object.entries(sliderLabels).map(([key, labels]) => (
            <Grid item xs={12} key={key}>
              <Typography gutterBottom>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Typography>
              <Slider
                value={formData[key]}
                onChange={handleSliderChange(key)}
                step={1}
                marks
                min={1}
                max={5}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => labels[value - 1]}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">{labels[0]}</Typography>
                <Typography variant="caption">{labels[4]}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Submit Data
        </Button>
      </form>
    </Paper>
  );
};

export default CourseInputDataForm;