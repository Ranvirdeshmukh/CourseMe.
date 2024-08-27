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
          variant="body1" // Changed from 'caption' to 'body1' for a slightly larger font
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            color: '#8E8E93',
            textAlign: 'left',
            marginTop: 2,
            display: 'block',
            lineHeight: 1.2, // Ensures good readability with proper spacing between lines
          }}
        >
          Make your term more organized by adding your Fall 2024 classes to CourseMe
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
      <TableContainer component={Paper} sx={{ backgroundColor: '#fff', boxShadow: 3, borderRadius: '12px', maxWidth: '100%' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#571CE0' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Subject</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Number</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Section</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Period</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Timing</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Room</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Building</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Instructor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedCourses.map((course, index) => (
              <TableRow key={index}>
                <TableCell>{course.subj}</TableCell>
                <TableCell>{course.num}</TableCell>
                <TableCell>{course.sec}</TableCell>
                <TableCell>{course.title}</TableCell>
                <TableCell>{course.period}</TableCell>
                <TableCell>{course.timing}</TableCell>
                <TableCell>{course.room}</TableCell>
                <TableCell>{course.building}</TableCell>
                <TableCell>{course.instructor}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#E4E2DD',
        padding: '40px',
        position: 'relative',
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
                backgroundColor: '#f9f9f9',
                color: '#1D1D1F',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                maxWidth: 1100,
                width: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#571CE0', width: 56, height: 56, marginRight: 2 }}>
                    {currentUser.email.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        fontWeight: 600,
                        color: '#1D1D1F',
                      }}
                    >
                      {currentUser.email}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: 'SF Pro Display, sans-serif',
                        color: '#8E8E93',
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
                          backgroundColor: '#f0f0f0',
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
                          backgroundColor: '#f0f0f0',
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
                  }}
                >
                  First Name: {profileData.firstName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: '#8E8E93',
                    marginBottom: 0.5,
                  }}
                >
                  Last Name: {profileData.lastName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: '#8E8E93',
                    marginBottom: 0.5,
                  }}
                >
                  Major: {profileData.major}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    color: '#8E8E93',
                    marginBottom: 0.5,
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
                    backgroundColor: '#571CEO',
                    '&:hover': {
                      backgroundColor: '#005bb5',
                    },
                    textTransform: 'none',
                    paddingX: 3,
                    paddingY: 1,
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
                      backgroundColor: '#f9f9f9',
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
                        Fall 2024 Course Enrollment Priority.
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
                            backgroundColor: '#571CEO',
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
                      backgroundColor: '#f9f9f9',
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
                        My Saved Courses.
                      </Typography>
                      <Divider sx={{ marginY: 2, backgroundColor: '#DDD' }} />
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
                                borderRadius: '8px',
                                boxShadow: 3,
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: '#f0f0f0' },
                              }}
                              onClick={() => handleNavigateToCourseReview(courseId)}
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
                                      {getShortCourseId(courseId)}
                                    </Typography>
                                  </>
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
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={4}>
  <Grid item xs={12}>
    <Box sx={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
      <Card
        sx={{
          padding: 4,
          backgroundColor: '#f9f9f9',
          color: '#1D1D1F',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: 1100,
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
            marginBottom: 1, // Adjusted margin
          }}
        >
          Fall 2024 Timetable
        </Typography>
        <Divider sx={{ marginBottom: 2, backgroundColor: '#DDD' }} /> {/* Adjusted margin */}
        {renderTimetable()}
      </Card>
    </Box>
  </Grid>
</Grid>


            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', borderRadius: 2, border: '1px solid #ddd' }}>
                  <Card
                    sx={{
                      padding: 4,
                      backgroundColor: '#f9f9f9',
                      color: '#1D1D1F',
                      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
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
                    <Divider sx={{ marginY: 2, backgroundColor: '#DDD' }} />
                    <List>
                      {profileData.reviews?.map((review, idx) => (
                        <ListItem key={idx} sx={{ backgroundColor: '#fafafa', margin: '10px 0', borderRadius: '8px', boxShadow: 3 }}>
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
                            sx={{ color: '#571CE0' }}
                          >
                            <Delete />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', borderRadius: 2, border: '1px solid #ddd' }}>
                  <Card
                    sx={{
                      padding: 4,
                      backgroundColor: '#f9f9f9',
                      color: '#1D1D1F',
                      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
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
                    <Divider sx={{ marginY: 2, backgroundColor: '#DDD' }} />
                    <List>
                      {profileData.replies?.map((reply, idx) => (
                        <ListItem key={idx} sx={{ backgroundColor: '#fafafa', margin: '10px 0', borderRadius: '8px', boxShadow: 3 }}>
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
                            sx={{ color: '#571CE0' }}
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
