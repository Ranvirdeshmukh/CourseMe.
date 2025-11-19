import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Container,
} from '@mui/material';
import { collection, doc, updateDoc, increment, setDoc, runTransaction, onSnapshot, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { hiddenLayupCourseIds } from '../constants/hiddenLayupConstants';
import CourseRecommendationDialog from '../components/CourseRecommendationDialog';
import AdminRecommendations from '../components/AdminRecommendations';
import FilterControls from '../components/filtercontrols';
import { getHiddenLayupsStaticData, subscribeToHiddenLayupsVotes, getUserVotesForHiddenLayups } from '../services/courseDataService';

// Helper functions and constants defined outside component to prevent recreation on renders

// Ensure each hidden layup course has a Firestore document
const ensureHiddenLayupDocsExist = async () => {
  console.log('[Layups Debug] Ensuring hidden layup documents exist for:', hiddenLayupCourseIds);
  
  let created = 0;
  let existing = 0;
  let failed = 0;
  
  for (const courseId of hiddenLayupCourseIds) {
    const docRef = doc(db, 'hidden_layups', courseId);
    try {
      // First check if the document exists
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log(`[Layups Debug] Document already exists for ${courseId}: ${JSON.stringify(docSnap.data())}`);
        existing++;
      } else {
        // Create the document with initial vote counts
        await setDoc(docRef, { yes_count: 0, no_count: 0 }, { merge: true });
        console.log(`[Layups Debug] Created new document for ${courseId}`);
        created++;
      }
    } catch (err) {
      console.error(`[Layups Debug] Error ensuring document for ${courseId}:`, err);
      failed++;
    }
  }
  
  console.log(`[Layups Debug] Document check complete: ${existing} existing, ${created} created, ${failed} failed`);
};

const HiddenLayups = ({darkMode}) => {
  const [hiddenLayups, setHiddenLayups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    distribs: [],
    layupScore: 0,
    approvalRate: 0
  });
  const [departments, setDepartments] = useState([]);
  const [allDistribs, setAllDistribs] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  
  // Calculate percentage helper function
  const calculatePercentage = (yes, no) => {
    const total = yes + no;
    return total > 0 ? (yes / total) * 100 : 50;
  };

  // Data fetching logic
  useEffect(() => {
    if (hiddenLayups.length > 0) {
      const depts = [...new Set(hiddenLayups.map(layup => layup.department))];
      const distribs = [...new Set(hiddenLayups.flatMap(layup => layup.distribs || []))];
      setDepartments(depts.sort());
      setAllDistribs(distribs.sort());
    }
  }, [hiddenLayups]);

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeVotes = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const setupData = async () => {
          unsubscribeVotes = await initializeAndFetch(currentUser);
        };
        setupData();
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeVotes) {
        unsubscribeVotes();
      }
    };
  }, []);  // We're not adding initializeAndFetch to deps because it would cause infinite loops

  const initializeAndFetch = async (currentUser) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Layups Debug] Starting initialization with course IDs:', hiddenLayupCourseIds);
      
      // Get initial static data using the service
      const staticData = await getHiddenLayupsStaticData(hiddenLayupCourseIds);
      console.log('[Layups Debug] Static data loaded:', Object.keys(staticData).length, 'courses');
      
      // Ensure hidden layup documents exist in Firestore
      await ensureHiddenLayupDocsExist();
      console.log('[Layups Debug] Ensured hidden layup documents exist');
      
      // Set up real-time listener for vote changes using the service
      const unsubscribe = subscribeToHiddenLayupsVotes(hiddenLayupCourseIds, async (voteCounts) => {
        try {
          console.log('[Layups Debug] Received vote counts:', voteCounts);
          
          // Get user votes in parallel using the service
          const userVotes = await getUserVotesForHiddenLayups(hiddenLayupCourseIds, currentUser.uid);
          console.log('[Layups Debug] Received user votes:', userVotes);
          
          // Combine static data with dynamic vote data
          const combinedData = hiddenLayupCourseIds
            .map(id => staticData[id])
            .filter(Boolean)
            .map(course => ({
              ...course,
              yes_count: voteCounts[course.id]?.yes_count || 0,
              no_count: voteCounts[course.id]?.no_count || 0,
              userVote: userVotes[course.id] || null
            }));

          console.log('[Layups Debug] Combined data prepared:', combinedData.length, 'courses');
          setHiddenLayups(combinedData);
          setLoading(false);
        } catch (err) {
          console.error('[Layups Debug] Error processing votes data:', err);
          setError('Error updating votes. Please refresh the page.');
          setLoading(false);
        }
      });

      console.log('[Layups Debug] Initialization complete');
      return unsubscribe;
    } catch (err) {
      console.error('[Layups Debug] Error initializing hidden layups:', err);
      setError('Failed to load hidden layups. Please try refreshing the page.');
      setLoading(false);
      return () => {};
    }
  };

  // Voting logic
  const handleVote = async (id, voteType) => {
    if (!user) {
      setError('You must be logged in to vote.');
      return;
    }

    console.log(`[Vote Debug] Starting vote: courseId=${id}, voteType=${voteType}, userId=${user.uid}`);
    setError(null);
    try {
      await runTransaction(db, async (transaction) => {
        const layupRef = doc(db, 'hidden_layups', id);
        const userVoteRef = doc(db, 'hidden_layups', id, 'votes', user.uid);
        
        const layupDoc = await transaction.get(layupRef);
        const userVoteDoc = await transaction.get(userVoteRef);

        if (!layupDoc.exists()) {
          console.error(`[Vote Debug] Hidden layup document does not exist: ${id}`);
          throw new Error("Hidden layup document does not exist!");
        }

        const previousVote = userVoteDoc.exists() ? userVoteDoc.data().vote : null;
        console.log(`[Vote Debug] Previous vote: ${previousVote}, new vote: ${voteType === 'yes'}`);
        
        let updates = {};

        if (previousVote === null) {
          // Case 1: First vote - increment the respective counter
          updates[`${voteType}_count`] = increment(1);
          console.log(`[Vote Debug] First vote: incrementing ${voteType}_count`);
          
          // Set the user vote document
          transaction.set(userVoteRef, {
            vote: voteType === 'yes',
            userName: user.displayName || user.email || user.uid,
            timestamp: new Date()
          });
        } else if (previousVote !== (voteType === 'yes')) {
          // Case 2: Changing vote - increment one counter and decrement the other
          updates[`${voteType}_count`] = increment(1);
          updates[`${previousVote ? 'yes' : 'no'}_count`] = increment(-1);
          console.log(`[Vote Debug] Changing vote: incrementing ${voteType}_count, decrementing ${previousVote ? 'yes' : 'no'}_count`);
          
          // Update the user vote document
          transaction.set(userVoteRef, {
            vote: voteType === 'yes',
            userName: user.displayName || user.email || user.uid,
            timestamp: new Date()
          });
        } else {
          // Case 3: Removing vote - decrement the counter and delete the vote doc
          updates[`${voteType}_count`] = increment(-1);
          console.log(`[Vote Debug] Removing vote: decrementing ${voteType}_count and deleting vote doc`);
          transaction.delete(userVoteRef);
        }

        // Apply the updates to the layup document in all cases
        transaction.update(layupRef, updates);
        console.log(`[Vote Debug] Updates applied:`, updates);
      });

      console.log(`[Vote Debug] Transaction completed successfully`);

      // Update local state
      setHiddenLayups(prevLayups => {
        const updatedLayups = prevLayups.map(layup => {
          if (layup.id === id) {
            let newYesCount = layup.yes_count || 0;
            let newNoCount = layup.no_count || 0;
            
            if (layup.userVote === null) {
              voteType === 'yes' ? newYesCount++ : newNoCount++;
              console.log(`[Vote Debug] Updating UI - first vote: ${voteType}, new counts: yes=${newYesCount}, no=${newNoCount}`);
            } else if (layup.userVote !== (voteType === 'yes')) {
              if (voteType === 'yes') {
                newYesCount++;
                newNoCount--;
              } else {
                newYesCount--;
                newNoCount++;
              }
              console.log(`[Vote Debug] Updating UI - changing vote: ${voteType}, new counts: yes=${newYesCount}, no=${newNoCount}`);
            } else {
              voteType === 'yes' ? newYesCount-- : newNoCount--;
              console.log(`[Vote Debug] Updating UI - removing vote: ${voteType}, new counts: yes=${newYesCount}, no=${newNoCount}`);
              return { ...layup, yes_count: newYesCount, no_count: newNoCount, userVote: null };
            }
            
            return {
              ...layup,
              yes_count: newYesCount,
              no_count: newNoCount,
              userVote: voteType === 'yes'
            };
          }
          return layup;
        });

        console.log(`[Vote Debug] UI state updated`);
        return updatedLayups;
      });
    } catch (err) {
      console.error('[Vote Debug] Error during voting transaction:', err);
      setError('Failed to submit vote. Please try again.');
    }
  };

  // Handle showing more courses
  const handleShowMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  // Filter logic
  // Replace your existing filter logic with this:
const filteredLayups = hiddenLayups.filter(layup => {
  // Department filter
  if (filters.department && layup.department !== filters.department) return false;
  
  // Distribs filter
  if (filters.distribs.length > 0 && !filters.distribs.every(d => layup.distribs?.includes(d))) return false;
  
  // Layup score filter - handle negative values
  const layupScore = layup.layup ?? 0;
  if (filters.layupScore > 0 && layupScore < filters.layupScore) return false;
  
  // Approval rate filter
  const totalVotes = (layup.yes_count || 0) + (layup.no_count || 0);
  const approvalRate = totalVotes > 0 ? ((layup.yes_count || 0) / totalVotes) * 100 : 0;
  if (filters.approvalRate > 0 && approvalRate < filters.approvalRate) return false;
  
  return true;
});

// Update the display logic to handle all cases
const displayedLayups = !filters.department && !filters.distribs.length && 
  filters.layupScore === 0 && filters.approvalRate === 0
  ? filteredLayups.slice(0, visibleCount)
  : filteredLayups;

// Add this debugging console log
console.log('Filtering debug:', {
  totalCourses: hiddenLayups.length,
  afterFiltering: filteredLayups.length,
  displayed: displayedLayups.length,
  filters,
  visibleCount,
  courses: displayedLayups.map(l => ({
    name: l.name,
    layup: l.layup,
    department: l.department
  }))
});
  // Loading and error states
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">Please log in to view and vote on hidden gems.</Alert>
      </Box>
    );
  }

  // Determine which layups to display

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                gutterBottom
                sx={{ color: darkMode ? '#fff' : '#34495e', fontWeight: 600 }}
              >
                Hidden Gems for Winter 25 💎
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 2, color: darkMode ? '#ccc' : '#7f8c8d' }}
              >
                Based on our surveys, these courses are potential "hidden layups" at Dartmouth. 
                Do you agree? Vote to help other students discover these gems!
              </Typography>
            </Box>
            {user && (
              <Button
                onClick={() => setRecommendationOpen(true)}
                variant="contained"
                sx={{
                  backgroundColor: darkMode ? '#2a2a2a' : '#f6f6f6',
                  color: darkMode ? '#fff' : '#000000',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  '&:hover': {
                    backgroundColor: '#571ce0',
                    color: '#ffffff',
                  },
                  height: 'fit-content',
                  ml: 2,
                  transition: 'background-color 0.3s, color 0.3s',
                }}
              >
                Recommend a Course
              </Button>
            )}
          </Box>
    
          <FilterControls
            departments={departments}
            distribs={allDistribs}
            filters={filters}
            setFilters={setFilters}
          />
        </Box>
        
        {/* Error Alert */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Course Grid - Improved card sizing and responsiveness */}
        <Grid container spacing={3}>
          {displayedLayups.map((layup) => {
            const yesCount = layup.yes_count || 0;
            const noCount = layup.no_count || 0;
            const yesPercentage = calculatePercentage(yesCount, noCount);
            const noPercentage = 100 - yesPercentage;
    
            return (
              <Grid item xs={12} sm={6} lg={4} key={layup.id}>
                <Box
                  sx={{
                    border: darkMode ? '1px solid #444' : '1px solid #ecf0f1',
                    borderRadius: '12px',
                    padding: '20px',
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: darkMode ? '#1C1F43' : '#ffffff',
                    '&:hover': {
                      boxShadow: darkMode
                        ? '0 8px 24px rgba(255,255,255,0.08)'
                        : '0 8px 24px rgba(0,0,0,0.08)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Box>
                    <Tooltip title={layup.name} arrow>
                      <Typography
                        variant="h6"
                        component={Link}
                        to={`/departments/${layup.department}/courses/${layup.id}`}
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          fontSize: '1.1rem',
                          textDecoration: 'none',
                          color: darkMode ? '#fff' : '#2c3e50',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.3,
                          height: '2.6em',
                        }}
                      >
                        {layup.name}
                      </Typography>
                    </Tooltip>
    
                    {/* Distribs and Layup Score */}
                    <Box
                      sx={{
                        mb: 3,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        alignItems: 'center',
                      }}
                    >
                      {layup.distribs && layup.distribs.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {layup.distribs.map((distrib, index) => (
                            <Typography
                              key={index}
                              sx={{
                                backgroundColor: darkMode ? '#333' : '#e8f5e9',
                                color: darkMode ? '#fff' : '#2e7d32',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                              }}
                            >
                              {distrib}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      {layup.layup !== undefined && (
                        <Typography
                          sx={{
                            backgroundColor: darkMode ? '#333' : '#e3f2fd',
                            color: darkMode ? '#fff' : '#1565c0',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            marginLeft: 'auto',
                          }}
                        >
                          Layup: {Math.round(layup.layup)}
                        </Typography>
                      )}
                    </Box>
    
                    {/* Vote Progress Bar */}
                    <Tooltip
                      title={`Yes: ${yesPercentage.toFixed(1)}% | No: ${noPercentage.toFixed(1)}%`}
                      arrow
                    >
                      <Box sx={{ width: '100%', mb: 2 }}>
                        <Box
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: darkMode ? '#2a2a2a' : '#f6f6f6',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              height: '100%',
                              width: `${yesPercentage}%`,
                              backgroundColor: '#00693E',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 1,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: darkMode ? '#fff' : '#00693E', fontWeight: 500 }}>
                            Yes: {yesCount}
                          </Typography>
                          <Typography variant="caption" sx={{ color: darkMode ? '#fff' : '#e74c3c', fontWeight: 500 }}>
                            No: {noCount}
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  </Box>
    
                  {/* Vote Buttons */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mt: 'auto',
                      pt: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={(e) => {
                        e.preventDefault();
                        handleVote(layup.id, 'yes');
                      }}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        backgroundColor: layup.userVote === true ? '#00693E' : darkMode ? '#2a2a2a' : '#f6f6f6',
                        color: layup.userVote === true ? '#ffffff' : darkMode ? '#fff' : '#34495e',
                        '&:hover': {
                          backgroundColor: '#571ce0',
                          color: '#ffffff',
                        },
                        borderRadius: '8px',
                        fontWeight: 600,
                      }}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="contained"
                      onClick={(e) => {
                        e.preventDefault();
                        handleVote(layup.id, 'no');
                      }}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        backgroundColor: layup.userVote === false ? '#00693E' : darkMode ? '#2a2a2a' : '#f6f6f6',
                        color: layup.userVote === false ? '#ffffff' : darkMode ? '#fff' : '#34495e',
                        '&:hover': {
                          backgroundColor: '#c0392b',
                          color: '#ffffff',
                        },
                        borderRadius: '8px',
                        fontWeight: 600,
                      }}
                    >
                      No
                    </Button>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
    
        {!filters.department &&
          !filters.distribs.length &&
          filters.layupScore === 0 &&
          filters.approvalRate === 0 &&
          filteredLayups.length > visibleCount && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                onClick={handleShowMore}
                sx={{
                  bgcolor: darkMode ? 'background.paper' : '#f6f6f6',
                  border: '1px solid',
                  borderColor: darkMode ? 'divider' : '#ecf0f1',
                  borderRadius: '20px',
                  px: 3,
                  py: 1,
                  color: darkMode ? 'text.primary' : '#34495e',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: darkMode ? 'rgba(87, 28, 224, 0.04)' : '#E9E9E9',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Show More
              </Button>
            </Box>
          )}
    
        {/* Results Summary */}
        <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: darkMode ? '#fff' : '#7f8c8d' }}>
            Showing {displayedLayups.length} of {filteredLayups.length} courses
          </Typography>
          {filteredLayups.length === 0 && (
            <Typography variant="body2" sx={{ color: darkMode ? '#e74c3c' : '#e74c3c' }}>
              No courses match your filters. Try adjusting your criteria.
            </Typography>
          )}
        </Box>
  
  
    
            
    
            {/* Dialogs and Admin Section */}
            <CourseRecommendationDialog
              open={recommendationOpen}
              onClose={() => setRecommendationOpen(false)}
              user={user}
            />
            
            {user?.isAdmin && (
              <Box sx={{ mt: 6, mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#34495e', fontWeight: 600 }}>
                  Pending Recommendations
                </Typography>
                <AdminRecommendations user={user} />
              </Box>
            )}
          </Box>
        </Container>
      );
    };
    
    export default HiddenLayups;