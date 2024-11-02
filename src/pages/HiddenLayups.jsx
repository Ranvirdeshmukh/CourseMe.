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
import { collection, query, getDocs, doc, updateDoc, increment, setDoc, getDoc, runTransaction, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { initializeHiddenLayups, getUserVotes } from './initializeHiddenLayups';
import CourseRecommendationDialog from '../components/CourseRecommendationDialog';
import AdminRecommendations from '../components/AdminRecommendations';
import { hiddenLayupCourseIds } from '../constants/hiddenLayupConstants';
import FilterControls from '../components/filtercontrols';

const HiddenLayups = () => {
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
  }, []);

  const initializeAndFetch = async (currentUser) => {
    setLoading(true);
    setError(null);
    try {
      // Get initial data
      const initialData = await initializeHiddenLayups();
      
      // Set up real-time listener for vote changes
      const unsubscribe = onSnapshot(
        collection(db, 'hidden_layups'),
        async (snapshot) => {
          try {
            // Get current vote counts
            const voteCounts = {};
            snapshot.docs.forEach(doc => {
              if (hiddenLayupCourseIds.includes(doc.id)) {
                voteCounts[doc.id] = {
                  yes_count: doc.data().yes_count || 0,
                  no_count: doc.data().no_count || 0
                };
              }
            });

            // Get user votes in parallel
            const userVotesPromises = hiddenLayupCourseIds.map(async courseId => {
              const vote = await getUserVotes(courseId, currentUser.uid);
              return [courseId, vote];
            });
            
            const userVotes = await Promise.all(userVotesPromises);
            const userVotesMap = Object.fromEntries(userVotes);

            // Combine all data
            const combinedData = hiddenLayupCourseIds
              .map(id => initialData[id])
              .filter(Boolean)
              .map(course => ({
                ...course,
                yes_count: voteCounts[course.id]?.yes_count || 0,
                no_count: voteCounts[course.id]?.no_count || 0,
                userVote: userVotesMap[course.id] || null
              }));

            setHiddenLayups(combinedData);
            setLoading(false);
          } catch (err) {
            console.error('Error processing snapshot:', err);
            setError('Error updating votes. Please refresh the page.');
          }
        },
        (error) => {
          console.error('Error in vote subscription:', error);
          setError('Failed to get real-time updates. Please refresh the page.');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Error initializing hidden layups:', err);
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

    setError(null);
    try {
      await runTransaction(db, async (transaction) => {
        const layupRef = doc(db, 'hidden_layups', id);
        const userVoteRef = doc(db, 'hidden_layups', id, 'votes', user.uid);
        
        const layupDoc = await transaction.get(layupRef);
        const userVoteDoc = await transaction.get(userVoteRef);

        if (!layupDoc.exists()) {
          throw new Error("Hidden layup document does not exist!");
        }

        const previousVote = userVoteDoc.exists() ? userVoteDoc.data().vote : null;
        let updates = {};

        if (previousVote === null) {
          updates[`${voteType}_count`] = increment(1);
        } else if (previousVote !== (voteType === 'yes')) {
          updates[`${voteType}_count`] = increment(1);
          updates[`${previousVote ? 'yes' : 'no'}_count`] = increment(-1);
        } else {
          updates[`${voteType}_count`] = increment(-1);
          transaction.delete(userVoteRef);
          transaction.update(layupRef, updates);
          return;
        }

        transaction.update(layupRef, updates);
        transaction.set(userVoteRef, {
          vote: voteType === 'yes',
          userName: user.displayName || user.email || user.uid,
          timestamp: new Date()
        });
      });

      // Update local state
      setHiddenLayups(prevLayups => 
        prevLayups.map(layup => {
          if (layup.id === id) {
            let newYesCount = layup.yes_count || 0;
            let newNoCount = layup.no_count || 0;
            
            if (layup.userVote === null) {
              voteType === 'yes' ? newYesCount++ : newNoCount++;
            } else if (layup.userVote !== (voteType === 'yes')) {
              if (voteType === 'yes') {
                newYesCount++;
                newNoCount--;
              } else {
                newYesCount--;
                newNoCount++;
              }
            } else {
              voteType === 'yes' ? newYesCount-- : newNoCount--;
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
        })
      );
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to submit vote. Please try again.');
    }
  };

  const calculatePercentage = (yes, no) => {
    const total = yes + no;
    return total > 0 ? (yes / total) * 100 : 50;
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
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
    <Box>
      <Typography variant="h3" gutterBottom sx={{ color: '#34495e', fontWeight: 600 }}>
        Hidden Gems for Winter '25 💎
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: '#7f8c8d' }}>
        Based on our surveys, these courses are potential "hidden layups" at Dartmouth. 
        Do you agree? Vote to help other students discover these gems!
      </Typography>
    </Box>
    {user && (
      <Button 
        onClick={() => setRecommendationOpen(true)}
        variant="contained"
        sx={{ 
          backgroundColor: '#f6f6f6',
          color: '#000000',
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
                    border: '1px solid #ecf0f1',
                    borderRadius: '12px',
                    padding: '20px',
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
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
                          color: '#2c3e50',
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

                    {/* Distribs and Layup Score - Made more responsive */}
                    <Box sx={{ 
                      mb: 3,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      alignItems: 'center'
                    }}>
                      {layup.distribs && layup.distribs.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {layup.distribs.map((distrib, index) => (
                            <Typography 
                              key={index} 
                              sx={{ 
                                backgroundColor: '#e8f5e9',
                                color: '#2e7d32',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 500
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
                            backgroundColor: '#e3f2fd',
                            color: '#1565c0',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            marginLeft: 'auto'
                          }}
                        >
                          Layup: {Math.round(layup.layup)}
                        </Typography>
                      )}
                    </Box>

                    {/* Vote Progress Bar */}
                    <Tooltip title={`Yes: ${yesPercentage.toFixed(1)}% | No: ${noPercentage.toFixed(1)}%`} arrow>
                      <Box sx={{ width: '100%', mb: 2 }}>
                        <Box sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#f6f6f6',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${yesPercentage}%`,
                            backgroundColor: '#00693E',
                            transition: 'width 0.3s ease'
                          }} />
                        </Box>
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 1
                        }}>
                          <Typography variant="caption" sx={{ color: '#00693E', fontWeight: 500 }}>
                            Yes: {yesCount}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#e74c3c', fontWeight: 500 }}>
                            No: {noCount}
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  </Box>

                  {/* Vote Buttons - Improved styling */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mt: 'auto', 
                    pt: 2
                  }}>
                    <Button 
                      variant="contained"
                      onClick={(e) => {
                        e.preventDefault();
                        handleVote(layup.id, 'yes');
                      }}
                      sx={{ 
                        flex: 1,
                        py: 1.5,
                        backgroundColor: layup.userVote === true ? '#00693E' : '#f6f6f6',
                        color: layup.userVote === true ? '#ffffff' : '#34495e',
                        '&:hover': {
                          backgroundColor: '#571ce0',
                          color: '#ffffff',
                        },
                        borderRadius: '8px',
                        fontWeight: 600
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
                        backgroundColor: layup.userVote === false ? '#00693E' : '#f6f6f6',
                        color: layup.userVote === false ? '#ffffff' : '#34495e',
                        '&:hover': {
                          backgroundColor: '#c0392b',
                          color: '#ffffff',
                        },
                        borderRadius: '8px',
                        fontWeight: 600
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
    
            {/* Show More Button */}
            {!filters.department && !filters.distribs.length && 
              filters.layupScore === 0 && filters.approvalRate === 0 && 
              filteredLayups.length > visibleCount && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  onClick={handleShowMore}
                  sx={{ 
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '20px',
                    px: 3,
                    py: 1,
                    color: 'text.primary',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(87, 28, 224, 0.04)',
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
              <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                Showing {displayedLayups.length} of {filteredLayups.length} courses
              </Typography>
              {filteredLayups.length === 0 && (
                <Typography variant="body2" sx={{ color: '#e74c3c' }}>
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