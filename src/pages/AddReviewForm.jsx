import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TextField, Button, Container, Typography, Alert, Autocomplete, createFilterOptions } from '@mui/material';
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const AddReviewForm = ({ onReviewAdded }) => {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const [term, setTerm] = useState('');
  const [professor, setProfessor] = useState('');
  const [review, setReview] = useState('');
  const [error, setError] = useState(null);
  const [professorsList, setProfessorsList] = useState([]);

  const sanitizedCourseId = courseId.split('_')[1];

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const docRef = doc(db, 'reviews', sanitizedCourseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const professors = Object.keys(data);
          setProfessorsList(professors);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching professors:', error);
      }
    };

    fetchProfessors();
  }, [sanitizedCourseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!term || !professor || !review) {
      setError('All fields are required');
      return;
    }

    try {
      const reviewData = `review: "${term} with ${professor}: ${review}"`;

      // Add review to the course's reviews collection
      const courseDocRef = doc(db, 'reviews', sanitizedCourseId);
      const courseDocSnap = await getDoc(courseDocRef);

      if (!courseDocSnap.exists()) {
        // If the document doesn't exist, create it
        await setDoc(courseDocRef, { [professor]: [] });
      }

      await updateDoc(courseDocRef, {
        [professor]: arrayUnion(reviewData),
      });

      // Add review to the user's profile
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        reviews: arrayUnion({
          courseId: sanitizedCourseId,
          term,
          professor,
          review,
        }),
      });

      // If the professor is new, add to the professorsList state
      if (!professorsList.includes(professor)) {
        setProfessorsList([...professorsList, professor]);
      }

      onReviewAdded();
      setTerm('');
      setProfessor('');
      setReview('');
      setError(null);
    } catch (error) {
      console.error('Error adding review:', error.message);
      setError('Failed to add review. Error: ' + error.message);
    }
  };

  const filterOptions = createFilterOptions({
    matchFrom: 'start',
    stringify: (option) => option,
  });

  return (
    <Container>
      <Typography variant="h5" gutterBottom>Write a Review for {sanitizedCourseId}</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          fullWidth
          margin="normal"
          required
          placeholder="e.g., 24F"
          InputProps={{
            sx: {
              backgroundColor: 'white',
              color: 'black',
              borderRadius: '4px',
            }
          }}
        />
        <Autocomplete
          options={professorsList}
          filterOptions={filterOptions}
          getOptionLabel={(option) => option}
          freeSolo
          value={professor}
          onChange={(event, newValue) => {
            setProfessor(newValue);
          }}
          onInputChange={(event, newInputValue) => {
            setProfessor(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Professor"
              margin="normal"
              required
              placeholder="Select or type a professor"
              fullWidth
              InputProps={{
                ...params.InputProps,
                sx: {
                  backgroundColor: 'white',
                  color: 'black',
                  borderRadius: '4px',
                }
              }}
            />
          )}
        />
        <TextField
          label="Review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={4}
          required
          InputProps={{
            sx: {
              backgroundColor: 'white',
              color: 'black',
              borderRadius: '4px',
            }
          }}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Submit
        </Button>
      </form>
    </Container>
  );
};

export default AddReviewForm;
