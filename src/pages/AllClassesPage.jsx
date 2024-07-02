// src/pages/AllClassesPage.jsx
import { Alert, Box, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import departmentOverview from '../classstructure/departmentOverview';

const AllClassesPage = () => {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Get department codes from departmentOverview
      const departmentCodes = Object.keys(departmentOverview);
      setDepartments(departmentCodes);
    } catch (error) {
      setError('Failed to fetch departments.');
      console.error('Error fetching departments:', error);
    }
  }, []);

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
        <Typography variant="h4" gutterBottom>All Classes</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {departments.length > 0 ? (
          <TableContainer component={Paper} sx={{ backgroundColor: '#E4E2DD', margin: '20px 0' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Code</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Department Name</TableCell>
                  <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Undergrad Courses</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((department, index) => (
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


// import React, { useEffect, useState } from 'react';
// import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Paper } from '@mui/material';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../firebase';
// import { Link } from 'react-router-dom';
// import departmentOverview from '../classstructure/departmentOverview';

// const AllClassesPage = () => {
//   const [departments, setDepartments] = useState([]);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(db, 'courses'));
//         const coursesData = querySnapshot.docs.map(doc => doc.data());

//         const departmentSet = new Set();
//         coursesData.forEach(course => departmentSet.add(course.department));
//         setDepartments([...departmentSet]);
//       } catch (error) {
//         setError('Failed to fetch departments.');
//         console.error('Error fetching departments:', error);
//       }
//     };

//     fetchData();
//   }, []);

//   return (
//     <Box
//       sx={{
//         minHeight: '100vh',
//         display: 'flex',
//         flexDirection: 'column',
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#E4E2DD', // Light background color
//         color: '#571CE0', // Purple text color
//         textAlign: 'center',
//         fontFamily: 'SF Pro Display, sans-serif',
//         padding: '20px'
//       }}
//     >
//       <Container>
//         <Typography variant="h4" gutterBottom></Typography>
//         {error && <Alert severity="error">{error}</Alert>}
//         {departments.length > 0 ? (
//           <TableContainer component={Paper} sx={{ backgroundColor: '#E4E2DD', margin: '20px 0' }}>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Code</TableCell>
//                   <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Department Name</TableCell>
//                   <TableCell sx={{ color: '#571CE0', textAlign: 'center', fontWeight: 'bold' }}>Undergrad Courses</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {departments.map((department, index) => (
//                   <TableRow
//                     key={index}
//                     component={Link}
//                     to={`/departments/${department}`}
//                     sx={{
//                       '&:nth-of-type(odd)': { backgroundColor: '#F5F5F5' },
//                       '&:hover': { backgroundColor: '#D3D3D3' },
//                       cursor: 'pointer',
//                       textDecoration: 'none',
//                       color: 'inherit'
//                     }}
//                   >
//                     <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{department}</TableCell>
//                     <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{departmentOverview[department]?.name || department}</TableCell>
//                     <TableCell sx={{ color: '#571CE0', padding: '10px', textAlign: 'center' }}>{departmentOverview[department]?.courses || 'N/A'}</TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         ) : (
//           <Typography>No departments available</Typography>
//         )}
//       </Container>
//     </Box>
//   );
// };

// export default AllClassesPage;
