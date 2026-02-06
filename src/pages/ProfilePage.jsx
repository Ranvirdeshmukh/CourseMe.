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

const ProfilePage = ({darkMode}) => {
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
  const [notifications, setNotifications] = useState([]);
  
  // Define dark/light mode color variables similar to your AllClassesPage
  const mainBgColor = darkMode 
    ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
    : '#F9F9F9';
  const cardBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
  const primaryTextColor = darkMode ? '#FFFFFF' : '#1D1D1F';
  const secondaryTextColor = darkMode ? '#CCCCCC' : '#8E8E93';
  const dividerColor = darkMode ? '#444444' : '#DDD';
  const hoverBgColor = darkMode ? '#2a2a2a' : '#f7f7f7';
  const accentColor = '#571CE0'; // stays the same for branding

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

          // Fetch the user's winter courses from the user document
          const winterCourses = userData.winterCoursestaken || [];
          setSelectedCourses(winterCourses);
      
          // Optionally, if you still need notifications from the main user document:
          setNotifications(userData.notifications || []);
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

  const handleRemoveNotification = async (notification) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const timetableRequestRef = doc(db, 'timetable-requests', notification.requestId);
  
      // Remove notification from user's notifications array
      await updateDoc(userRef, {
        notifications: arrayRemove(notification)
      });
  
      // Remove user from the timetable-requests document
      const timetableRequestDoc = await getDoc(timetableRequestRef);
      if (timetableRequestDoc.exists()) {
        const users = timetableRequestDoc.data().users || [];
        const updatedUsers = users.filter(user => user.email !== currentUser.email);
        
        if (updatedUsers.length === 0) {
          // If no users left, delete the document
          await deleteDoc(timetableRequestRef);
        } else {
          // Update the users array
          await updateDoc(timetableRequestRef, {
            users: updatedUsers
          });
        }
      }
  
      // Update local state
      setNotifications(prev => prev.filter(n => n.requestId !== notification.requestId));
    } catch (error) {
      console.error('Error removing notification:', error);
      alert('Failed to remove notification. Please try again.');
    }
  };
  

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
          Make your term more organized by adding your Winter 2026 classes to CourseMe
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
            backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
            borderRadius: '16px',
            width: '100%',
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: darkMode ? '#333333' : '#571CE0', color: '#FFFFFF' }}>
              <TableRow>
                {/* Adjust padding for smaller screens */}
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Subject
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Number
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Section
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Title
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Period
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Timing
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Room
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Building
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold', padding: { xs: '8px', sm: '16px' } }}>
                  Instructor
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedCourses.map((course, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:hover': { backgroundColor: darkMode ? '#2a2a2a' : '#f7f7f7' },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {course.subj}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {course.num}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {course.sec}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {course.title}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {course.period}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {course.timing}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {course.room}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {course.building}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: { xs: '8px', sm: '16px' },
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
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
        background: darkMode ? mainBgColor : '#F9F9F9',
        padding: { xs: '20px', sm: '40px' },
        fontFamily: 'SF Pro Display, sans-serif',
        letterSpacing: '0.5px',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: '1100px !important',
          width: '100%',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '50vh',
            }}
          >
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
                backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
                color: darkMode ? '#FFFFFF' : '#1D1D1F',
                boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
                borderRadius: '16px',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 2,
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: { xs: 2, sm: 0 },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: '#571CE0',
                      width: 64,
                      height: 64,
                      marginRight: 2,
                    }}
                  >
                    {currentUser.email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        fontWeight: 600,
                        color: darkMode ? '#FFFFFF' : '#1D1D1F',
                        marginBottom: '8px',
                        fontSize: { xs: '1.5rem', sm: '2rem' },
                      }}
                    >
                      {currentUser.email}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: darkMode ? '#CCCCCC' : '#8E8E93',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
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
                        color: darkMode ? '#FFFFFF' : '#1D1D1F',
                        fontFamily: 'SF Pro Display, sans-serif',
                        '&:hover': {
                          backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
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
                        color: darkMode ? '#FFFFFF' : '#1D1D1F',
                        fontFamily: 'SF Pro Display, sans-serif',
                        '&:hover': {
                          backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                        },
                      }}
                    >
                      <Logout sx={{ marginRight: 1 }} /> Log Out
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>
              <Divider sx={{ marginY: 2, backgroundColor: darkMode ? '#444444' : '#DDD' }} />
              <Box sx={{ textAlign: 'left', marginTop: 2 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                  }}
                >
                  Profile Information
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#CCCCCC' : '#8E8E93',
                    marginBottom: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  First Name: {profileData.firstName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#CCCCCC' : '#8E8E93',
                    marginBottom: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  Last Name: {profileData.lastName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#CCCCCC' : '#8E8E93',
                    marginBottom: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  Major: {profileData.major}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: darkMode ? '#CCCCCC' : '#8E8E93',
                    marginBottom: 0.5,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
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
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Card>
    
  
            <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            padding: 4,
            backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
            color: darkMode ? '#FFFFFF' : '#333',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            width: '100%',
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
                color: darkMode ? '#FFFFFF' : '#1D1D1F',
                textAlign: 'left',
                marginBottom: 2,
              }}
            >
              Winter 2026 Course Enrollment Priority.
            </Typography>
            <Divider sx={{ marginY: 2, backgroundColor: darkMode ? '#444444' : '#DDD' }} />
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
              color: darkMode ? '#CCCCCC' : '#8E8E93',
              textAlign: 'left',
              marginTop: 2,
              display: 'block',
            }}
          >
            * Enrollment priorities change every term and will be updated accordingly.
          </Typography>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card
          sx={{
            padding: 4,
            backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
            color: darkMode ? '#FFFFFF' : '#1D1D1F',
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
            borderRadius: '16px',
            width: '100%',
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
              color: darkMode ? '#FFFFFF' : '#1D1D1F',
              marginBottom: 0.9,
            }}
          >
            Course Drop Notifications
          </Typography>
          <Divider sx={{ marginBottom: 2, backgroundColor: darkMode ? '#444444' : '#EEE' }} />
          {notifications.length === 0 ? (
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'SF Pro Display, sans-serif',
                color: darkMode ? '#CCCCCC' : '#8E8E93',
                textAlign: 'left',
                marginTop: 2,
              }}
            >
              You haven't signed up for any course drop notifications yet.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: darkMode ? '#333333' : '#571CE0' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Course</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Section</TableCell>
                    {/* <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Added On</TableCell> */}
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.map((notification, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        '&:hover': { backgroundColor: darkMode ? '#2a2a2a' : '#f7f7f7' },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell sx={{ fontFamily: 'SF Pro Display, sans-serif', color: darkMode ? '#FFFFFF' : undefined }}>
                        {notification.department}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'SF Pro Display, sans-serif', color: darkMode ? '#FFFFFF' : undefined }}>
                        {notification.number}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'SF Pro Display, sans-serif', color: darkMode ? '#FFFFFF' : undefined }}>
                        {notification.section}
                      </TableCell>
                      {/* <TableCell sx={{ fontFamily: 'SF Pro Display, sans-serif' }}>
                        {notification.timestamp ? new Date(notification.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                      </TableCell> */}
                      <TableCell>
                        <IconButton
                          onClick={() => handleRemoveNotification(notification)}
                          sx={{
                            color: '#F26655',
                            '&:hover': {
                              backgroundColor: 'rgba(242, 102, 85, 0.1)',
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
      <Card
        sx={{
          padding: 4,
          backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
          color: darkMode ? '#FFFFFF' : '#1D1D1F',
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
          borderRadius: '16px',
          width: '100%',
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
              color: darkMode ? '#FFFFFF' : '#1D1D1F',
              textAlign: 'left',
              marginBottom: 2,
            }}
          >
            My Saved Courses.
          </Typography>
          <Divider sx={{ marginY: 2, backgroundColor: darkMode ? '#444444' : '#EEE' }} />
          <List>
            {profileData.pinnedCourses.length === 0 ? (
              <Typography
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  color: darkMode ? '#CCCCCC' : '#8E8E93',
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
                    backgroundColor: darkMode ? '#2a2a2a' : '#fafafa',
                    margin: '10px 0',
                    borderRadius: '12px',
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: darkMode ? '#333333' : '#f0f0f0' },
                    transition: 'background-color 0.2s ease',
                  }}
                  onClick={() => handleNavigateToCourseReview(courseId)}
                >
                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: 'SF Pro Display, sans-serif',
                          color: darkMode ? '#ffffff' : '#000000',                      fontWeight: 600,
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
                    sx={{ color: '#571CE0' }}
                  >
                    <PushPin />
                  </IconButton>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Card>
    </Grid>

      
            <Grid item xs={12}>
              <Card
                sx={{
                  padding: 4,
                  backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
      color: darkMode ? '#FFFFFF' : '#1D1D1F',
      boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
      borderRadius: '16px',
                  width: '100%',
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
                    color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    marginBottom: 0.9,
                  }}
                >
                  Spring 2026 Timetable
                </Typography>
                <Divider sx={{ marginBottom: 2, backgroundColor: darkMode ? '#444444' : '#EEE' }} />
                {renderTimetable()}
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
    <Card
      sx={{
        padding: 4,
        backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
        color: darkMode ? '#FFFFFF' : '#1D1D1F',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        borderRadius: '16px',
        width: '100%',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: 'SF Pro Display, sans-serif',
          fontWeight: 600,
          color: darkMode ? '#FFFFFF' : '#1D1D1F',
          marginBottom: 2,
        }}
      >
        My Reviews
      </Typography>
      <Divider sx={{ marginY: 2, backgroundColor: darkMode ? '#444444' : '#EEE' }} />
      <List>
        {profileData.reviews?.map((review, idx) => (
          <ListItem
            key={idx}
            sx={{
              backgroundColor: darkMode ? '#2a2a2a' : '#fafafa',
              margin: '10px 0',
              borderRadius: '12px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              '&:hover': { backgroundColor: darkMode ? '#333333' : '#f0f0f0' },
              transition: 'background-color 0.2s ease',
            }}
          >
            <ListItemText
              primary={
                <>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: '#571CE0',
                      fontWeight: 600,
                    }}
                  >
                    {review.term} with {review.professor} for {getShortCourseId(review.courseId)}:
                  </Typography>{' '}
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
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
              sx={{ color: '#571CE0' }}
            >
              <Delete />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Card>
  </Grid>


  <Grid item xs={12} md={6}>
    <Card
      sx={{
        padding: 4,
        backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
        color: darkMode ? '#FFFFFF' : '#1D1D1F',
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.05)',
        borderRadius: '16px',
        width: '100%',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: 'SF Pro Display, sans-serif',
          fontWeight: 600,
          color: darkMode ? '#FFFFFF' : '#1D1D1F',
          marginBottom: 2,
        }}
      >
        My Replies
      </Typography>
      <Divider sx={{ marginY: 2, backgroundColor: darkMode ? '#444444' : '#EEE' }} />
      <List>
        {profileData.replies?.map((reply, idx) => (
          <ListItem
            key={idx}
            sx={{
              backgroundColor: darkMode ? '#2a2a2a' : '#fafafa',
              margin: '10px 0',
              borderRadius: '12px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              '&:hover': { backgroundColor: darkMode ? '#333333' : '#f0f0f0' },
              transition: 'background-color 0.2s ease',
            }}
          >
            <ListItemText
              primary={
                <>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: '#571CE0',
                      fontWeight: 600,
                    }}
                  >
                    Reply to {reply.reviewData.instructor} for {getShortCourseId(reply.courseId)}:
                  </Typography>{' '}
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#FFFFFF' : '#1D1D1F',
                    }}
                  >
                    {reply.reply}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'SF Pro Display, sans-serif',
                      color: darkMode ? '#CCCCCC' : 'grey',
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
              sx={{ color: '#571CE0' }}
            >
              <Delete />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Card>
  </Grid>
  </Grid>
        </>
      )}
    </Container>
  

    <Dialog
  open={editing}
  onClose={handleClose}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
      color: darkMode ? '#FFFFFF' : '#1D1D1F',
    },
  }}
>
  <DialogTitle>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography
        variant="h6"
        sx={{ textAlign: 'left', color: darkMode ? '#FFFFFF' : '#1D1D1F' }}
      >
        Edit Profile
      </Typography>
      <Typography
        variant="body"
        sx={{
          fontFamily: 'SF Pro Display, sans-serif',
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
      onChange={(e) =>
        setNewProfileData({ ...newProfileData, firstName: e.target.value })
      }
      sx={{ marginBottom: 2 }}
    />
    <TextField
      margin="dense"
      label="Last Name"
      type="text"
      fullWidth
      variant="standard"
      value={newProfileData.lastName}
      onChange={(e) =>
        setNewProfileData({ ...newProfileData, lastName: e.target.value })
      }
      sx={{ marginBottom: 2 }}
    />
    <TextField
      margin="dense"
      label="Major"
      type="text"
      fullWidth
      variant="standard"
      value={newProfileData.major}
      onChange={(e) =>
        setNewProfileData({ ...newProfileData, major: e.target.value })
      }
      sx={{ marginBottom: 2 }}
    />
    <TextField
      margin="dense"
      label="Class Year"
      type="text"
      fullWidth
      variant="standard"
      value={newProfileData.classYear}
      onChange={(e) =>
        setNewProfileData({ ...newProfileData, classYear: e.target.value })
      }
      sx={{ marginBottom: 2 }}
    />
    <Typography
      variant="body2"
      sx={{ marginBottom: 2, color: darkMode ? '#CCCCCC' : '#8E8E93' }}
    >
      Please ensure all your details are correct.
    </Typography>
    <Typography
      variant="body2"
      sx={{ marginBottom: 2, color: darkMode ? '#CCCCCC' : '#8E8E93' }}
    >
      *Rest assured, your personal information is securely stored and will only be used to enhance your experience.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose} color="secondary">
      Cancel
    </Button>
    <Button onClick={handleSaveProfile} variant="contained" color="primary">
      Save
    </Button>
  </DialogActions>
</Dialog>

<Dialog
  open={bugReportOpen}
  onClose={handleReportBugClose}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
      color: darkMode ? '#FFFFFF' : '#1D1D1F',
    },
  }}
>
  <DialogTitle>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography
        variant="h6"
        sx={{ textAlign: 'left', color: darkMode ? '#FFFFFF' : '#1D1D1F' }}
      >
        Report a Bug
      </Typography>
      <Typography
        variant="body"
        sx={{
          fontFamily: 'SF Pro Display, sans-serif',
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
    <Typography
      variant="body2"
      sx={{ marginBottom: 2, color: darkMode ? '#CCCCCC' : '#8E8E93' }}
    >
      Enhance your experience by reporting a bug. We will fix it ASAP.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleReportBugClose} color="secondary">
      Cancel
    </Button>
    <Button onClick={handleReportBugSubmit} variant="contained" color="primary">
      Submit
    </Button>
  </DialogActions>
</Dialog>

<Footer />
    </Box>
  );
};

export default ProfilePage;