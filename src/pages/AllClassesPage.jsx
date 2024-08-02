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
    try {
      const departmentCodes = Object.keys(departmentOverview);
      setDepartments(departmentCodes);
      setFilteredDepartments(departmentCodes);
    } catch (error) {
      setError('Failed to fetch departments.');
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
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

    timeout = setTimeout(type, 500); // Start the typing animation after a brief delay

    // Clear timeout on component unmount
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, width: '100%' }}>
          <Typography variant="h4" align='left' color="primary" sx={{ fontWeight: 'bold' }}>
            All Departments at <span style={{ color: 'green' }}>Dartmouth</span>
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
          <TableContainer component={Paper} sx={{ backgroundColor: '#fff', marginTop: '20px', boxShadow: 3 }}>
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
