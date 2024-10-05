import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Alert, 
  Paper, 
  CircularProgress, 
  useMediaQuery
} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import departmentMapping from '../classstructure/departmentMapping';

const CACHE_PREFIX = 'courses_';
const CACHE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const DepartmentCoursesPage = () => {
  const { department } = useParams();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), where('department', '==', department));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCourses(coursesData);

          // Cache the data
          localStorage.setItem(`${CACHE_PREFIX}${department}`, JSON.stringify({
            timestamp: new Date().getTime(),
            courses: coursesData,
          }));
        } else {
          setError('No courses found for this department.');
        }
      } catch (error) {
        setError('Failed to fetch courses.');
      } finally {
        setLoading(false);
      }
    };

    const checkCache = () => {
      const cachedData = JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${department}`));
      const now = new Date().getTime();

      if (cachedData && (now - cachedData.timestamp < CACHE_EXPIRATION)) {
        setCourses(cachedData.courses);
        setLoading(false);
      } else {
        fetchCourses();
      }
    };

    checkCache();
  }, [department]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: '20px',
        fontFamily: 'SF Pro Display, sans-serif',
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
              color: '#571CE0',
              marginBottom: '0px',
              marginTop: '0px'
            }}
          >
            Courses in {departmentMapping[department]?.name || department}
          </Typography>
        </Box>

        {loading ? (
          <CircularProgress color="primary" />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : courses.length > 0 ? (
          <TableContainer 
  component={Paper} 
  sx={{ 
    backgroundColor: '#FFFFFF', 
    marginTop: '20px', 
    borderRadius: '10px', 
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
    padding: '10px',
    overflow: 'hidden' 
  }}
>
  <Table sx={{ minWidth: '650px' }}>
    <TableHead>
      <TableRow>
        <TableCell 
          sx={{ 
            color: 'black', 
            textAlign: 'left', 
            fontWeight: 600, 
            fontSize: '1rem', 
            padding: '12px 10px',
            borderBottom: '2px solid #E0E0E0',
            width: '15%', 
            whiteSpace: 'nowrap'
          }}
        >
          Course Code
        </TableCell>
        
        <TableCell 
          sx={{ 
            color: 'black', 
            textAlign: 'left', 
            fontWeight: 600, 
            fontSize: '1rem', 
            padding: '12px 20px',
            borderBottom: '2px solid #E0E0E0',
            width: '50%' 
          }}
        >
          Course Name
        </TableCell>

        {!isMobile && (
          <TableCell 
            sx={{ 
              color: 'black', 
              textAlign: 'center', 
              fontWeight: 600, 
              fontSize: '1rem', 
              padding: '10px', 
              borderBottom: '2px solid #E0E0E0' 
            }}
          >
            Distribs
          </TableCell>
        )}
        <TableCell 
          sx={{ 
            color: 'black', 
            textAlign: 'center', 
            fontWeight: 600, 
            fontSize: '1rem', 
            padding: '10px', 
            borderBottom: '2px solid #E0E0E0' 
          }}
        >
          Num of Reviews
        </TableCell>
        <TableCell 
          sx={{ 
            color: 'black', 
            textAlign: 'center', 
            fontWeight: 600, 
            fontSize: '1rem', 
            padding: '10px', 
            borderBottom: '2px solid #E0E0E0' 
          }}
        >
          Quality
        </TableCell>
        <TableCell 
          sx={{ 
            color: 'black', 
            textAlign: 'center', 
            fontWeight: 600, 
            fontSize: '1rem', 
            padding: '10px', 
            borderBottom: '2px solid #E0E0E0' 
          }}
        >
          Layup
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {courses.map((course, index) => (
        <TableRow
          key={index}
          component={Link}
          to={`/departments/${department}/courses/${course.id}`}
          sx={{
            backgroundColor: index % 2 === 0 ? '#F8F8F8' : '#FFFFFF',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              backgroundColor: '#E9E9E9',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)', 
            },
            cursor: 'pointer',
            textDecoration: 'none',
            color: 'inherit',
            borderRadius: '6px',
          }}
        >
          {/* Displaying Course Code */}
          <TableCell 
            sx={{ 
              color: '#000', 
              fontWeight: 600, 
              padding: '10px', 
              fontSize: '0.95rem', 
              borderBottom: '1px solid #E0E0E0',
              width: '15%', 
              whiteSpace: 'nowrap'
            }}
          >
            {`${course.department}${course.course_number}`}
          </TableCell>

          {/* Displaying Course Name */}
          <TableCell 
            sx={{ 
              color: '#333', 
              padding: '10px 20px',
              fontSize: '0.95rem', 
              borderBottom: '1px solid #E0E0E0',
              width: '50%'
            }}
          >
            {course.name.includes(':') ? course.name.split(':')[1].trim() : course.name}
          </TableCell>

          {/* Distribs */}
          {!isMobile && (
            <TableCell 
            sx={{ 
              color: '#333', 
              padding: '10px', 
              fontSize: '0.9rem', 
              textAlign: 'center', 
              borderBottom: '1px solid #E0E0E0',
              verticalAlign: 'middle', // Ensure content is vertically centered
              height: 'auto', // Ensure the height adjusts to content
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                gap: '5px', 
                justifyContent: 'center', 
                flexWrap: 'nowrap', 
                maxWidth: '200px',  
                whiteSpace: 'nowrap', 
                alignItems: 'center',  // Ensure distribs are aligned properly vertically
                height: '100%', // Make sure the box adapts to the cell's height
              }}
            >
              {course.distribs.split(',').map((distrib, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: '#F0F0F0',  
                    color: '#333',             
                    padding: '4px 10px',       
                    borderRadius: '20px',      
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', 
                    transition: 'background-color 0.2s ease',
                    lineHeight: '1.5',  // Adjust line height for better fit
                    display: 'flex',  // Ensure content inside the distrib box is aligned
                    alignItems: 'center',  // Center text vertically inside the distrib box
                    '&:hover': {
                      backgroundColor: '#E0E0E0', 
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  {distrib.trim()}
                </Box>
              ))}
            </Box>
          </TableCell>
          

          
          )}
          {/* Num of Reviews */}
          <TableCell 
            sx={{ 
              color: '#333', 
              padding: isMobile ? '8px' : '10px', 
              fontSize: '0.9rem', 
              textAlign: 'center', 
              borderBottom: '1px solid #E0E0E0' 
            }}
          >
            {course.numOfReviews}
          </TableCell>
          {/* Quality */}
          <TableCell 
            sx={{ 
              color: '#333', 
              padding: isMobile ? '8px' : '10px', 
              fontSize: '0.9rem', 
              textAlign: 'center', 
              borderBottom: '1px solid #E0E0E0' 
            }}
          >
            {course.quality}
          </TableCell>
          {/* Layup */}
          <TableCell 
            sx={{ 
              color: '#333', 
              padding: isMobile ? '8px' : '10px', 
              fontSize: '0.9rem', 
              textAlign: 'center', 
              borderBottom: '1px solid #E0E0E0' 
            }}
          >
            {course.layup}
          </TableCell>
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

export default DepartmentCoursesPage;
