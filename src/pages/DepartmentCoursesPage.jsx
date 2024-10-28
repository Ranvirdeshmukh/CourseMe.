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
  useMediaQuery,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Slider,
  Checkbox,
  Button,
  Popover,
  FormGroup,
} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import departmentMapping from '../classstructure/departmentMapping';

const CACHE_PREFIX = 'courses_';
const CACHE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const DepartmentCoursesPage = () => {
  const { department } = useParams();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Filter States
  const [sortOption, setSortOption] = useState('level'); // 'level', 'alphabetical', 'layup'
  const [layupVotes, setLayupVotes] = useState([-300, 300]); // Range for Layup votes
  const [withReviewsOnly, setWithReviewsOnly] = useState(false); // Show only courses with reviews
  const [selectedDistribs, setSelectedDistribs] = useState([]); // For filtering by distribution categories
  const [qualityFilter, setQualityFilter] = useState([-100, 300]); // Range for Quality filter

  // Popover state
  const [anchorEl, setAnchorEl] = useState(null);

  // Fetch and Cache Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), where('department', '==', department));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCourses(coursesData);
          setFilteredCourses(coursesData); // Initialize filteredCourses

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
        setFilteredCourses(cachedData.courses);
        setLoading(false);
      } else {
        fetchCourses();
      }
    };

    checkCache();
  }, [department]);

  // Apply Filters Whenever Filter States Change
  useEffect(() => {
    const applyFilters = () => {
      let updatedCourses = [...courses];

      // Filter by Layup Votes
      updatedCourses = updatedCourses.filter(course => 
        course.layup >= layupVotes[0] && course.layup <= layupVotes[1]
      );

      // Filter by Reviews
      if (withReviewsOnly) {
        updatedCourses = updatedCourses.filter(course => course.numOfReviews > 0);
      }

      // Filter by Distribs
      if (selectedDistribs.length > 0) {
        updatedCourses = updatedCourses.filter(course => 
          selectedDistribs.some(distrib => course.distribs.includes(distrib))
        );
      }

      // Filter by Quality
      updatedCourses = updatedCourses.filter(course => 
        course.quality >= qualityFilter[0] && course.quality <= qualityFilter[1]
      );

      // Apply Sorting
      switch (sortOption) {
        case 'level':
          // Assuming 'level' is a numeric field in course data
          updatedCourses.sort((a, b) => a.level - b.level);
          break;
        case 'alphabetical':
          updatedCourses.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'layup':
          updatedCourses.sort((a, b) => b.layup - a.layup);
          break;
        default:
          break;
      }

      setFilteredCourses(updatedCourses);
    };

    applyFilters();
  }, [courses, sortOption, layupVotes, withReviewsOnly, selectedDistribs, qualityFilter]);

  // Handler for Layup Votes Slider
  const handleLayupVotesChange = (event, newValue) => {
    setLayupVotes(newValue);
  };

  // Handler for Quality Slider
  const handleQualityFilterChange = (event, newValue) => {
    setQualityFilter(newValue);
  };

  // Handler for Distribs change
  const handleDistribsChange = (event) => {
    const value = event.target.value;
    setSelectedDistribs(prev => 
      prev.includes(value) ? prev.filter(distrib => distrib !== value) : [...prev, value]
    );
  };

  // Toggle Popover
  const handleFilterOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const popoverId = open ? 'filter-popover' : undefined;

  // Full Distribs categories with descriptions
  const distribOptions = [
    { label: 'ART', value: 'ART' },
    { label: 'LIT', value: 'LIT' },
    { label: 'TMV', value: 'TMV' },
    { label: 'INT', value: 'INT' },
    { label: 'SOC', value: 'SOC' },
    { label: 'QDS', value: 'QDS' },
    { label: 'SCI/SLA', value: 'SCI/SLA' },
    { label: 'TAS/TLA', value: 'TAS/TLA' },
  ];

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
          <Typography 
            variant="h3" 
            align='left'
            sx={{ 
              fontWeight: 600, 
              fontFamily: 'SF Pro Display, sans-serif', 
              color: '#571CE0',
              marginBottom: '20px',
              marginTop: '0px'
            }}
          >
            Courses in {departmentMapping[department]?.name || department}
          </Typography>

          {/* Button to Open Filters */}
          <Button 
            aria-describedby={popoverId}
            variant="contained" 
            onClick={handleFilterOpen} 
            sx={{
              backgroundColor: '#ffffff',
              color: '#571CE0',
              borderRadius: '20px',
              padding: '10px 20px',
              fontWeight: 'bold',
              fontSize: '15px',
              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            Filter ⬍
          </Button>
        </Box>

        <Popover
  id={popoverId}
  open={open}
  anchorEl={anchorEl}
  onClose={handleFilterClose}
  anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'right',
  }}
  sx={{
    '.MuiPaper-root': {
      backgroundColor: '#ffffff', // White background
      borderRadius: '8px', // Smaller rounded corners
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)', // Even lighter shadow
      padding: '8px', // Reduced padding for compactness
      transition: 'all 0.2s ease-in-out',
      width: '180px', // Smaller width for a compact look
    },
  }}
>
  <Box sx={{ padding: '8px' }}>
    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Sort
    </Typography>
    <FormControl component="fieldset" sx={{ marginBottom: '8px' }}>
      <RadioGroup
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        sx={{
          '& .MuiFormControlLabel-root': {
            marginBottom: '6px', // Reduced spacing
          },
          '& .MuiTypography-root': {
            fontSize: '12px', // Smaller font for a more compact feel
          },
        }}
      >
        <FormControlLabel value="level" control={<Radio />} label="Level (low to high)" />
        <FormControlLabel value="alphabetical" control={<Radio />} label="Alphabetical" />
        <FormControlLabel value="layup" control={<Radio />} label="Layup votes (high to low)" />
      </RadioGroup>
    </FormControl>

    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Layup Votes
    </Typography>
    <Slider
      value={layupVotes}
      onChange={handleLayupVotesChange}
      valueLabelDisplay="auto"
      min={-300}
      max={300}
      sx={{
        marginBottom: '10px',
        '& .MuiSlider-thumb': {
          backgroundColor: '#571CE0',
          width: '10px', // Smaller thumb
          height: '10px',
        },
        '& .MuiSlider-track': {
          backgroundColor: '#571CE0',
          height: '3px',
        },
      }}
    />

    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Quality
    </Typography>
    <Slider
      value={qualityFilter}
      onChange={handleQualityFilterChange}
      valueLabelDisplay="auto"
      min={0}
      max={50}
      sx={{
        marginBottom: '10px',
        '& .MuiSlider-thumb': {
          backgroundColor: '#571CE0',
          width: '10px',
          height: '10px',
        },
        '& .MuiSlider-track': {
          backgroundColor: '#571CE0',
          height: '3px',
        },
      }}
    />

    <Typography variant="h6" sx={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px' }}>
      Distribs
    </Typography>
    <FormGroup sx={{ marginBottom: '10px' }}>
      {distribOptions.map((distrib) => (
        <FormControlLabel
          key={distrib.value}
          control={
            <Checkbox 
              checked={selectedDistribs.includes(distrib.value)} 
              onChange={handleDistribsChange} 
              value={distrib.value} 
              sx={{
                color: '#571CE0',
                padding: '4px', // Reduced padding around checkbox
              }}
            />
          }
          label={distrib.label}
          sx={{
            marginBottom: '6px',
            '& .MuiTypography-root': {
              fontSize: '12px', // Smaller font size
            },
          }}
        />
      ))}
    </FormGroup>

    <FormControlLabel
      control={
        <Checkbox 
          checked={withReviewsOnly} 
          onChange={(e) => setWithReviewsOnly(e.target.checked)} 
          sx={{
            color: '#571CE0',
            padding: '4px', // Reduced padding around checkbox
          }}
        />
      }
      label="With reviews only"
      sx={{
        '& .MuiTypography-root': {
          fontSize: '12px', // Smaller font size
        },
      }}
    />
  </Box>
</Popover>


        {/* Courses Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '200px' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredCourses.length > 0 ? (
          <TableContainer 
            component={Paper} 
            sx={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: '10px', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', 
              padding: '10px',
              overflowX: 'auto',
              flex: '3',
            }}
          >
            <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
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
                {filteredCourses.map((course, index) => (
                  <TableRow
                    key={course.id}
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
  {course.name ? 
    (course.name.includes(':') ? 
      course.name.split(':')[1].trim() : 
      course.name
    ) : 
    'Untitled Course'
  }
</TableCell>

{/* Also add a safety check for the distribs array mapping */}
{!isMobile && (
  <TableCell 
    sx={{ 
      color: '#333', 
      padding: '10px', 
      fontSize: '0.9rem', 
      textAlign: 'center', 
      borderBottom: '1px solid #E0E0E0',
      verticalAlign: 'middle',
      height: 'auto',
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
        alignItems: 'center',  
        height: '100%',
      }}
    >
      {(course.distribs ? course.distribs.split(',') : []).map((distrib, idx) => (
        <Box
          key={idx}
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
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'center',
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
