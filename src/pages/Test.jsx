import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, TextField, InputAdornment, CircularProgress, Alert,
  useMediaQuery, MenuItem, Select, FormControl, InputLabel, Snackbar,
  Button, IconButton, ButtonBase, LinearProgress, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, limit, startAfter } from 'firebase/firestore';
import { styled } from '@mui/material/styles';
import debounce from 'lodash/debounce';

const FloatingTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
}));

const RoundedTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const Timetable = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { currentUser } = useAuth();
  const isMobile = useMediaQuery('(max-width:600px)');
  const coursesPerPage = 10;

  const db = getFirestore();

  const fetchCourses = useCallback(async (isNextPage = false) => {
    setLoading(true);
    try {
      let coursesQuery = query(
        collection(db, 'courses'),
        where('subject', '==', selectedSubject || null),
        limit(coursesPerPage)
      );

      if (isNextPage && lastVisible) {
        coursesQuery = query(
          coursesQuery,
          startAfter(lastVisible)
        );
      }

      const querySnapshot = await getDocs(coursesQuery);
      const fetchedCourses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCourses(prevCourses => isNextPage ? [...prevCourses, ...fetchedCourses] : fetchedCourses);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === coursesPerPage);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError(error);
      setLoading(false);
    }
  }, [db, selectedSubject, lastVisible]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prevPage => prevPage + 1);
      fetchCourses(true);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
      // You might need to implement a way to fetch previous page data
    }
  };

  const handleSearch = debounce((term) => {
    setSearchTerm(term);
    // Implement search logic here
  }, 300);

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
    setCurrentPage(1);
    setLastVisible(null);
    fetchCourses();
  };

  const handleNotification = (course) => {
    // Implement your notification logic here
    console.log(`Notification set for ${course.department} ${course.number} Section ${course.section}`);
    setSnackbarMessage(`Notification set for ${course.department} ${course.number}`);
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}>
          Fall '24 Timetable
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search courses..."
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl variant="outlined" fullWidth={isMobile}>
            <InputLabel>Subject</InputLabel>
            <Select
              value={selectedSubject}
              onChange={handleSubjectChange}
              label="Subject"
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          * Courses marked with an asterisk require instructor permission.
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">Error loading courses: {error.message}</Alert>
        ) : (
          <RoundedTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Instructor</TableCell>
                  <TableCell>Enrollment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <FloatingTableRow key={course.id}>
                    <TableCell>
                      {course.department} {course.number}
                      {course.instructorPermission && '*'}
                    </TableCell>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.instructor}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={(course.enrolled / course.limit) * 100}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                        <Typography variant="body2">
                          {course.enrolled}/{course.limit}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Set notification">
                        <IconButton onClick={() => handleNotification(course)}>
                          <NotificationsActiveIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </FloatingTableRow>
                ))}
              </TableBody>
            </Table>
          </RoundedTableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Typography sx={{ mx: 2 }}>Page {currentPage}</Typography>
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={handleNextPage}
            disabled={!hasMore}
          >
            Next
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Timetable;