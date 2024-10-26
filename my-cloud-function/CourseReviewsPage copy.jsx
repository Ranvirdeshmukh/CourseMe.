import React, { useEffect, useState, useCallback } from 'react';

import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TextField,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Card,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, PushPin } from '@mui/icons-material';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../src/contexts/AuthContext';
import { db } from '../src/firebase';
import AddReviewForm from '../src/pages/AddReviewForm';
import AddReplyForm from '../src/pages/AddReplyForm';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const CourseReviewsPage = () => {
  const { department, courseId } = useParams();
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState(null);
  const [courseDescription, setCourseDescription] = useState('');
  const [pinned, setPinned] = useState(false);


  const [deptAndNumber, ...rest] = courseId.split('__');
  const deptCode = deptAndNumber.match(/[A-Z]+/)[0];
  const courseNumber = deptAndNumber.match(/\d+/)[0];

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
      console.log(transformedCourseId)
      console.log(transformedCourseIdMatch)
      console.log("hello")
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
          courseData.layup = 0;
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
      setPinned(userData.pinnedCourses ? userData.pinnedCourses.includes(courseId) : false);
    }
  }, [currentUser, courseId]);

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
  }, [courseId, department, fetchData]);

  const fetchCourseDescription = async () => {
    try {
      const response = await fetch(`${API_URL}/fetch-text?subj=${deptCode}&numb=${courseNumber}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.content) {
        setCourseDescription(data.content);
      } else {
        throw new Error('No content in the response');
      }
    } catch (error) {
      console.error('Error fetching course description:', error);
      setError(error.message);
    }
  };

  const API_URL = process.env.REACT_APP_API_URL || 'https://url-text-fetcher-368299696124.us-central1.run.app';

  useEffect(() => {
    const fetchCourseDescription = async () => {
      try {
        const response = await fetch(`${API_URL}/fetch-text?subj=${deptCode}&numb=${courseNumber}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.content) {
          setCourseDescription(data.content);
        } else {
          throw new Error('No content in the response');
        }
      } catch (error) {
        console.error('Error fetching course description:', error);
        setError(error.message);
      }
    };
  
    fetchCourseDescription();
  }, [deptCode, courseNumber]);
  

  const handleVote = async (voteType) => {
    if (!course || !currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const courseRef = doc(db, 'courses', courseId);

    let newLayup = course.layup !== undefined ? course.layup : 0;

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

    setCourse((prev) => ({ ...prev, layup: newLayup }));
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
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
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

        const repliesCollectionRef = collection(
          db,
          'reviews',
          sanitizedCourseId,
          `${sanitizedInstructor}_${reviewIndex}_replies`
        );
        const replyDocs = await getDocs(repliesCollectionRef);

        const fetchedReplies = replyDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

        const likesCollectionRef = collection(
          db,
          'reviews',
          sanitizedCourseId,
          `${sanitizedInstructor}_${reviewIndex}_likes`
        );
        const likeDocs = await getDocs(likesCollectionRef);

        const fetchedLikes = likeDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setLikeCount(fetchedLikes.length);

        if (currentUser) {
          const userLike = fetchedLikes.find((like) => like.userId === currentUser.uid);
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
    }, [courseId, instructor, reviewIndex, fetchReplies, fetchLikes]);

    const toggleReplies = () => {
      setShowReplies(!showReplies);
    };

    const handleLike = async () => {
      const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
      const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;
      const sanitizedCourseId = transformedCourseId ? transformedCourseId : courseId.split('_')[1];
      const sanitizedInstructor = instructor.replace(/\./g, '_');

      const likesCollectionRef = collection(
        db,
        'reviews',
        sanitizedCourseId,
        `${sanitizedInstructor}_${reviewIndex}_likes`
      );
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ margin: '20px 0', borderRadius: '12px', overflow: 'hidden' }}
      >
        <ListItem
          sx={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            fontFamily: 'SF Pro Display, sans-serif',
          }}
        >
          <ListItemText
            primary={
              <>
                <Typography component="span" sx={{ color: '#000', fontWeight: 600, fontSize: '1rem' }}>
                  {prefix}
                </Typography>{' '}
                <Typography component="span" sx={{ color: '#333', fontSize: '0.9rem' }}>
                  {rest}
                </Typography>
              </>
            }
          />
          <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
            <IconButton onClick={handleLike} sx={{ color: hasLiked ? '#571CE0' : '#999' }}>
              <Typography variant="body2" sx={{ fontSize: '1.5rem' }}>
                🔥
              </Typography>
              <Typography variant="body2" sx={{ marginLeft: '5px', fontWeight: 500, color: '#666' }}>
                {likeCount}
              </Typography>
            </IconButton>
            <IconButton onClick={toggleReplies} sx={{ color: '#571CE0' }}>
              <ChatBubbleOutlineIcon />
              <Typography variant="body2" sx={{ marginLeft: '5px', fontWeight: 500, color: '#666' }}>
                {replyCount}
              </Typography>
            </IconButton>
          </Box>
        </ListItem>
        {showReplies && (
          <>
            <List sx={{ pl: 4 }}>
              {replies.map((reply, index) => (
                <ListItem key={index} sx={{ backgroundColor: '#f7f7f7', borderRadius: '8px', marginTop: '10px' }}>
                  <ListItemText
                    primary={
                      <>
                        <Typography
                          component="span"
                          sx={{ color: '#000', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          Reply:
                        </Typography>{' '}
                        <Typography component="span" sx={{ color: '#333', fontSize: '0.8rem' }}>
                          {reply.reply}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ color: '#999', fontSize: '0.7rem', marginLeft: '10px' }}
                        >
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
                setReplies((prevReplies) => [...prevReplies, newReply]);
                setReplyCount(replyCount + 1);
              }}
            />
          </>
        )}
      </motion.div>
    );
  };

  const renderReviews = () => {
    const filteredReviews = selectedProfessor ? reviews.filter((item) => item.instructor === selectedProfessor) : reviews;
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
          const replies = Array.isArray(item.replies) ? item.replies : [];

          return (
            <React.Fragment key={idx}>
              {showInstructor && (
                <Typography variant="h6" sx={{ marginTop: '20px', color: '#1D1D1F', textAlign: 'left', fontWeight: 600 }}>
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
                onReplyAdded={fetchReviews}
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
        pages.push(
          <Button key="ellipsis" disabled sx={{ color: '#fff', margin: '0 2px' }}>
            ...
          </Button>
        );
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
        pages.push(
          <Button key="ellipsis" disabled sx={{ color: '#fff', margin: '0 2px' }}>
            ...
          </Button>
        );
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
        pages.push(
          <Button key="ellipsis1" disabled sx={{ color: '#fff', margin: '0 2px' }}>
            ...
          </Button>
        );
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
        pages.push(
          <Button key="ellipsis2" disabled sx={{ color: '#fff', margin: '0 2px' }}>
            ...
          </Button>
        );
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

  const uniqueProfessors = [...new Set(reviews.map((item) => item.instructor))];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        backgroundColor: '#E4E2DD', // Change this to the previous color
        color: '#1D1D1F',
        textAlign: 'left',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '40px',
      }}
    >
      <Container maxWidth="lg">
        <Card
          sx={{
            marginBottom: 4,
            padding: 4,
            backgroundColor: '#FFFFFF',
            color: '#1D1D1F',
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            maxWidth: 1100,
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 3, justifyContent: 'space-between' }}>
            <Typography variant="h4" gutterBottom textAlign="left" sx={{ fontWeight: 700, fontSize: '2rem' }}>
              {courseName}
            </Typography>
            <Tooltip title={pinned ? 'Unpin Course' : 'Pin course on your Profile'}>
  <IconButton
    onClick={handlePinCourse}
    sx={{
      color: pinned ? '#571CE0' : 'grey',
      marginLeft: 1,
      marginTop: '-10px',
      transition: 'color 0.3s',
      '&:hover': {
        color: pinned ? '#FF0000' : '#571CE0',
      },
    }}
  >
    <PushPin sx={{ fontSize: 30 }} /> {/* Increase the fontSize here */}
  </IconButton>
</Tooltip>

          </Box>
          {courseDescription && (
            <Box
              sx={{
                textAlign: 'left',
                marginBottom: '20px',
                backgroundColor: 'transparent',
                color: 'black',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontSize: '0.95rem', color: 'black', textAlign: 'left', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: courseDescription }}
              />
            </Box>
          )}
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress sx={{ color: '#571CE0' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ textAlign: 'left' }}>
            {error}
          </Alert>
        ) : reviews.length > 0 ? (
          <>
            {course && (
              <Box
                sx={{
                  position: 'fixed',
                  top: '150px',
                  left: '20px',
                  display: { xs: 'none', sm: 'flex' },
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    border: '2px solid #571CE0',
                    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
                    padding: '10px',
                    width: '140px',
                    height: '140px',
                    justifyContent: 'space-around',
                    boxSizing: 'border-box',
                  }}
                >
                  <Tooltip title="Upvote">
                    <IconButton
                      onClick={() => handleVote('upvote')}
                      sx={{ color: vote === 'upvote' ? '#571CE0' : 'grey', padding: 0 }}
                    >
                      <ArrowUpward sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="h6" sx={{ color: '#571CE0', fontSize: '1.5rem', fontWeight: 700 }}>
                    {course.layup || 0}
                  </Typography>
                  <Tooltip title="Downvote">
                    <IconButton
                      onClick={() => handleVote('downvote')}
                      sx={{ color: vote === 'downvote' ? '#571CE0' : 'grey', padding: 0 }}
                    >
                      <ArrowDownward sx={{ fontSize: 24 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#571CE0',
                    marginTop: '10px',
                    textAlign: 'center',
                    fontWeight: 500,
                  }}
                >
                  Is it a layup?
                </Typography>
              </Box>
            )}
            <Typography variant="h4" gutterBottom textAlign="left" sx={{ marginTop: 4, fontWeight: 700 }}>
              Professors
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: '#fff',
                marginTop: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold', fontSize: '1rem' }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold', fontSize: '1rem' }}>
                      Reviews
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(
                    reviews.reduce((acc, review) => {
                      const { instructor } = review;
                      if (!acc[instructor]) {
                        acc[instructor] = [];
                      }
                      acc[instructor].push(review);
                      return acc;
                    }, {})
                  ).map(([instructor, reviewList], index) => (
                    <TableRow
                      key={index}
                      component={Link}
                      to={`/departments/${department}/courses/${courseId}/professors/${instructor}`}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                        '&:hover': { backgroundColor: '#e0e0e0' },
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <TableCell sx={{ color: '#1D1D1F', padding: '10px', textAlign: 'left', fontWeight: 500 }}>
                        {instructor}
                      </TableCell>
                      <TableCell sx={{ color: '#1D1D1F', padding: '10px', textAlign: 'left', fontWeight: 500 }}>
                        {Array.isArray(reviewList) ? reviewList.length : 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '-10px',
                marginTop: '60px',
              }}
            >
              <Typography variant="h4" gutterBottom textAlign="left" sx={{ fontWeight: 700 }}>
                Reviews
              </Typography>
              <FormControl
                size="small"
                sx={{
                  minWidth: 150,
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              >
                <InputLabel id="select-professor-label" sx={{ fontWeight: 500 }}>
                  Professor
                </InputLabel>
                <Select
                  labelId="select-professor-label"
                  value={selectedProfessor}
                  onChange={handleProfessorChange}
                  label="Professor"
                  sx={{ fontWeight: 500 }}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  {uniqueProfessors.map((professor, index) => (
                    <MenuItem key={index} value={professor} sx={{ fontWeight: 500 }}>
                      {professor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {renderReviews()}

            <Box
  sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20px',
    width: '100%',
    gap: '16px', // Increase space between elements for a more airy feel
  }}
>
  <Tooltip title="Previous Page" placement="top">
    <span>
      <IconButton
        onClick={() => handleChangePage(currentPage - 1)}
        disabled={currentPage === 1}
        sx={{
          color: '#000', // Apple-style black text
          backgroundColor: currentPage === 1 ? '#F5F5F7' : '#F5F5F7',
          borderRadius: '12px', // Subtle rounding for a more modern look
          padding: '12px',
          border: '1px solid #D1D1D6', // Subtle border
          '&:hover': {
            backgroundColor: currentPage === 1 ? '#F5F5F7' : '#E0E0E0',
          },
          transition: 'background-color 0.3s ease',
        }}
      >
        <ArrowBack sx={{ fontSize: '20px' }} />
      </IconButton>
    </span>
  </Tooltip>

  <ButtonGroup
    variant="text"
    sx={{
      '& .MuiButtonGroup-grouped': {
        minWidth: '40px', // Consistent button size
        height: '40px',
        borderRadius: '12px', // Subtle rounding
        backgroundColor: '#F5F5F7',
        color: '#000',
        border: '1px solid #D1D1D6', // Subtle border
        margin: '0 2px',
        fontSize: '16px',
        '&:hover': {
          backgroundColor: '#E0E0E0',
        },
        '&.Mui-selected': {
          backgroundColor: '#007AFF', // Apple blue for selected page
          color: '#fff',
          '&:hover': {
            backgroundColor: '#0066CC',
          },
        },
      },
    }}
  >
    {renderPageButtons()}
  </ButtonGroup>

  <Tooltip title="Next Page" placement="top">
    <span>
      <IconButton
        onClick={() => handleChangePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        sx={{
          color: '#000',
          backgroundColor: currentPage === totalPages ? '#F5F5F7' : '#F5F5F7',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid #D1D1D6',
          '&:hover': {
            backgroundColor: currentPage === totalPages ? '#F5F5F7' : '#E0E0E0',
          },
          transition: 'background-color 0.3s ease',
        }}
      >
        <ArrowForward sx={{ fontSize: '20px' }} />
      </IconButton>
    </span>
  </Tooltip>
</Box>



          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', marginBottom: '20px' }}>
              <Typography variant="h6" sx={{ marginBottom: '20px', color: '#571CE0', fontWeight: 600 }}>
                No reviews available
              </Typography>
              <Typography variant="h6" sx={{ color: '#571CE0', fontWeight: 600 }}>
                Don't be shy, be the first one to add a review!
              </Typography>
              <Box
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}
              >
                <img
                  src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnYzdG9sMWVoa2p5aWY3NmF2cTM5c2UzNnI3c20waWRjYTF5b2drOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/USbM2BJpAg7Di/giphy.gif"
                  alt="No Reviews"
                  style={{ width: '300px', height: '300px', borderRadius: '8px' }}
                />
              </Box>
            </Box>
          </>
        )}
        <Box
          sx={{
            background: '',
            padding: '20px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '100%',
            color: '#fff',
            boxShadow: 'none', // Set this to 'none' or remove it entirely
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
