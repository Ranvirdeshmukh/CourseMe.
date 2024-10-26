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
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Delete, ArrowDropDown, BugReport, Logout, PushPin } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayRemove, deleteDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Footer from '../components/Footer';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    major: '',
    classYear: '',
    reviews: [],
    replies: [],
    firstName: '',
    lastName: '',
    pinnedCourses: [],
  });
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newProfileData, setNewProfileData] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugPage, setBugPage] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugReportError, setBugReportError] = useState(null);

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
            lastName: userData.lastName || '',
            pinnedCourses: userData.pinnedCourses || [],
          });

          // Fetch user's Fall 2024 timetable
          setSelectedCourses(userData.fallCoursestaken || []);
        } else {
          setError('Failed to fetch profile data.');
        }
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfileData();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleNavigateToCourseReview = (courseId) => {
    const department = courseId.split('_')[0];
    navigate(`/departments/${department}/courses/${courseId}`);
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
        const updatedReviews = courseData[review.professor]?.filter(
          (r) => r !== `review: "${review.term} with ${review.professor}: ${review.review}"`
        );
        if (updatedReviews.length === 0) {
          delete courseData[review.professor];
        } else {
          courseData[review.professor] = updatedReviews;
        }
        await updateDoc(courseDocRef, courseData);
      }

      setProfileData((prevState) => ({
        ...prevState,
        reviews: prevState.reviews.filter((r) => r !== review),
      }));
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleDeleteReply = async (reply) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const { courseId, reviewData, timestamp } = reply;
      const sanitizedCourseId = courseId.split('_')[1];
      const sanitizedInstructor = reviewData.instructor.replace(/\./g, '_');
      const replyDocRef = doc(
        db,
        'reviews',
        sanitizedCourseId,
        `${sanitizedInstructor}_${reviewData.reviewIndex}_replies`,
        timestamp
      );

      await updateDoc(userDocRef, {
        replies: arrayRemove(reply),
      });

      await deleteDoc(replyDocRef);

      setProfileData((prevState) => ({
        ...prevState,
        replies: prevState.replies.filter((r) => r !== reply),
      }));
    } catch (error) {
      console.error('Failed to delete reply:', error);
    }
  };

  const handleEditProfile = () => {
    setEditing(true);
    setNewProfileData({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      major: profileData.major,
      classYear: profileData.classYear,
    });
  };

  const handleSaveProfile = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, newProfileData);

      setProfileData((prevState) => ({
        ...prevState,
        ...newProfileData,
      }));
      setEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleClose = () => {
    setEditing(false);
  };

  const handleReportBugOpen = () => {
    setBugReportOpen(true);
  };

  const handleReportBugClose = () => {
    setBugReportOpen(false);
    setBugPage('');
    setBugDescription('');
    setBugReportError(null);
  };

  const handleReportBugSubmit = async () => {
    if (!bugPage || !bugDescription) {
      setBugReportError('Please fill in all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'report_a_bug'), {
        userId: currentUser.uid,
        email: currentUser.email,
        page: bugPage,
        description: bugDescription,
        timestamp: new Date().toISOString(),
      });
      handleReportBugClose();
    } catch (error) {
      console.error('Failed to report bug:', error);
      setBugReportError('Failed to report bug. Please try again.');
    }
  };

  const handleNavigateToEnrollmentPriorities = () => {
    navigate('/course-enrollment-priorities');
  };

  const handleUnpinCourse = async (courseId) => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);

    try {
      await updateDoc(userDocRef, {
        pinnedCourses: arrayRemove(courseId),
      });

      setProfileData((prevState) => ({
        ...prevState,
        pinnedCourses: prevState.pinnedCourses.filter((id) => id !== courseId),
      }));
    } catch (error) {
      console.error('Failed to unpin course:', error);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  const getShortCourseId = (courseId) => {
    const match = courseId.match(/([A-Z]+)\d{3}/);
    return match ? match[0] : courseId;
  };

  const renderTimetable = () => {
    if (selectedCourses.length === 0) {
      return (
        <Typography
          variant="body1"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            color: '#8E8E93',
            textAlign: 'left',
            marginTop: 2,
            display: 'block',
            lineHeight: 1.5, 
            fontSize: { xs: '14px', sm: '16px' }, // Responsive font size
            
          }}
        >
          Make your term more organized by adding your Winter 2025 classes to CourseMe
          <span style={{ color: '#F26655' }}>.</span> and your personal Google Calendar.{' '}
          <span 
            style={{ 
              color: '#571CE0', 
              textDecoration: 'underline', 
              cursor: 'pointer' 
            }}
            onClick={() => navigate('/timetable')}
          >
            Go to Timetable
          </span>
        </Typography>
      );
    }
  
    return (
      <Box sx={{ margin: '0 auto', maxWidth: { xs: '100%', sm: 1100 }, width: '100%' }}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            backgroundColor: '#FFFFFF', 
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', 
            borderRadius: '16px', 
            width: '100%',
             
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: '#571CE0', color: '#FFFFFF' }}>
              <TableRow>
                {/* Adjust padding for smaller screens */}
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Subject</TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Number</TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Section</TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Title</TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Period</TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Timing</TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Room</TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Building</TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>Instructor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedCourses.map((course, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:hover': { backgroundColor: '#f7f7f7' }, 
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.subj}
                  </TableCell>
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.num}
                  </TableCell>
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.sec}
                  </TableCell>
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.title}
                  </TableCell>
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.period}
                  </TableCell>
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.timing}
                  </TableCell>
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.room}
                  </TableCell>
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.building}
                  </TableCell>
                  <TableCell sx={{ padding: { xs: '8px', sm: '16px' }, fontFamily: 'SF Pro Display, sans-serif', color: '#1D1D1F' }}>
                    {course.instructor}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };
  

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: { xs: '20px', sm: '40px' }, // Dynamic padding for mobile and larger screens
        fontFamily: 'SF Pro Display, sans-serif',
        letterSpacing: '0.5px',
      }}
    >
      <Container maxWidth="lg">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Card
              sx={{
                marginBottom: 4,
                padding: 4,
                backgroundColor: '#FFFFFF', // Clean white background
                color: '#1D1D1F',
                boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', // Softer shadow for depth
                borderRadius: '16px', // Rounder corners for a more modern look
                maxWidth: { xs: '100%', sm: 1100 }, // Responsive width
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 2,
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' }, // Stack on mobile, row on larger screens
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: { xs: 2, sm: 0 } }}>
                  <Avatar
                    sx={{ bgcolor: '#571CE0', width: 64, height: 64, marginRight: 2 }}
                  >
                    {currentUser.email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        fontWeight: 600,
                        color: '#1D1D1F',
                        marginBottom: '8px',
                        fontSize: { xs: '1.5rem', sm: '2rem' }, // Adjust font size for mobile and desktop
                      }}
                    >
                      {currentUser.email}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: '#8E8E93',
                        fontSize: { xs: '1rem', sm: '1.25rem' }, // Adjust font size for mobile
                      }}
                    >
                      Welcome to your profile.
                    </Typography>
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
                    <MenuItem
                      onClick={handleReportBugOpen}
                      sx={{
                        borderRadius: '4px',
                        padding: '10px',
                        color: '#1D1D1F',
                        fontFamily: 'SF Pro Display, sans-serif',
                        '&:hover': {
                          backgroundColor: '#f5f5f5', // Subtle hover effect
                        },
                      }}
                    >
                      <BugReport sx={{ marginRight: 1 }} /> Report a Bug
                    </MenuItem>
                    <MenuItem
                      onClick={handleLogout}
                      sx={{
                        borderRadius: '4px',
                        padding: '10px',
                        color: '#1D1D1F',
                        fontFamily: 'SF Pro Display, sans-serif',
                        '&:hover': {
                          backgroundColor: '#f5f5f5', // Subtle hover effect
                        },
                      }}
                    >
                      <Logout sx={{ marginRight: 1 }} /> Log Out
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>
              <Divider sx={{ marginY: 2, backgroundColor: '#DDD' }} />
              <Box sx={{ textAlign: 'left', marginTop: 2 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: '#1D1D1F',
                  }}
                >
                  Profile Information
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: '#8E8E93',
                    marginBottom: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' }, // Responsive font size for mobile
                  }}
                >
                  First Name: {profileData.firstName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: '#8E8E93',
                    marginBottom: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' }, // Responsive font size for mobile
                  }}
                >
                  Last Name: {profileData.lastName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: '#8E8E93',
                    marginBottom: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' }, // Responsive font size for mobile
                  }}
                >
                  Major: {profileData.major}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: '#8E8E93',
                    marginBottom: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' }, // Responsive font size for mobile
                  }}
                >
                  Class Year: {profileData.classYear}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleEditProfile}
                  sx={{
                    mt: 2,
                    fontFamily: 'SF Pro Display, sans-serif',
                    fontWeight: 500,
                    borderRadius: '8px',
                    boxShadow: 'none',
                    backgroundColor: '#571CE0',
                    '&:hover': {
                      backgroundColor: '#005bb5',
                    },
                    textTransform: 'none',
                    paddingX: 3,
                    paddingY: 1,
                    fontSize: { xs: '0.875rem', sm: '1rem' }, // Button font size for mobile
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Card>
  
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ marginBottom: 4, display: 'flex', justifyContent: 'flex-start' }}>
                  <Card
                    sx={{
                      padding: 4,
                      backgroundColor: '#FFFFFF',
                      color: '#333',
                      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      width: '100%',
                      maxWidth: 500,
                      minHeight: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                          fontFamily: 'SF Pro Display, sans-serif',
                          fontWeight: 600,
                          color: '#1D1D1F',
                          textAlign: 'left',
                          marginBottom: 2,
                        }}
                      >
                       Winter 2025 Course Enrollment Priority.
                      </Typography>
                      <Divider sx={{ marginY: 2, backgroundColor: '#DDD' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginTop: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleNavigateToEnrollmentPriorities}
                          sx={{
                            fontFamily: 'SF Pro Display, sans-serif',
                            fontWeight: 500,
                            borderRadius: '8px',
                            boxShadow: 'none',
                            backgroundColor: '#571CE0',
                            '&:hover': {
                              backgroundColor: '#005bb5',
                            },
                            textTransform: 'none',
                            paddingX: 3,
                            paddingY: 1,
                          }}
                        >
                          Browse It
                        </Button>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: '#8E8E93',
                        textAlign: 'left',
                        marginTop: 2,
                        display: 'block',
                      }}
                    >
                      * Enrollment priorities change every term and will be updated accordingly.
                    </Typography>
                  </Card>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
  <Box sx={{ marginBottom: 4, display: 'flex', justifyContent: 'flex-start' }}>
    <Card
      sx={{
        padding: 4,
        backgroundColor: '#FFFFFF', // Clean white background
        color: '#1D1D1F',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', // Softer shadow for Apple-like depth
        borderRadius: '16px', // Slightly more rounded for Apple aesthetics
        width: '100%',
        maxWidth: 500,
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            color: '#1D1D1F',
            textAlign: 'left',
            marginBottom: 2,
          }}
        >
          My Saved Courses.
        </Typography>
        <Divider sx={{ marginY: 2, backgroundColor: '#EEE' }} /> {/* Softer divider */}
        <List>
          {profileData.pinnedCourses.length === 0 ? (
            <Typography
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                color: '#8E8E93',
                textAlign: 'left',
              }}
            >
              No courses pinned yet.
            </Typography>
          ) : (
            profileData.pinnedCourses.map((courseId, idx) => (
              <ListItem
                key={idx}
                sx={{
                  backgroundColor: '#fafafa',
                  margin: '10px 0',
                  borderRadius: '12px', // Rounded for modern look
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)', // Softer shadow
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f0f0f0' }, // Subtle hover effect
                  transition: 'background-color 0.2s ease', // Smooth transition for hover
                }}
                onClick={() => handleNavigateToCourseReview(courseId)}
              >
                <ListItemText
                  primary={
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: '#571CE0', // Accent color
                        fontWeight: 600,
                      }}
                    >
                      {getShortCourseId(courseId)}
                    </Typography>
                  }
                />
                <IconButton
                  edge="end"
                  aria-label="unpin"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnpinCourse(courseId);
                  }}
                  sx={{ color: '#571CE0' }} // Keep consistent color for icons
                >
                  <PushPin />
                </IconButton>
              </ListItem>
            ))
          )}
        </List>
      </Box>
    </Card>
  </Box>
</Grid>

<Grid container spacing={4}>
  <Grid item xs={12}>
    <Box sx={{ marginBottom: 4, display: 'flex', justifyContent: 'center', ml: { xs: '0px', sm: '16px' } }}> 
      {/* Adjust margin-left here, 'sm' breakpoint shifts it right on larger screens */}
      <Card
        sx={{
          padding: 4,
          backgroundColor: '#FFFFFF', // Clean white for a modern feel
          color: '#1D1D1F',
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', // Softer shadow for a premium feel
          borderRadius: '16px',
          width: '100%',
          maxWidth: 1090,
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            color: '#1D1D1F',
            marginBottom: 0.9, // Adjusted margin for clean separation
          }}
        >
          Winter 2025 Timetable
        </Typography>
        <Divider sx={{ marginBottom: 2, backgroundColor: '#EEE' }} /> {/* Softer divider */}
        {renderTimetable()}
      </Card>
    </Box>
  </Grid>
</Grid>
</Grid>


<Grid container spacing={4}>
  {/* Reviews Section */}
  <Grid item xs={12} md={6}>
    <Box sx={{ padding: 3, backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
      <Card
        sx={{
          padding: 4,
          backgroundColor: '#FFFFFF', // Clean white background
          color: '#1D1D1F',
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', // Softer shadow for Apple-like depth
          borderRadius: '16px', // Rounded corners for Apple-like smoothness
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            color: '#1D1D1F',
            marginBottom: 2,
          }}
        >
          My Reviews
        </Typography>
        <Divider sx={{ marginY: 2, backgroundColor: '#EEE' }} /> {/* Softer divider */}
        <List>
          {profileData.reviews?.map((review, idx) => (
            <ListItem
              key={idx}
              sx={{
                backgroundColor: '#fafafa',
                margin: '10px 0',
                borderRadius: '12px', // Rounded for modern look
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)', // Softer shadow
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f0f0f0' }, // Subtle hover effect
                transition: 'background-color 0.2s ease', // Smooth transition for hover
              }}
            >
              <ListItemText
                primary={
                  <>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: '#571CE0', // Accent color for course term
                        fontWeight: 600,
                      }}
                    >
                      {review.term} with {review.professor} for {getShortCourseId(review.courseId)}:
                    </Typography>{' '}
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: '#1D1D1F',
                      }}
                    >
                      {review.review}
                    </Typography>
                  </>
                }
              />
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteReview(review)}
                sx={{ color: '#571CE0' }} // Consistent color for icons
              >
                <Delete />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Card>
    </Box>
  </Grid>

  {/* Replies Section */}
  <Grid item xs={12} md={6}>
    <Box sx={{ padding: 3, backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
      <Card
        sx={{
          padding: 4,
          backgroundColor: '#FFFFFF', // Clean white background
          color: '#1D1D1F',
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)', // Softer shadow for Apple-like depth
          borderRadius: '16px', // Rounded corners for Apple-like smoothness
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            color: '#1D1D1F',
            marginBottom: 2,
          }}
        >
          My Replies
        </Typography>
        <Divider sx={{ marginY: 2, backgroundColor: '#EEE' }} /> {/* Softer divider */}
        <List>
          {profileData.replies?.map((reply, idx) => (
            <ListItem
              key={idx}
              sx={{
                backgroundColor: '#fafafa',
                margin: '10px 0',
                borderRadius: '12px', // Rounded for modern look
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)', // Softer shadow
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f0f0f0' }, // Subtle hover effect
                transition: 'background-color 0.2s ease', // Smooth transition for hover
              }}
            >
              <ListItemText
                primary={
                  <>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: '#571CE0', // Accent color for instructor name
                        fontWeight: 600,
                      }}
                    >
                      Reply to {reply.reviewData.instructor} for {getShortCourseId(reply.courseId)}:
                    </Typography>{' '}
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: '#1D1D1F',
                      }}
                    >
                      {reply.reply}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: 'grey',
                        fontSize: '0.8rem',
                        display: 'block',
                      }}
                    >
                      {new Date(reply.timestamp).toLocaleString()}
                    </Typography>
                  </>
                }
              />
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteReply(reply)}
                sx={{ color: '#571CE0' }} // Consistent color for icons
              >
                <Delete />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Card>
    </Box>
  </Grid>
</Grid>

          </>
        )}
      </Container>

      <Dialog open={editing} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ textAlign: 'left' }}>Edit Profile</Typography>
            <Typography
              variant="body"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                fontWeight: '',
                textDecoration: 'none',
                color: '#571CE0',
                textAlign: 'right',
              }}
            >
              CourseMe<span style={{ color: '#F26655' }}>.</span>
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="First Name"
            type="text"
            fullWidth
            variant="standard"
            value={newProfileData.firstName}
            onChange={(e) => setNewProfileData({ ...newProfileData, firstName: e.target.value })}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            margin="dense"
            label="Last Name"
            type="text"
            fullWidth
            variant="standard"
            value={newProfileData.lastName}
            onChange={(e) => setNewProfileData({ ...newProfileData, lastName: e.target.value })}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            margin="dense"
            label="Major"
            type="text"
            fullWidth
            variant="standard"
            value={newProfileData.major}
            onChange={(e) => setNewProfileData({ ...newProfileData, major: e.target.value })}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            margin="dense"
            label="Class Year"
            type="text"
            fullWidth
            variant="standard"
            value={newProfileData.classYear}
            onChange={(e) => setNewProfileData({ ...newProfileData, classYear: e.target.value })}
            sx={{ marginBottom: 2 }}
          />
          <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 2 }}>
            Please ensure all your details are correct.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 2 }}>
            *Rest assured, your personal information is securely stored and will only be used to enhance your experience.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bugReportOpen} onClose={handleReportBugClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ textAlign: 'left' }}>Report a Bug</Typography>
            <Typography
              variant="body"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                fontWeight: '',
                textDecoration: 'none',
                color: '#571CE0',
                textAlign: 'right',
              }}
            >
              CourseMe<span style={{ color: '#F26655' }}>.</span>
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {bugReportError && <Alert severity="error">{bugReportError}</Alert>}
          <TextField
            margin="dense"
            label="Page"
            type="text"
            fullWidth
            variant="standard"
            value={bugPage}
            onChange={(e) => setBugPage(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            variant="standard"
            value={bugDescription}
            onChange={(e) => setBugDescription(e.target.value)}
            multiline
            rows={4}
            sx={{ marginBottom: 2 }}
          />
          <Typography variant="body2" color="textSecondary" sx={{ marginBottom: 2 }}>
            Enhance your experience by reporting a bug. We will fix it ASAP.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReportBugClose} color="secondary">Cancel</Button>
          <Button onClick={handleReportBugSubmit} variant="contained" color="primary">Submit</Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default ProfilePage;
