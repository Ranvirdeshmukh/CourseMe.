// src/pages/AllClassesPage.jsx
import { Alert, Box, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import departmentOverview from '../classstructure/departmentOverview';

const AllClassesPage = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Get department codes from departmentOverview
      const departmentCodes = Object.keys(departmentOverview);
      setDepartments(departmentCodes);
      setFilteredDepartments(departmentCodes);
    } catch (error) {
      setError('Failed to fetch departments.');
      console.error('Error fetching departments:', error);
    }
  }, []);

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
        backgroundColor: '#E4E2DD', // Light background color
        color: '#571CE0', // Purple text color
        textAlign: 'center',
        fontFamily: 'SF Pro Display, sans-serif',
        padding: '20px'
      }}
    >
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, width: '100%' }}>
          <Typography variant="h4" gutterBottom>
            All Departments at <span style={{ color: 'green' }}>Dartmouth</span>
          </Typography>
          <TextField 
            variant="outlined" 
            placeholder="Search Department" 
            value={searchTerm} 
            onChange={handleSearch} 
            sx={{ 
              width: '300px',
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
                borderRadius: '20px', // Make the corners round
                height: '40px', // Reduce the height of the input
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
        {error && <Alert severity="error">{error}</Alert>}
        {filteredDepartments.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#E4E2DD', mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Code</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Department Name</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Undergrad Courses</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDepartments.map((department, index) => (
                  <TableRow
                    key={index}
                    component={Link}
                    to={`/departments/${department}`}
                    sx={{
                      '&:nth-of-type(odd)': { backgroundColor: '#F5F5F5' },
                      '&:hover': { backgroundColor: '#D3D3D3' },
                      cursor: 'pointer',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{department}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{departmentOverview[department]?.name || department}</TableCell>
                    <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{departmentOverview[department]?.courses || 'N/A'}</TableCell>
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
