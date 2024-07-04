import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, List, ListItem, ListItemText, Button, ButtonGroup, IconButton } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import departmentMapping from '../classstructure/departmentMapping';

const CourseReviewsPage = () => {
  const { department, courseId } = useParams();
  const [reviews, setReviews] = useState({});
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const sanitizedCourseId = courseId.split('_')[1]; // Get the actual course code part (e.g., COSC001)
        console.log(`Fetching reviews for document path: reviews/${sanitizedCourseId}`);
        const docRef = doc(db, 'reviews', sanitizedCourseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Document data:', data);
          setReviews(data);
        } else {
          console.log('No such document!');
          setError('No reviews found for this course.');
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to fetch reviews.');
      }
    };

    fetchReviews();
  }, [courseId]);

  const handleChangePage = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderReviews = () => {
    const allReviews = Object.entries(reviews).flatMap(([instructor, reviewList]) => 
      reviewList.map(review => ({ instructor, review }))
    );

    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = allReviews.slice(indexOfFirstReview, indexOfLastReview);

    return (
      <List>
        {currentReviews.map((item, idx) => (
          <React.Fragment key={idx}>
            <Typography variant="h6" sx={{ marginTop: '20px', color: '#571CE0' }}>{item.instructor}</Typography>
            <ListItem key={idx} sx={{ backgroundColor: '#fff', margin: '10px 0', borderRadius: '8px' }}>
              <ListItemText primary={item.review} />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  };

  const allReviews = Object.entries(reviews).flatMap(([instructor, reviewList]) => reviewList);
  const totalPages = Math.ceil(allReviews.length / reviewsPerPage);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E4E2DD', // Light background color
        color: '#571CE0', // Purple text color
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '20px'
      }}
    >
      <Container>
        <Typography variant="h4" gutterBottom>Reviews for {department}_{courseId} in {departmentMapping[department]?.name || department}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {Object.keys(reviews).length > 0 ? (
          <>
            <Typography variant="h5" gutterBottom>Professors</Typography>
            <TableContainer component={Paper} sx={{ backgroundColor: '#E4E2DD', margin: '20px 0' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Reviews</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(reviews).map(([instructor, reviewList], index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ color: '#571CE0', textAlign: 'center' }}>
                        <Link to={`/departments/${department}/courses/${courseId}/professors/${instructor}`} style={{ textDecoration: 'none', color: '#571CE0' }}>{instructor}</Link>
                      </TableCell>
                      <TableCell sx={{ color: '#571CE0', textAlign: 'center' }}>{reviewList.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="h5" gutterBottom>Reviews</Typography>
            {renderReviews()}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
              <IconButton
                onClick={() => handleChangePage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ArrowBack />
              </IconButton>
              <ButtonGroup variant="text" color="primary">
                {Array.from({ length: totalPages }, (_, idx) => (
                  <Button
                    key={idx + 1}
                    onClick={() => handleChangePage(idx + 1)}
                    disabled={currentPage === idx + 1}
                  >
                    {idx + 1}
                  </Button>
                ))}
              </ButtonGroup>
              <IconButton
                onClick={() => handleChangePage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ArrowForward />
              </IconButton>
            </Box>
          </>
        ) : (
          <Typography>No reviews available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default CourseReviewsPage;
