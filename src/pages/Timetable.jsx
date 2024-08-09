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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Timetable = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/courses');
        console.log('Fetched Courses:', response.data);
        setCourses(response.data);
        setFilteredCourses(response.data); // Initialize with all courses
        extractSubjects(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchCourses();

    // Polling (if necessary)
    const intervalId = setInterval(() => {
      fetchCourses();
    }, 60000); // Fetch every minute

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    applyFilters(courses, searchTerm, selectedSubject);
  }, [searchTerm, selectedSubject, courses]);

  const extractSubjects = (courses) => {
    const subjectsSet = new Set(courses.map((course) => course.subj));
    setSubjects([...subjectsSet]);
  };

  const applyFilters = (courses, searchTerm, selectedSubject) => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter((course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.subj.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter((course) => course.subj === selectedSubject);
    }

    setFilteredCourses(filtered);
  };

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };

  const handleSubjectChange = (event) => {
    const subject = event.target.value;
    setSelectedSubject(subject);
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
      <Box
        sx={{
          position: 'fixed',
          top: 80,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            backgroundColor: '#F26655', // Purple color for the dot
            borderRadius: '50%',
            marginRight: '8px',
            animation: 'blinker 1.5s linear infinite',
            '@keyframes blinker': {
              '50%': { opacity: 0 },
            },
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 'semi-bold', fontFamily: 'SF Pro Display, sans-serif', color: 'black' }}>
          Fetching Live Courses
        </Typography>
      </Box>
      <Container maxWidth="xl">
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
            Fall '24 Timetable 
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
          <FormControl variant="outlined" sx={{ minWidth: 200, marginTop: '25px' }}>
            <InputLabel>Subject</InputLabel>
            <Select
              value={selectedSubject}
              onChange={handleSubjectChange}
              label="Subject"
              sx={{
                borderRadius: '20px',
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
                },
              }}
            >
              <MenuItem value="">
                <em>All Subjects</em>
              </MenuItem>
              {subjects.map((subject, index) => (
                <MenuItem key={index} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <CircularProgress color="primary" />
        ) : error ? (
          <Alert severity="error">Error loading courses: {error.message}</Alert>
        ) : filteredCourses.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3, borderRadius: '12px', maxWidth: '100%' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#571CE0' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Subject</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Number</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Section</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Title</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Period</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Room</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Building</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Instructor</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Enrollment</TableCell>
                  <TableCell sx={{ color: '#fff', textAlign: 'left', fontWeight: 'bold', padding: '12px' }}>Limit</TableCell>
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
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.subj}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.num}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.sec}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.title}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.period}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.room}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.building}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.instructor}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.enrl}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '12px', textAlign: 'left' }}>{course.lim}</TableCell>
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
