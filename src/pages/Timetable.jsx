import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Timetable = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/courses');
        console.log('Fetched Courses:', response.data);
        setCourses(response.data);
        setFilteredCourses(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = courses.filter((course) =>
      course.title.toLowerCase().includes(term) ||
      course.subj.toLowerCase().includes(term) ||
      course.instructor.toLowerCase().includes(term)
    );

    setFilteredCourses(filtered);
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
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography
            variant="h3"
            align="left"
            sx={{
              fontWeight: 600,
              fontFamily: 'SF Pro Display, sans-serif',
              color: '#571CE0',
              marginBottom: '0px',
              marginTop: '20px',
            }}
          >
            Timetable
          </Typography>
          <TextField
            variant="outlined"
            placeholder="Search Courses"
            value={searchTerm}
            onChange={handleSearch}
            sx={{
              width: isMobile ? '100%' : '300px',
              height: '40px',
              borderRadius: '20px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              marginTop: '25px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#571CE0',
                },
                '&:hover fieldset': {
                  borderColor: '#571CE0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#571CE0',
                },
                borderRadius: '20px',
                height: '40px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#571CE0' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <CircularProgress color="primary" />
        ) : error ? (
          <Alert severity="error">Error loading courses: {error.message}</Alert>
        ) : filteredCourses.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3, borderRadius: '12px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Subject</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Number</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Section</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Period</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Room</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Building</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Instructor</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Enrollment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCourses.map((course, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.subj}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.num}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.sec}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.title}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.period}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.room}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.building}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.instructor}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{course.enrl}/{course.lim}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No courses available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default Timetable;
