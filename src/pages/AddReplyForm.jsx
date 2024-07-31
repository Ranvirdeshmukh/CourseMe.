import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, addDoc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

const AddReplyForm = ({ reviewData, courseId, onReplyAdded }) => {
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
        onReplyAdded(); // Refresh the reviews
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
        sx={{ margin: '10px 0' }}
      />
      <Button type="submit" variant="contained" color="primary" sx={{ marginTop: '10px' }}>
        Submit Reply
      </Button>
    </form>
  );
};

export default AddReplyForm;
