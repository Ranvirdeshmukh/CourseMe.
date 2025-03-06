import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, addDoc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';

const AddReplyForm = ({
  reviewData,
  courseId,
  onReplyAdded,
  darkMode,
  textColor,
  backgroundColor,
  buttonColor,
  buttonHoverColor,
  inputBgColor,
  inputBorderColor,
  inputTextColor,
}) => {
  const [reply, setReply] = useState('');
  const { currentUser } = useAuth();

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !reply) return;

    const newReply = {
      reply,
      author: currentUser.displayName,
      timestamp: new Date().toISOString(),
      courseId,
      reviewData,
    };

    const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
    const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
    const sanitizedCourseId = transformedCourseId ? transformedCourseId : courseId.split('_')[1];

    const reviewRef = doc(db, 'reviews', sanitizedCourseId);
    const docSnap = await getDoc(reviewRef);

    if (docSnap.exists()) {
      const { instructor, reviewIndex } = reviewData;
      const sanitizedInstructor = instructor.replace(/\./g, '_');

      const repliesCollectionRef = collection(reviewRef, `${sanitizedInstructor}_${reviewIndex}_replies`);

      try {
        await addDoc(repliesCollectionRef, newReply);

        // Update the user's profile with the new reply
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          replies: arrayUnion(newReply),
        });

        setReply('');
        // Pass the new reply to the parent component
        if (typeof onReplyAdded === 'function') {
          onReplyAdded(newReply);
        }
      } catch (error) {
        console.error('Error adding reply:', error);
      }
    } else {
      console.error('Review document does not exist');
    }
  };

  return (
    <form onSubmit={handleReplySubmit}>
      <TextField
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        label="Add a reply"
        fullWidth
        multiline
        rows={2}
        variant="outlined"
        sx={{ 
          margin: '10px 0',
          backgroundColor: inputBgColor, // Dynamic background
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: inputBorderColor, // Dynamic border color
            },
            '&:hover fieldset': {
              borderColor: darkMode ? '#555555' : '#BDBDBD', // Dynamic hover border
            },
            '&.Mui-focused fieldset': {
              borderColor: '#007AFF', // Primary color on focus
            },
          },
          '& .MuiInputLabel-root': {
            color: inputTextColor, // Dynamic label color
          },
          '& .MuiInputBase-input': {
            color: inputTextColor, // Dynamic input text color
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ 
          marginTop: '10px',
          backgroundColor: buttonColor, // Dynamic button background
          color: '#FFFFFF',             // Assuming button text remains white
          '&:hover': {
            backgroundColor: buttonHoverColor, // Dynamic hover background
          },
        }}
      >
        Submit Reply
      </Button>
    </form>
  );
};

export default AddReplyForm;
