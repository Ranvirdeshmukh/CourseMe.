import React, { useState, useRef } from 'react';
import { TextField, Button, Box, IconButton } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, addDoc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import SendIcon from '@mui/icons-material/Send';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const isMounted = useRef(true);
  
  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !reply || isSubmitting) return;

    setIsSubmitting(true);

    const newReply = {
      reply,
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

        if (isMounted.current) {
          setReply('');
          setIsSubmitting(false);
        }
        
        // Pass the new reply to the parent component
        if (typeof onReplyAdded === 'function') {
          onReplyAdded(newReply);
        }
      } catch (error) {
        console.error('Error adding reply:', error);
        if (isMounted.current) {
          setIsSubmitting(false);
        }
      }
    } else {
      console.error('Review document does not exist');
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleReplySubmit}>
      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          width: '100%',
          borderRadius: '8px',
          backgroundColor: backgroundColor,
          padding: '8px',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <TextField
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Add a reply..."
          fullWidth
          multiline
          rows={1}
          variant="outlined"
          size="small"
          disabled={isSubmitting}
          sx={{ 
            backgroundColor: inputBgColor,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: inputBorderColor,
                borderRadius: '4px',
              },
              '&:hover fieldset': {
                borderColor: darkMode ? '#555555' : '#BDBDBD',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#007AFF',
              },
            },
            '& .MuiInputLabel-root': {
              color: inputTextColor,
            },
            '& .MuiInputBase-input': {
              color: inputTextColor,
              fontSize: '0.9rem',
              padding: '8px 12px',
            },
          }}
          InputProps={{
            sx: {
              padding: '0',
            }
          }}
        />
        <IconButton
          type="submit"
          disabled={isSubmitting || !reply.trim()}
          sx={{ 
            backgroundColor: buttonColor,
            color: '#FFFFFF',
            width: '36px',
            height: '36px',
            marginTop: '4px',
            opacity: isSubmitting || !reply.trim() ? 0.7 : 1,
            '&:hover': {
              backgroundColor: buttonHoverColor,
            },
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </form>
  );
};

export default AddReplyForm;
