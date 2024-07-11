import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, List, ListItem, ListItemText, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AddReviewForm from './AddReviewForm'; // Import the AddReviewForm component

const CourseReviewsPage = () => {
  const { department, courseId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  const fetchReviews = useCallback(async () => {
    const fetchDocument = async (path) => {
      console.log(`Fetching reviews for document path: ${path}`);
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    };

    try {
      let data = null;

      // First, try to match specific course ID with instructor code
      const transformedCourseIdMatch = courseId.match(/([A-Z]+\d{3}_\d{2})/);
      const transformedCourseId = transformedCourseIdMatch ? transformedCourseIdMatch[0] : null;

      if (transformedCourseId) {
        data = await fetchDocument(`reviews/${transformedCourseId}`);
      }

      // If no data found, try fetching by the sanitized course ID
      if (!data) {
        const sanitizedCourseId = courseId.split('_')[1]; // Get the actual course code part (e.g., COSC001)
        console.log(`Fetching reviews for document path: reviews/${sanitizedCourseId}`);
        data = await fetchDocument(`reviews/${sanitizedCourseId}`);
      }

      if (data) {
        console.log('Document data:', data);

        // Flatten the reviews into a single array
        const reviewsArray = Object.entries(data).flatMap(([instructor, reviewList]) => {
          // Ensure reviewList is an array
          if (Array.isArray(reviewList)) {
            return reviewList.map(review => ({ instructor, review }));
          } else {
            console.error(`Expected reviewList to be an array but got:`, reviewList);
            return [];
          }
        });

        setReviews(reviewsArray);
      } else {
        console.log('No such document!');
        setError('No reviews found for this course.');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to fetch reviews.');
    }
  }, [courseId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleChangePage = (newPage) => {
    setCurrentPage(newPage);
  };

  const splitReviewText = (review) => {
    const match = review.match(/(.*?\d{2}[A-Z] with [^:]+: )([\s\S]*)/);
    if (match) {
      const [prefix, rest] = match.slice(1, 3);
      return { prefix, rest };
    } else {
      return { prefix: '', rest: review };
    }
  };

  const renderReviews = () => {
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

    let lastInstructor = '';

    return (
      <List sx={{ maxWidth: '100%', margin: '0' }}> {/* Adjusted review list width and removed auto margin */}
        {currentReviews.map((item, idx) => {
          const { prefix, rest } = splitReviewText(item.review);
          const showInstructor = item.instructor !== lastInstructor;
          lastInstructor = item.instructor;

          return (
            <React.Fragment key={idx}>
              {showInstructor && (
                <Typography variant="h6" sx={{ marginTop: '20px', color: '#571CE0', textAlign: 'left' }}>
                  {item.instructor}
                </Typography>
              )}
              <ListItem key={idx} sx={{ backgroundColor: '#fff', margin: '10px 0', borderRadius: '8px' }}>
                <ListItemText
                  primary={
                    <>
                      <Typography component="span" sx={{ color: '#571CE0', fontWeight: 'bold' }}>
                        {prefix}
                      </Typography>{' '}
                      <Typography component="span" sx={{ color: 'black' }}>
                        {rest}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
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

  // Extract the course name from the courseId (assuming the format is consistent)
  const courseName = courseId.split('_')[1];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start', // Align items to the start (left-aligned)
        alignItems: 'flex-start', // Ensure items are aligned to the left
        background: 'linear-gradient(to bottom, #E4E2DD 10%, #E4E2DD 30%, #571CE0 100%)', // Gradient background
        color: '#571CE0', // Purple text color
        textAlign: 'left', // Align text to the left
        fontFamily: 'SF Pro Display',
        padding: '20px'
      }}
    >
      <Container>
        <Typography variant="h4" gutterBottom textAlign="center">Reviews for {courseName}</Typography>
        {error && <Alert severity="error" sx={{ textAlign: 'left' }}>{error}</Alert>}
        {reviews.length > 0 ? (
          <>
            <Typography variant="h4" gutterBottom textAlign="left">Professors</Typography>
            <TableContainer component={Paper} sx={{ backgroundColor: '#E4E2DD', margin: '20px 0' }}>
              <Table sx={{ minWidth: 300 }}> {/* Adjusted table width */}
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold', padding: '8px' }}> {/* Adjusted padding */}
                      Name
                    </TableCell>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold', padding: '8px' }}> {/* Adjusted padding */}
                      Reviews
                    </TableCell>
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
                    <TableRow key={index}>
                      <TableCell sx={{ color: '#571CE0', textAlign: 'left', padding: '8px' }}> {/* Adjusted padding */}
                        <Link to={`/departments/${department}/courses/${courseId}/professors/${instructor}`} style={{ textDecoration: 'none', color: '#571CE0' }}>{instructor}</Link>
                      </TableCell>
                      <TableCell sx={{ color: '#571CE0', textAlign: 'left', padding: '8px' }}> {/* Adjusted padding */}
                        {Array.isArray(reviewList) ? reviewList.length : 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="h4" gutterBottom textAlign="left">Reviews</Typography>
            {renderReviews()}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', width: '100%' }}> {/* Centered pagination controls */}
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
          <Box>
            <Typography textAlign="center">No reviews available</Typography>
            <Typography variant="h6" sx={{ marginTop: '20px', color: '#571CE0', textAlign: 'center' }}>
              Don't be shy, be the first one to add a review!
            </Typography>
          </Box>
        )}
      </Container>
      <Box
        sx={{
          background: '', // Gradient background remains the same
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          width: '100%',
          maxWidth: '100', // Increased form container width
          color: '#fff',
        }}
      >
        <Container maxWidth="md"> {/* Changed maxWidth to 'md' */}
          <AddReviewForm onReviewAdded={fetchReviews} /> {/* Add the AddReviewForm component */}
        </Container>
      </Box>
    </Box>
  );
};

export default CourseReviewsPage;
