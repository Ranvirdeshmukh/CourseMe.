import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Card,
  Avatar,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Button
} from '@mui/material';
import { Delete, ArrowDropDown } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayRemove, setDoc } from 'firebase/firestore';
import Footer from '../components/Footer';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({ major: '', classYear: '', reviews: [], replies: [], firstName: '', lastName: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newProfileData, setNewProfileData] = useState({});
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
            replies: userData.replies || [],
            firstName: userData.firstName || '',
            lastName: userData.lastName || ''
          });
        } else {
          setError('Failed to fetch profile data.');
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

      await updateDoc(userDocRef, {
        reviews: arrayRemove(review),
      });

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

  const getShortCourseId = (courseId) => {
    const match = courseId.match(/([A-Z]+)\d{3}/);
    return match ? match[0] : courseId;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#E4E2DD',
        padding: '20px',
        position: 'relative'
      }}
    >
      <Container maxWidth="md">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Card sx={{ marginBottom: 4, padding: 4, backgroundColor: '#fff', color: '#571CE0', boxShadow: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#571CE0', width: 56, height: 56, marginRight: 2 }}>
                    {currentUser.email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h4" gutterBottom>{currentUser.email}</Typography>
                    <Typography variant="h6">Welcome to your profile!</Typography>
                  </Box>
                </Box>
                <Box>
                  <IconButton
                    onClick={handleMenuClick}
                    aria-controls="profile-menu"
                    aria-haspopup="true"
                    sx={{ color: '#571CE0', padding: '10px', fontSize: '2rem' }}
                  >
                    <ArrowDropDown fontSize="large" />
                  </IconButton>
                  <Menu
                    id="profile-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    sx={{ mt: '40px' }}
                  >
                    <MenuItem onClick={handleLogout} sx={{ background: '', borderRadius: 'px', padding: 'px', color: '#571CE0', fontWeight: '' }}>
                      Log Out
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ textAlign: 'left', marginTop: 2 }}>
                <Typography variant="h6" gutterBottom>Profile Information</Typography>
                <Typography>First Name: {profileData.firstName}</Typography>
                <Typography>Last Name: {profileData.lastName}</Typography>
                <Typography>Major: {profileData.major}</Typography>
                <Typography>Class Year: {profileData.classYear}</Typography>
                <Button variant="contained" color="primary" onClick={handleEditProfile} sx={{ mt: 2, boxShadow: 3 }}>
                  Edit Profile
                </Button>
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
            
            <Card sx={{ padding: 4, backgroundColor: '#fff', color: '#571CE0', boxShadow: 3 }}>
              <Typography variant="h5" gutterBottom>My Reviews</Typography>
              <Divider />
              <List>
                {profileData.reviews?.map((review, idx) => (
                  <ListItem key={idx} sx={{ backgroundColor: '#fafafa', margin: '10px 0', borderRadius: '8px', boxShadow: 3 }}>
                    <ListItemText
                      primary={
                        <>
                          <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold' }}>
                            {review.term} with {review.professor} for {getShortCourseId(review.courseId)}:
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

            <Card sx={{ padding: 4, backgroundColor: '#fff', color: '#571CE0', boxShadow: 3, marginTop: 4 }}>
              <Typography variant="h5" gutterBottom>My Replies</Typography>
              <Divider />
              <List>
                {profileData.replies?.map((reply, idx) => (
                  <ListItem key={idx} sx={{ backgroundColor: '#fafafa', margin: '10px 0', borderRadius: '8px', boxShadow: 3 }}>
                    <ListItemText
                      primary={
                        <>
                          <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold' }}>
                            Reply to {reply.reviewData.instructor} for {getShortCourseId(reply.courseId)}:
                          </Typography>{' '}
                          <Typography component="span" sx={{ color: 'black' }}>
                            {reply.reply}
                          </Typography>
                          <Typography component="span" sx={{ color: 'grey', fontSize: '0.8rem', display: 'block' }}>
                            {new Date(reply.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </>
        )}
      </Container>
      <Footer />
    </Box>
  );
};

export default ProfilePage;
