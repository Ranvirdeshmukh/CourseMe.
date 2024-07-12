import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, List, ListItem, ListItemText, IconButton, Divider, Card, Avatar, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayRemove, setDoc } from 'firebase/firestore';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({ major: '', classYear: '', reviews: [], firstName: '', lastName: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newProfileData, setNewProfileData] = useState({});

  useEffect(() => {
    const fetchProfileData = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setProfileData({
            major: userData.major || '',
            classYear: userData.classYear || '',
            reviews: userData.reviews || [], 
            firstName: userData.firstName || '',
            lastName: userData.lastName || ''
          });
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
        const updatedReviews = courseData[review.professor]?.filter(r => r !== `review: "${review.term} with ${review.professor}: ${review.review}"`);
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

  const handleEditProfile = () => {
    setEditing(true);
    setNewProfileData({ firstName: profileData.firstName, lastName: profileData.lastName, major: profileData.major, classYear: profileData.classYear });
  };

  const handleSaveProfile = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, newProfileData);

      setProfileData(prevState => ({
        ...prevState,
        ...newProfileData
      }));
      setEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleClose = () => {
    setEditing(false);
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
        <Card sx={{ marginBottom: 4, padding: 4, backgroundColor: '#fff', color: '#571CE0', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
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
                <Typography>First Name: {profileData.firstName}</Typography>
                <Typography>Last Name: {profileData.lastName}</Typography>
                <Typography>Major: {profileData.major}</Typography>
                <Typography>Class Year: {profileData.classYear}</Typography>
                <Button variant="contained" color="primary" onClick={handleEditProfile} sx={{ mt: 2, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
                  Edit Profile
                </Button>
              </>
            )}
          </Box>
        </Card>

        <Dialog open={editing} onClose={handleClose}>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="First Name"
              type="text"
              fullWidth
              variant="standard"
              value={newProfileData.firstName}
              onChange={(e) => setNewProfileData({ ...newProfileData, firstName: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Last Name"
              type="text"
              fullWidth
              variant="standard"
              value={newProfileData.lastName}
              onChange={(e) => setNewProfileData({ ...newProfileData, lastName: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Major"
              type="text"
              fullWidth
              variant="standard"
              value={newProfileData.major}
              onChange={(e) => setNewProfileData({ ...newProfileData, major: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Class Year"
              type="text"
              fullWidth
              variant="standard"
              value={newProfileData.classYear}
              onChange={(e) => setNewProfileData({ ...newProfileData, classYear: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save</Button>
          </DialogActions>
        </Dialog>
        
        <Card sx={{ padding: 4, backgroundColor: '#fff', color: '#571CE0', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
          <Typography variant="h5" gutterBottom>My Reviews</Typography>
          <Divider />
          <List>
            {profileData.reviews?.map((review, idx) => (
              <ListItem key={idx} sx={{ backgroundColor: '#E4E2DD', margin: '10px 0', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
                <ListItemText
                  primary={
                    <>
                      <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold' }}>
                        {review.term} with {review.professor} for {review.courseId}:
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
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          Log Out
        </Button>
      </Container>
    </Box>
  );
};

export default ProfilePage;
