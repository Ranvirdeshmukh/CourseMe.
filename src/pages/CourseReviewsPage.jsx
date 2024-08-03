import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, Alert, Table, TableBody, TextField, TableCell, TableContainer, TableHead, TableRow, Paper, List, ListItem, ListItemText, Button, ButtonGroup, IconButton, Tooltip, MenuItem, Select, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, PushPin } from '@mui/icons-material'; // Add PushPin
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore'; // Add arrayUnion, arrayRemove
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an AuthContext
import { db } from '../firebase';
import AddReviewForm from './AddReviewForm';
import AddReplyForm from './AddReplyForm'; // Import the new component
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const CourseReviewsPage = () => {
  const { department, courseId } = useParams();
  const { currentUser } = useAuth(); // Get the current user
  const [reviews, setReviews] = useState([]);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState(null); // Track the user's current vote
  const [courseDescription, setCourseDescription] = useState('');
  const [pinned, setPinned] = useState(false); // Track if the course is pinned

  const reviewsPerPage = 5;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    console.log('Fetching reviews...');
    const fetchDocument = async (path) => {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    };

    try {
      let data = null;
      const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
      const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;

      if (transformedCourseId) {
        data = await fetchDocument(`reviews/${transformedCourseId}`);
      }

      if (!data) {
        const sanitizedCourseId = courseId.split('_')[1];
        data = await fetchDocument(`reviews/${sanitizedCourseId}`);
      }

      if (data) {
        const reviewsArray = Object.entries(data).flatMap(([instructor, reviewList]) => {
          if (Array.isArray(reviewList)) {
            return reviewList.map((review, index) => ({ instructor, review, reviewIndex: index, courseId }));
          } else {
            return [];
          }
        });

        setReviews(reviewsArray);
      } else {
        setError('No reviews found for this course.');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to fetch reviews.');
    } finally {
      setLoading(false);
      console.log('Finished fetching reviews');
    }
  }, [courseId]);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    console.log('Fetching course...');
    try {
      const docRef = doc(db, 'courses', courseId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const courseData = docSnap.data();
        if (courseData.layup === undefined) {
          courseData.layup = 0; // Initialize layup to 0 if it doesn't exist
        }
        setCourse(courseData);
      } else {
        setError('Course not found.');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to fetch course.');
    } finally {
      setLoading(false);
      console.log('Finished fetching course');
    }
  }, [courseId]);

  const fetchUserVote = useCallback(async () => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const userVote = userData.votes ? userData.votes[courseId] : null;
      setVote(userVote);
      setPinned(userData.pinnedCourses ? userData.pinnedCourses.includes(courseId) : false); // Check if course is pinned
    }
  }, [currentUser, courseId]);

  const fetchCourseDescription = async () => {
    try {
      const threeChars = courseName.slice(-3);
      const response = await fetch(`/api/dart/groucho/course_desc.display_course_desc?term=202409&subj=${department}&numb=${threeChars}`);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const data = await response.text();
      setCourseDescription(data);
    } catch (error) {
      console.error('Error fetching course description:', error);
      setError(error.message);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCourse(), fetchReviews(), fetchUserVote(), fetchCourseDescription()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      console.log('Finished fetching all data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId, department]);

  const handleVote = async (voteType) => {
    if (!course || !currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const courseRef = doc(db, 'courses', courseId);

    let newLayup = course.layup !== undefined ? course.layup : 0; // Initialize layup to 0 if it doesn't exist

    if (vote === voteType) {
      newLayup = voteType === 'upvote' ? newLayup - 1 : newLayup + 1;
      await updateDoc(courseRef, { layup: newLayup });
      await setDoc(userDocRef, { votes: { [courseId]: null } }, { merge: true });
      setVote(null);
    } else {
      if (vote === 'upvote') {
        newLayup -= 1;
      } else if (vote === 'downvote') {
        newLayup += 1;
      }
      newLayup = voteType === 'upvote' ? newLayup + 1 : newLayup - 1;

      await updateDoc(courseRef, { layup: newLayup });
      await setDoc(userDocRef, { votes: { [courseId]: voteType } }, { merge: true });
      setVote(voteType);
    }

    setCourse(prev => ({ ...prev, layup: newLayup }));
  };

  const handlePinCourse = async () => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);

    try {
      if (pinned) {
        await updateDoc(userDocRef, {
          pinnedCourses: arrayRemove(courseId),
        });
        setPinned(false);
      } else {
        await updateDoc(userDocRef, {
          pinnedCourses: arrayUnion(courseId),
        });
        setPinned(true);
      }
    } catch (error) {
      console.error('Error pinning/unpinning course:', error);
    }
  };

  const splitReviewText = (review) => {
    if (!review) return { prefix: '', rest: '' };
    const match = review.match(/(.*?\d{2}[A-Z] with [^:]+: )([\s\S]*)/);
    if (match) {
      const [prefix, rest] = match.slice(1, 3);
      return { prefix, rest };
    } else {
      return { prefix: '', rest: review };
    }
  };

  const handleChangePage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleProfessorChange = (event) => {
    setSelectedProfessor(event.target.value);
    setCurrentPage(1);
  };

  const addReplyLocally = (reviewIndex, newReply) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.reviewIndex === reviewIndex
          ? { ...review, replies: Array.isArray(review.replies) ? [...review.replies, newReply] : [newReply] }
          : review
      )
    );
  };

  const ReviewItem = ({ instructor, prefix, rest, courseId, reviewIndex, onReplyAdded }) => {
    const { ref, inView } = useInView({ threshold: 0.1 });
    const { currentUser } = useAuth();
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [replyCount, setReplyCount] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

    const fetchReplies = async () => {
      try {
        const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
        const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
        const sanitizedCourseId = transformedCourseId ? transformedCourseId : courseId.split('_')[1];
        const sanitizedInstructor = instructor.replace(/\./g, '_');

        const repliesCollectionRef = collection(db, 'reviews', sanitizedCourseId, `${sanitizedInstructor}_${reviewIndex}_replies`);
        const replyDocs = await getDocs(repliesCollectionRef);

        const fetchedReplies = replyDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReplies(fetchedReplies);
        setReplyCount(fetchedReplies.length);
      } catch (error) {
        console.error('Error fetching replies:', error);
        setError('Failed to fetch replies.');
      }
    };

    const fetchLikes = async () => {
      try {
        const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
        const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
        const sanitizedCourseId = transformedCourseId ? transformedCourseId : courseId.split('_')[1];
        const sanitizedInstructor = instructor.replace(/\./g, '_');

        const likesCollectionRef = collection(db, 'reviews', sanitizedCourseId, `${sanitizedInstructor}_${reviewIndex}_likes`);
        const likeDocs = await getDocs(likesCollectionRef);

        const fetchedLikes = likeDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLikeCount(fetchedLikes.length);

        if (currentUser) {
          const userLike = fetchedLikes.find(like => like.userId === currentUser.uid);
          setHasLiked(!!userLike);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
        setError('Failed to fetch likes.');
      }
    };

    useEffect(() => {
      fetchReplies();
      fetchLikes();
    }, [courseId, instructor, reviewIndex]);

    const toggleReplies = () => {
      setShowReplies(!showReplies);
    };

    const handleLike = async () => {
      const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
      const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
      const sanitizedCourseId = transformedCourseId ? transformedCourseId : courseId.split('_')[1];
      const sanitizedInstructor = instructor.replace(/\./g, '_');

      const likesCollectionRef = collection(db, 'reviews', sanitizedCourseId, `${sanitizedInstructor}_${reviewIndex}_likes`);
      const likeDocRef = doc(likesCollectionRef, currentUser.uid);

      if (hasLiked) {
        await deleteDoc(likeDocRef);
        setLikeCount(likeCount - 1);
        setHasLiked(false);
      } else {
        await setDoc(likeDocRef, { userId: currentUser.uid });
        setLikeCount(likeCount + 1);
        setHasLiked(true);
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ margin: '10px 0', borderRadius: '8px', overflow: 'hidden' }}
      >
        <ListItem sx={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '10px', fontFamily: 'SF Pro Display, sans-serif' }}>
          <ListItemText
            primary={
              <>
                <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold', fontSize: '1rem' }}>
                  {prefix}
                </Typography>{' '}
                <Typography component="span" sx={{ color: 'black', fontSize: '0.9rem' }}>
                  {rest}
                </Typography>
              </>
            }
          />
          <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
            <IconButton onClick={handleLike} sx={{ color: hasLiked ? '#571CE0' : 'grey' }}>
              <Typography variant="body2" sx={{ fontSize: '1.5rem' }}>
                🔥
              </Typography>
              <Typography variant="body2" sx={{ marginLeft: '5px' }}>
                {likeCount}
              </Typography>
            </IconButton>
            <IconButton onClick={toggleReplies} sx={{ color: '#571CE0' }}>
              <ChatBubbleOutlineIcon />
              <Typography variant="body2" sx={{ marginLeft: '5px' }}>
                {replyCount}
              </Typography>
            </IconButton>
          </Box>
        </ListItem>
        {showReplies && (
          <>
            <List sx={{ pl: 4 }}>
              {replies.map((reply, index) => (
                <ListItem key={index} sx={{ backgroundColor: '#f9f9f9', borderRadius: '8px', marginTop: '10px' }}>
                  <ListItemText
                    primary={
                      <>
                        <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          Reply:
                        </Typography>{' '}
                        <Typography component="span" sx={{ color: 'black', fontSize: '0.8rem' }}>
                          {reply.reply}
                        </Typography>
                        <Typography component="span" sx={{ color: 'grey', fontSize: '0.7rem', marginLeft: '10px' }}>
                          {new Date(reply.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            <AddReplyForm
              reviewData={{ instructor, reviewIndex }}
                courseId={courseId}
                onReplyAdded={(newReply) => {
              addReplyLocally(reviewIndex, newReply);
              setReplies(prevReplies => [...prevReplies, newReply]); // Update local replies state
              setReplyCount(replyCount + 1); // Update reply count
            }}
            />

          </>
        )}
      </motion.div>
    );
  };

  const renderReviews = () => {
    const filteredReviews = selectedProfessor ? reviews.filter(item => item.instructor === selectedProfessor) : reviews;
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);

    let lastInstructor = '';

    return (
      <List sx={{ maxWidth: '100%', margin: '0' }}>
        {currentReviews.map((item, idx) => {
          const showInstructor = item.instructor !== lastInstructor;
          lastInstructor = item.instructor;

          const { prefix, rest } = splitReviewText(item.review);
          const replies = Array.isArray(item.replies) ? item.replies : [];  // Ensure replies is an array

          return (
            <React.Fragment key={idx}>
              {showInstructor && (
                <Typography variant="h6" sx={{ marginTop: '20px', color: '#571CE0', textAlign: 'left' }}>
                  {item.instructor}
                </Typography>
              )}
              <ReviewItem
                key={idx}
                instructor={item.instructor}
                prefix={prefix}
                rest={rest}
                replies={replies}
                courseId={courseId}
                reviewIndex={item.reviewIndex}
                onReplyAdded={fetchReviews} // Ensure fetchReviews is called to update UI
              />
            </React.Fragment>
          );
        })}
      </List>
    );
  };

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const renderPageButtons = () => {
    let pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <Button
            key={i}
            onClick={() => handleChangePage(i)}
            disabled={currentPage === i}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === i ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === i ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            {i}
          </Button>
        );
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(
            <Button
              key={i}
              onClick={() => handleChangePage(i)}
              disabled={currentPage === i}
              sx={{
                color: '#fff',
                backgroundColor: currentPage === i ? '#571CE0' : '#A074E8',
                '&:hover': {
                  backgroundColor: currentPage === i ? '#7E55CC' : '#7E55CC',
                },
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '0 2px',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
              }}
            >
              {i}
            </Button>
          );
        }
        pages.push(<Button key="ellipsis" disabled sx={{ color: '#fff', margin: '0 2px' }}>...</Button>);
        pages.push(
          <Button
            key={totalPages}
            onClick={() => handleChangePage(totalPages)}
            disabled={currentPage === totalPages}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === totalPages ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === totalPages ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            {totalPages}
          </Button>
        );
      } else if (currentPage > totalPages - 3) {
        pages.push(
          <Button
            key={1}
            onClick={() => handleChangePage(1)}
            disabled={currentPage === 1}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === 1 ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === 1 ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            1
          </Button>
        );
        pages.push(<Button key="ellipsis" disabled sx={{ color: '#fff', margin: '0 2px' }}>...</Button>);
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(
            <Button
              key={i}
              onClick={() => handleChangePage(i)}
              disabled={currentPage === i}
              sx={{
                color: '#fff',
                backgroundColor: currentPage === i ? '#571CE0' : '#A074E8',
                '&:hover': {
                  backgroundColor: currentPage === i ? '#7E55CC' : '#7E55CC',
                },
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '0 2px',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
              }}
            >
              {i}
            </Button>
          );
        }
      } else {
        pages.push(
          <Button
            key={1}
            onClick={() => handleChangePage(1)}
            disabled={currentPage === 1}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === 1 ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === 1 ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            1
          </Button>
        );
        pages.push(<Button key="ellipsis1" disabled sx={{ color: '#fff', margin: '0 2px' }}>...</Button>);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(
            <Button
              key={i}
              onClick={() => handleChangePage(i)}
              disabled={currentPage === i}
              sx={{
                color: '#fff',
                backgroundColor: currentPage === i ? '#571CE0' : '#A074E8',
                '&:hover': {
                  backgroundColor: currentPage === i ? '#7E55CC' : '#7E55CC',
                },
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '0 2px',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
              }}
            >
              {i}
            </Button>
          );
        }
        pages.push(<Button key="ellipsis2" disabled sx={{ color: '#fff', margin: '0 2px' }}>...</Button>);
        pages.push(
          <Button
            key={totalPages}
            onClick={() => handleChangePage(totalPages)}
            disabled={currentPage === totalPages}
            sx={{
              color: '#fff',
              backgroundColor: currentPage === totalPages ? '#571CE0' : '#A074E8',
              '&:hover': {
                backgroundColor: currentPage === totalPages ? '#7E55CC' : '#7E55CC',
              },
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 2px',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
            }}
          >
            {totalPages}
          </Button>
        );
      }
    }
    return pages;
  };

  const courseName = courseId.split('_')[1];

  const uniqueProfessors = [...new Set(reviews.map(item => item.instructor))];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        background: 'linear-gradient(to bottom, #E4E2DD 10%, #E4E2DD 30%, #571CE0 100%)',
        color: '#571CE0',
        textAlign: 'left',
        fontFamily: 'SF Pro Display',
        padding: '20px'
      }}
    >
      <Container>
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
    <Typography variant="h4" gutterBottom textAlign="left">
      Reviews for {courseName}
    </Typography>
    <Tooltip title={pinned ? 'Unpin Course' : 'Pin course on your Profile'}>
      <IconButton onClick={handlePinCourse} sx={{ color: pinned ? '#571CE0' : 'grey', marginLeft: 1,    marginTop: '-10px', // Move the pin up
 }}>
        <PushPin />
      </IconButton>
    </Tooltip>
  </Box>

  {courseDescription && (
    <Box
      sx={{
        textAlign: 'left',
        marginBottom: '20px',
        backgroundColor: 'transparent', // Set background to transparent
        color: 'black',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.5)', // Optional: Add shadow for a better look
        '& *': {
          // Reset background for all child elements
          backgroundColor: 'transparent !important',
          textAlign: 'left', // Ensure text is left-aligned
        },
      }}
    >
      <Typography
        variant="body1"
        sx={{ fontSize: '0.875rem', color: 'black', textAlign: 'left' }}
        dangerouslySetInnerHTML={{ __html: courseDescription }}
      />
    </Box>
  )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress sx={{ color: '#571CE0' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ textAlign: 'left' }}>{error}</Alert>
        ) : reviews.length > 0 ? (
          <>
            {course && (
              <Box sx={{
                position: 'fixed',
                top: '100px',
                left: '20px',
                display: { xs: 'none', sm: 'flex' }, // Hide on mobile
                flexDirection: 'column',
                alignItems: 'center',
                // Adjust the entire container's positioning
              }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  borderRadius: '50%',
                  backgroundColor: 'transparent', // Make the inside transparent
                  border: '2px solid #571CE0', // Purple border
                  boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.4)', // Denser shadow
                  padding: '10px', // Adjusted padding
                  width: '140px', // Circle size
                  height: '140px', // Circle size
                  justifyContent: 'space-around', // Space out the content evenly
                  boxSizing: 'border-box'
                }}>
                  <Tooltip title="Upvote">
                    <IconButton onClick={() => handleVote('upvote')} sx={{ color: vote === 'upvote' ? '#571CE0' : 'grey', padding: 0 }}>
                      <ArrowUpward sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="h6" sx={{ color: '#571CE0', fontSize: '1.5rem' }}>{course.layup || 0}</Typography>
                  <Tooltip title="Downvote">
                    <IconButton onClick={() => handleVote('downvote')} sx={{ color: vote === 'downvote' ? '#571CE0' : 'grey', padding: 0 }}>
                      <ArrowDownward sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                  
                </Box>
                <Typography variant="caption" sx={{
                  color: '#571CE0',
                  marginTop: '10px',
                  textAlign: 'center'
                }}>Is it a layup?</Typography>
              </Box>
            )}
            <Typography variant="h4" gutterBottom textAlign="left">Professors</Typography>
            <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Reviews</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(reviews.reduce((acc, review) => {
                    const { instructor } = review;
                    if (!acc[instructor]) {
                      acc[instructor] = [];
                    }
                    acc[instructor].push(review);
                    return acc;
                  }, {})).map(([instructor, reviewList], index) => (
                    <TableRow
                      key={index}
                      component={Link}
                      to={`/departments/${department}/courses/${courseId}/professors/${instructor}`}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                        '&:hover': { backgroundColor: '#e0e0e0' },
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{instructor}</TableCell>
                      <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{Array.isArray(reviewList) ? reviewList.length : 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-10px', marginTop: '60px' }}>
              <Typography variant="h4" gutterBottom textAlign="left">Reviews</Typography>
              <FormControl size="small" sx={{ minWidth: 120, backgroundColor: '#fff', borderRadius: '4px' }}>
                <InputLabel id="select-professor-label">Professor</InputLabel>
                <Select
                  labelId="select-professor-label"
                  value={selectedProfessor}
                  onChange={handleProfessorChange}
                  label="Professor"
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  {uniqueProfessors.map((professor, index) => (
                    <MenuItem key={index} value={professor}>
                      {professor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {renderReviews()}

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', width: '100%' }}>
              <Tooltip title="Previous Page" placement="top">
                <span>
                  <IconButton
                    onClick={() => handleChangePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    sx={{
                      color: '#fff',
                      backgroundColor: currentPage === 1 ? '#A074E8' : '#A074E8',
                      '&:hover': {
                        backgroundColor: currentPage === 1 ? '#A074E8' : '#7E55CC',
                      },
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                      margin: '0 2px',
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                </span>
              </Tooltip>
              <ButtonGroup variant="text" color="primary">
                {renderPageButtons()}
              </ButtonGroup>
              <Tooltip title="Next Page" placement="top">
                <span>
                  <IconButton
                    onClick={() => handleChangePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    sx={{
                      color: '#fff',
                      backgroundColor: currentPage === totalPages ? '#A074E8' : '#A074E8',
                      '&:hover': {
                        backgroundColor: currentPage === totalPages ? '#A074E8' : '#7E55CC',
                      },
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                      margin: '0 2px',
                    }}
                  >
                    <ArrowForward />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', marginBottom: '20px' }}>
              <Typography variant="h6" sx={{ marginBottom: '20px', color: '#571CE0' }}>
                No reviews available
              </Typography>
              <Typography variant="h6" sx={{ color: '#571CE0' }}>
                Don't be shy, be the first one to add a review!
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
                <img src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnYzdG9sMWVoa2p5aWY3NmF2cTM5c2UzNnI3c20waWRjYTF5b2drOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/USbM2BJpAg7Di/giphy.gif" alt="No Reviews" style={{ width: '300px', height: '300px' }} />
              </Box>
            </Box>
          </>
        )}
        <Box
          sx={{
            background: '',
            padding: '20px',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '100%',
            color: '#fff',
          }}
        >
          <Container maxWidth="md">
            <AddReviewForm onReviewAdded={fetchReviews} />
          </Container>
        </Box>
      </Container>
    </Box>
  );
};

export default CourseReviewsPage;
