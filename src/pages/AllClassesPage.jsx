import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Alert, 
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
  useMediaQuery, 
  CircularProgress 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import departmentOverview from '../classstructure/departmentOverview';

const CACHE_KEY = 'departmentData';
const CACHE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const AllClassesPage = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const exampleIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const forwardRef = useRef(true);
  const [placeholder, setPlaceholder] = useState('');
  const isMobile = useMediaQuery('(max-width:600px)');

  const departmentExamples = useMemo(() => ['Search Departments', 'Computer Science', 'Biology', 'Chemistry', 'History', 'Mathematics'], []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY));
        const now = new Date().getTime();

        if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
          setDepartments(cachedData.departments);
          setFilteredDepartments(cachedData.departments);
        } else {
          const departmentCodes = Object.keys(departmentOverview);
          setDepartments(departmentCodes);
          setFilteredDepartments(departmentCodes);

          // Cache the data
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: now,
            departments: departmentCodes,
          }));
        }
      } catch (error) {
        setError('Failed to fetch departments.');
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let timeout;

    const type = () => {
      if (forwardRef.current) {
        if (charIndexRef.current < departmentExamples[exampleIndexRef.current].length) {
          setPlaceholder((prev) => prev + departmentExamples[exampleIndexRef.current].charAt(charIndexRef.current));
          charIndexRef.current++;
          timeout = setTimeout(type, 100);
        } else {
          forwardRef.current = false;
          timeout = setTimeout(type, 1000);
        }
      } else {
        if (charIndexRef.current > 0) {
          setPlaceholder((prev) => prev.slice(0, -1));
          charIndexRef.current--;
          timeout = setTimeout(type, 50);
        } else {
          forwardRef.current = true;
          exampleIndexRef.current = (exampleIndexRef.current + 1) % departmentExamples.length;
          timeout = setTimeout(type, 500);
        }
      }
    };

    timeout = setTimeout(type, 500);

    return () => clearTimeout(timeout);
  }, [departmentExamples]);

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = departments.filter((department) =>
      department.toLowerCase().includes(term) ||
      departmentOverview[department]?.name.toLowerCase().includes(term)
    );

    setFilteredDepartments(filtered);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#E4E2DD',
        padding: '20px'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Typography 
            variant="h3" 
            align='left'
            sx={{ 
              fontWeight: 600, 
              fontFamily: 'SF Pro Display, sans-serif', 
              color: '#571CE0',  // Purple color for headings
              marginBottom: '0px',
              marginTop: '20px'
            }}
          >
            All Departments at <span style={{ color: '#349966' }}>Dartmouth</span>
          </Typography>
          <TextField
            variant="outlined"
            placeholder={placeholder}
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
          <Alert severity="error">{error}</Alert>
        ) : filteredDepartments.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3, borderRadius:'12px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Code</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Department Name</TableCell>
                  {!isMobile && <TableCell sx={{ color: '#571CE0', textAlign: 'left', fontWeight: 'bold' }}>Undergrad Courses</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDepartments.map((department, index) => (
                  <TableRow
                    key={index}
                    component={Link}
                    to={`/departments/${department}`}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#f4f4f4',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{department}</TableCell>
                    <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{departmentOverview[department]?.name || department}</TableCell>
                    {!isMobile && <TableCell sx={{ color: 'black', padding: '10px', textAlign: 'left' }}>{departmentOverview[department]?.courses || 'N/A'}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No departments available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default AllClassesPage;
