import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Chip,
  Divider,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import { useMediaQuery } from '@mui/material';
import { getCoursesByPeriod } from '../services/courseDataService';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

const LayupsByTiming = ({darkMode}) => {
  const [timeSlotCourses, setTimeSlotCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("10A");
  const [selectedTerm, setSelectedTerm] = useState("spring");
  const [selectedDistribs, setSelectedDistribs] = useState([]);
  const [distribs, setDistribs] = useState([]);
  const [filterApplied, setFilterApplied] = useState(false);
  
  const isMobile = useMediaQuery('(max-width:600px)');
  
  // Use refs to track current values without triggering effects
  const periodRef = useRef(selectedPeriod);
  const termRef = useRef(selectedTerm);
  const distribsRef = useRef(selectedDistribs);
  const didMountRef = useRef(false);
  
  // Prevent renders from creating infinite loops
  const isUpdatingRef = useRef(false);
  
  // Moved this to useMemo to prevent recreation on every render
  const periodCodeToTiming = useMemo(() => ({
    "11": "MWF 11:30-12:35, Tu 12:15-1:05",
    "10": "MWF 10:10-11:15, Th 12:15-1:05",
    "2": "MWF 2:10-3:15, Th 1:20-2:10",
    "3A": "MW 3:30-5:20, M 5:30-6:20",
    "12": "MWF 12:50-1:55, Tu 1:20-2:10",
    "2A": "TuTh 2:25-4:15, W 5:30-6:20",
    "10A": "TuTh 10:10-12, F 3:30-4:20",
    "9L": "MWF 8:50-9:55, Th 9:05-9:55",
    "9S": "MTuWThF 9:05-9:55",
    "6A": "MTh 6:30-8:20, Tu 6:30-7:20",
    "6B": "W 6:30-9:30, Tu 7:30-8:20",
    "8S": "MTThF 7:45-8:35, Wed 7:45-8:35",
  }), []);

  // Fetch distribs for the filter dropdowns
  const fetchDistribs = useCallback(async () => {
    try {
      const q = query(collection(db, 'courses'));
      const querySnapshot = await getDocs(q);

      // Extract distribs
      const distribsData = querySnapshot.docs.flatMap((doc) => {
        const distribField = doc.data().distribs;
        if (typeof distribField === 'string') {
          return distribField.split(',').map((distrib) => distrib.trim());
        }
        return [];
      });
      const uniqueDistribs = [...new Set(distribsData)].filter(Boolean).sort();
      setDistribs(uniqueDistribs);
    } catch (error) {
      console.error('Error fetching distribs:', error);
      setError('Failed to fetch filter options. Please try again later.');
    }
  }, []);

  // Fetch data function that doesn't depend on state values
  const fetchData = useCallback(async (periodCode, term, distribs) => {
    if (isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;
      setLoading(true);
      setError(null);

      let data = await getCoursesByPeriod(periodCode, periodCodeToTiming, term);
      
      // Apply additional filters in memory if distribs are selected
      if (distribs.length > 0) {
        data = data.filter(course => {
          // Handle both array and string formats for distribs
          let courseDistribs = [];
          if (Array.isArray(course.distribs)) {
            courseDistribs = course.distribs;
          } else if (typeof course.distribs === 'string') {
            courseDistribs = course.distribs.split(',').map(d => d.trim());
          } else {
            return false; // No distribs data available
          }
          
          return distribs.some(d => courseDistribs.includes(d));
        });
        setFilterApplied(true);
      }
      
      if (distribs.length === 0) {
        setFilterApplied(false);
      }
      
      setTimeSlotCourses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses. Please try again later.');
      setLoading(false);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [periodCodeToTiming]);

  // This effect runs only once after the component mounts
  useEffect(() => {
    fetchDistribs();
    fetchData("10A", "spring", []);
    didMountRef.current = true;
  }, [fetchData, fetchDistribs]);
  
  // Update refs when state changes, without triggering effects
  useEffect(() => {
    periodRef.current = selectedPeriod;
  }, [selectedPeriod]);
  
  useEffect(() => {
    termRef.current = selectedTerm;
  }, [selectedTerm]);

  useEffect(() => {
    distribsRef.current = selectedDistribs;
  }, [selectedDistribs]);
  
  // Handle filter changes
  const applyFilters = () => {
    if (!isUpdatingRef.current && didMountRef.current) {
      setTimeout(() => {
        fetchData(
          periodRef.current, 
          termRef.current,
          distribsRef.current
        );
      }, 0);
    }
  };
  
  // Handle period change 
  const handlePeriodChange = (event) => {
    if (isUpdatingRef.current) return;
    
    const period = event.target.value;
    setSelectedPeriod(period);
    applyFilters();
  };

  // Handle term change
  const handleTermChange = (event) => {
    if (isUpdatingRef.current) return;
    
    const term = event.target.value;
    setSelectedTerm(term);
    applyFilters();
  };

  // Handle distribs change (multiple selection)
  const handleDistribsChange = (event) => {
    if (isUpdatingRef.current) return;
    
    const distribs = event.target.value;
    setSelectedDistribs(distribs);
    setTimeout(() => applyFilters(), 0);
  };

  // Remove a single distrib from selection
  const handleRemoveDistrib = (distrib) => {
    setSelectedDistribs(prev => prev.filter(d => d !== distrib));
    setTimeout(() => applyFilters(), 0);
  };

  // Reset all filters
  const handleResetFilters = () => {
    if (isUpdatingRef.current) return;
    
    setSelectedDistribs([]);
    
    // Don't reset period and term, just distrib filters
    setTimeout(() => {
      fetchData(
        periodRef.current, 
        termRef.current,
        []
      );
    }, 0);
  };

  return (
    <>
      <Box sx={{ mb: 3 }}>
        
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Term selector */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel
                id="term-label"
                sx={{ color: darkMode ? '#fff' : '#00693E' }}
              >
                Term
              </InputLabel>
              <Select
                labelId="term-label"
                value={selectedTerm}
                label="Term"
                onChange={handleTermChange}
                sx={{
                  backgroundColor: darkMode ? '#1C1F43' : '#F0F4FF',
                  borderRadius: '8px',
                  color: darkMode ? '#fff' : '#333',
                  '&:hover': { backgroundColor: darkMode ? '#24273c' : '#E0E7FF' },
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
              >
                <MenuItem
                  value="spring"
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : undefined,
                    color: darkMode ? '#fff' : undefined,
                  }}
                >
                  Spring 2026
                </MenuItem>
                <MenuItem
                  value="winter"
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : undefined,
                    color: darkMode ? '#fff' : undefined,
                  }}
                >
                  Winter 2026
                </MenuItem>
                <MenuItem
                  value="fall"
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : undefined,
                    color: darkMode ? '#fff' : undefined,
                  }}
                >
                  Fall 2025
                </MenuItem>
                <MenuItem
                  value="summer"
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : undefined,
                    color: darkMode ? '#fff' : undefined,
                  }}
                >
                  Summer 2025
                </MenuItem>
                <MenuItem
                  value="spring25"
                  sx={{
                    backgroundColor: darkMode ? '#1C1F43' : undefined,
                    color: darkMode ? '#fff' : undefined,
                  }}
                >
                  Spring 2025
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Period selector */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel
                id="period-label"
                sx={{ color: darkMode ? '#fff' : '#00693E' }}
              >
                Period
              </InputLabel>
              <Select
                labelId="period-label"
                value={selectedPeriod}
                label="Period"
                onChange={handlePeriodChange}
                sx={{
                  backgroundColor: darkMode ? '#1C1F43' : '#F0F4FF',
                  borderRadius: '8px',
                  color: darkMode ? '#fff' : '#333',
                  '&:hover': { backgroundColor: darkMode ? '#24273c' : '#E0E7FF' },
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
              >
                {Object.entries(periodCodeToTiming).map(([code, timing]) => (
                  <MenuItem
                    key={code}
                    value={code}
                    sx={{
                      backgroundColor: darkMode ? '#1C1F43' : undefined,
                      color: darkMode ? '#fff' : undefined,
                    }}
                  >
                    {`Period ${code} (${timing})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Distribs selector (multiple) */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel 
                id="distribs-label"
                sx={{ color: darkMode ? '#fff' : '#00693E' }}
              >
                Distribs
              </InputLabel>
              <Select
                labelId="distribs-label"
                id="distribs-multiple-checkbox"
                multiple
                value={selectedDistribs}
                onChange={handleDistribsChange}
                input={<OutlinedInput label="Distribs" />}
                renderValue={(selected) => 
                  selected.length > 1 
                    ? `${selected.length} distribs selected` 
                    : selected[0] || "All Distribs"
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                      width: 250,
                      backgroundColor: darkMode ? '#1C1F43' : undefined,
                    }
                  }
                }}
                sx={{
                  backgroundColor: darkMode ? '#1C1F43' : '#F0F4FF',
                  borderRadius: '8px',
                  color: darkMode ? '#fff' : '#333',
                  '&:hover': { backgroundColor: darkMode ? '#24273c' : '#E0E7FF' },
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
              >
                {distribs.map((distrib) => (
                  <MenuItem 
                    key={distrib} 
                    value={distrib}
                    sx={{
                      backgroundColor: darkMode ? '#1C1F43' : undefined,
                      color: darkMode ? '#fff' : undefined,
                    }}
                  >
                    <Checkbox 
                      checked={selectedDistribs.indexOf(distrib) > -1}
                      sx={{
                        color: darkMode ? '#03dac6' : undefined,
                        '&.Mui-checked': {
                          color: darkMode ? '#03dac6' : undefined,
                        }
                      }}  
                    />
                    <ListItemText 
                      primary={distrib}
                      primaryTypographyProps={{
                        color: darkMode ? '#fff' : undefined,
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Active filters display */}
        {selectedDistribs.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: darkMode ? '#ccc' : '#666' }}>
              Active filters:
            </Typography>
            
            {selectedDistribs.map(distrib => (
              <Chip 
                key={distrib}
                label={`Distrib: ${distrib}`} 
                onDelete={() => handleRemoveDistrib(distrib)}
                color="secondary"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: darkMode ? '#03dac6' : undefined,
                  color: darkMode ? '#03dac6' : undefined,
                }}
              />
            ))}
            
            {selectedDistribs.length > 0 && (
              <Chip 
                label="Reset Filters" 
                onClick={handleResetFilters}
                color="error"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: darkMode ? '#cf6679' : undefined,
                  color: darkMode ? '#cf6679' : undefined,
                }}
              />
            )}
          </Box>
        )}
        
        <Divider sx={{ my: 2, borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress sx={{ color: '#00693E' }} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : timeSlotCourses.length > 0 ? (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
            borderRadius: '10px',
            boxShadow: darkMode
              ? '0 2px 8px rgba(255, 255, 255, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '10px',
            overflowX: 'auto',
            flex: '3',
            transition: 'background-color 0.3s ease',
          }}
        >
          <Table sx={{ minWidth: isMobile ? '100%' : '650px' }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color: darkMode ? '#fff' : 'black',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '12px 10px',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                    width: '5%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  sx={{
                    color: darkMode ? '#A5A5FF' : 'black',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '12px 20px',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                    width: '15%',
                  }}
                >
                  Course
                </TableCell>
                <TableCell
                  sx={{
                    color: darkMode ? '#fff' : 'black',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '12px 20px',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                    width: '40%',
                  }}
                >
                  Title
                </TableCell>
                <TableCell
                  sx={{
                    color: darkMode ? '#fff' : 'black',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '12px 20px',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                    width: '25%',
                  }}
                >
                  Professor
                </TableCell>
                <TableCell
                  sx={{
                    color: darkMode ? '#fff' : 'black',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '1rem',
                    padding: '10px',
                    borderBottom: darkMode ? '2px solid #444444' : '2px solid #E0E0E0',
                    width: '15%',
                  }}
                >
                  Layup Score
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timeSlotCourses.map((course, index) => (
                <TableRow
                  key={course.id}
                  component={Link}
                  to={`/departments/${course.subj}/courses/${course.courseId}`}
                  sx={{
                    backgroundColor:
                      index % 2 === 0
                        ? darkMode
                          ? '#1C1F43'
                          : '#F8F8F8'
                        : darkMode
                        ? '#24273c'
                        : '#FFFFFF',
                    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      backgroundColor: darkMode ? '#2a2a2a' : '#E9E9E9',
                      boxShadow: darkMode
                        ? '0 2px 6px rgba(255, 255, 255, 0.1)'
                        : '0 2px 6px rgba(0, 0, 0, 0.1)',
                    },
                    cursor: 'pointer',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderRadius: '6px',
                  }}
                >
                  <TableCell
                    sx={{
                      color: darkMode ? '#fff' : '#000',
                      fontWeight: 600,
                      padding: '10px',
                      fontSize: '0.95rem',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                      width: '5%',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {index + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: darkMode ? '#A5A5FF' : '#571ce0',
                      padding: '10px 20px',
                      fontSize: '0.95rem',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                      fontWeight: 500,
                      width: '15%',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {`${course.subj} ${course.num}`}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: darkMode ? '#ccc' : '#333',
                      padding: '10px 20px',
                      fontSize: '0.95rem',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                      width: '40%',
                    }}
                  >
                    {course.title}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: darkMode ? '#ccc' : '#333',
                      padding: '10px 20px',
                      fontSize: '0.95rem',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                      width: '25%',
                    }}
                  >
                    {course.instructor}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        course.layup >= 4
                          ? '#34C759'
                          : course.layup >= 3
                          ? '#007AFF'
                          : '#FF3B30',
                      padding: isMobile ? '8px' : '10px',
                      fontSize: '0.95rem',
                      textAlign: 'center',
                      borderBottom: darkMode ? '1px solid #444444' : '1px solid #E0E0E0',
                      fontWeight: 500,
                      width: '15%',
                    }}
                  >
                    {course.layup.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper
          sx={{
            backgroundColor: darkMode ? '#1C1F43' : '#FFFFFF',
            borderRadius: '10px',
            boxShadow: darkMode
              ? '0 2px 8px rgba(255, 255, 255, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '20px',
            textAlign: 'center'
          }}
        >
          <Typography 
            sx={{ 
              color: darkMode ? '#fff' : '#333', 
              fontFamily: 'SF Pro Display, sans-serif',
              mb: 1
            }}
          >
            {selectedTerm === "spring" 
              ? filterApplied 
                ? "No courses match your current distrib filter" 
                : "Select a period to see the biggest layups in that Spring term time slot"
              : selectedPeriod 
                ? filterApplied
                  ? "No courses match your current distrib filter"
                  : `No layup courses found for period ${selectedPeriod} in the ${selectedTerm} term` 
                : `Select a period to see the biggest layups in that ${selectedTerm} term time slot`}
          </Typography>
          {(filterApplied || (selectedTerm === "summer" && selectedPeriod)) && (
            <Typography 
              sx={{ 
                color: darkMode ? '#ccc' : '#666', 
                fontFamily: 'SF Pro Display, sans-serif',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}
            >
              Try different distrib combinations or {" "}
              <Box 
                component="span" 
                sx={{ 
                  color: darkMode ? '#cf6679' : '#d32f2f',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  '&:hover': {
                    opacity: 0.8,
                  }
                }}
                onClick={handleResetFilters}
              >
                reset filters
              </Box>
            </Typography>
          )}
        </Paper>
      )}
    </>
  );
};

export default LayupsByTiming;