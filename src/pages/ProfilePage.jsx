import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, List, ListItem, ListItemText, IconButton, Divider, Card, Avatar } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayRemove, setDoc } from 'firebase/firestore';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({ major: '', classYear: '', reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfileData(userDocSnap.data());
        }
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleDeleteReview = async (review) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const sanitizedCourseId = review.courseId;
      const courseDocRef = doc(db, 'reviews', sanitizedCourseId);

      // Remove review from user's profile
      await updateDoc(userDocRef, {
        reviews: arrayRemove(review),
      });

      // Remove review from course's reviews
      const courseDocSnap = await getDoc(courseDocRef);
      if (courseDocSnap.exists()) {
        const courseData = courseDocSnap.data();
        const updatedReviews = courseData[review.professor].filter(r => r !== `review: "${review.term} with ${review.professor}: ${review.review}"`);
        if (updatedReviews.length === 0) {
          delete courseData[review.professor];
        } else {
          courseData[review.professor] = updatedReviews;
        }
        await setDoc(courseDocRef, courseData);
      }

      // Update the frontend state
      setProfileData(prevState => ({
        ...prevState,
        reviews: prevState.reviews.filter(r => r !== review),
      }));
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#E4E2DD',
        color: '#571CE0',
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        paddingTop: 4
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ marginBottom: 4, padding: 4, backgroundColor: '#fff', color: '#571CE0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <Avatar sx={{ bgcolor: '#571CE0', width: 56, height: 56, marginRight: 2 }}>
              {currentUser.email.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="h4" gutterBottom>{currentUser.email}</Typography>
              <Typography variant="h6">Welcome to your profile!</Typography>
            </Box>
          </Box>
          <Divider />
          <Box sx={{ textAlign: 'left', marginTop: 2 }}>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>Profile Information</Typography>
                <Typography>Major: {profileData.major}</Typography>
                <Typography>Class Year: {profileData.classYear}</Typography>
              </>
            )}
          </Box>
        </Card>
        
        <Card sx={{ padding: 4, backgroundColor: '#fff', color: '#571CE0' }}>
          <Typography variant="h5" gutterBottom>My Reviews</Typography>
          <Divider />
          <List>
            {profileData.reviews.map((review, idx) => (
              <ListItem key={idx} sx={{ backgroundColor: '#E4E2DD', margin: '10px 0', borderRadius: '8px' }}>
                <ListItemText
                  primary={
                    <>
                      <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold' }}>
                        {review.term} with {review.professor}:
                      </Typography>{' '}
                      <Typography component="span" sx={{ color: 'black' }}>
                        {review.review}
                      </Typography>
                    </>
                  }
                />
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteReview(review)}
                  sx={{ color: '#571CE0' }}
                >
                  <Delete />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Card>

        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
          sx={{
            mt: 2,
            background: 'linear-gradient(90deg, rgba(87,28,224,1) 0%, rgba(144,19,254,1) 100%)',
            borderRadius: '25px',
          }}
        >
          Log Out
        </Button>
      </Container>
    </Box>
  );
};

export default ProfilePage;
