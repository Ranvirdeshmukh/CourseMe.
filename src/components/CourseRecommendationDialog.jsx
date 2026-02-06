import React, { useState } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { submitCourseRecommendation } from '../services/recommendationService';

const CourseRecommendationDialog = ({ open, onClose, user }) => {
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!courseName || !department) {
      setError('Please fill out all fields');
      setSubmitting(false);
      return;
    }

    const result = await submitCourseRecommendation(
      courseName,
      department,
      user.uid,
      user.displayName || user.email
    );

    if (result.success) {
      console.log(`Added ${courseName} to recommendations`);
      setSubmitted(true);
      setCourseName('');
      setDepartment('');
    } else {
      setError(result.error);
    }

    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    setSubmitted(false); // Reset submitted state when dialog is closed
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      sx={{ 
        '& .MuiPaper-root': { 
          borderRadius: '16px', // Rounded corners for a sleek look
          padding: '24px', 
          backgroundColor: '#f9f9f9', // Light background for elegance
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: '#333' }}>
        {submitted ? 'Thank You!' : 'Recommend a Hidden Gem Course'}
      </DialogTitle>
      <DialogContent>
        {submitted ? (
          <Typography variant="body1" sx={{ textAlign: 'center', color: '#666', mt: 2 }}>
            Thank you for your recommendation. It will be reviewed and added to the list if approved.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', mb: 2 }}>
              Your recommendation will be reviewed and then added to the list if approved.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              
              <TextField
                label="Department Code"
                value={department}
                onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                placeholder="e.g., COSC"
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                  }
                }}
              />

              <TextField
                label="Course Name"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Introduction to Programming"
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                  }
                }}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', mt: 2 }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
          sx={{ 
            fontSize: '0.875rem',
            fontWeight: 'bold',
            borderRadius: '20px',
            padding: '8px 24px',
            color: '#555',
            backgroundColor: '#e0e0e0',
            '&:hover': {
              backgroundColor: '#d0d0d0',
            },
            mr: 1
          }}
        >
          {submitted ? 'Close' : 'Cancel'}
        </Button>
        {!submitted && (
          <Button 
            onClick={handleSubmit}
            disabled={submitting}
            variant="contained"
            sx={{ 
              fontSize: '0.875rem',
              fontWeight: 'bold',
              borderRadius: '20px',
              padding: '8px 24px',
              backgroundColor: '#571ce0',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#005032',
              }
            }}
          >
            Submit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CourseRecommendationDialog;
