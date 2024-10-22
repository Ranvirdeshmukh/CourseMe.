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
import { collection, query, getDocs, doc, updateDoc, increment, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { initializeHiddenLayups } from './initializeHiddenLayups';
// Update these import lines at the top of HiddenLayups.jsx
import CourseRecommendationDialog from '../components/CourseRecommendationDialog';
import AdminRecommendations from '../components/AdminRecommendations';
import { hiddenLayupCourseIds } from '../constants/hiddenLayupConstants';



const HiddenLayups = () => {
  const [hiddenLayups, setHiddenLayups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [recommendationOpen, setRecommendationOpen] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        initializeAndFetch(currentUser);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const initializeAndFetch = async (currentUser) => {
    try {
      await initializeHiddenLayups();
      await fetchHiddenLayups(currentUser);
    } catch (err) {
      console.error('Error initializing or fetching hidden layups:', err);
      setError('Failed to load hidden layups. Please try refreshing the page.');
      setLoading(false);
    }
  };

// Fetch hidden layups based on the specified list of course IDs
const fetchHiddenLayups = async (currentUser) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'hidden_layups'));
      const querySnapshot = await getDocs(q);

      // Filter the fetched data to only include courses in the hiddenLayupCourseIds list
      const layupsData = await Promise.all(querySnapshot.docs
        .filter(doc => hiddenLayupCourseIds.includes(doc.id))
        .map(async doc => {
          const data = doc.data();
          const userVote = currentUser ? await getUserVote(doc.id, currentUser.uid) : null;
          return {
            id: doc.id,
            ...data,
            userVote
          };
        })
      );

      setHiddenLayups(layupsData);
    } catch (err) {
      console.error('Error fetching hidden layups:', err);
      setError('Failed to fetch hidden layups. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  

  const getUserVote = async (courseId, userId) => {
    if (!userId) return null;
    try {
      const voteDoc = await getDoc(doc(db, 'hidden_layups', courseId, 'votes', userId));
      return voteDoc.exists() ? voteDoc.data().vote : null;
    } catch (err) {
      console.error('Error fetching user vote:', err);
      return null;
    }
  };

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

        const layupData = layupDoc.data();
        const previousVote = userVoteDoc.exists() ? userVoteDoc.data().vote : null;

        let updates = {};

        if (previousVote === null) {
          // New vote
          updates[`${voteType}_count`] = increment(1);
        } else if (previousVote !== (voteType === 'yes')) {
          // Changed vote
          updates[`${voteType}_count`] = increment(1);
          updates[`${previousVote ? 'yes' : 'no'}_count`] = increment(-1);
        } else {
          // User is trying to vote the same way again, remove the vote
          updates[`${voteType}_count`] = increment(-1);
          transaction.delete(userVoteRef);
          transaction.update(layupRef, updates);
          return;
        }

        transaction.update(layupRef, updates);
        
        // Include user information in the vote document
        const userName = user.displayName || user.email || user.uid;
        transaction.set(userVoteRef, { 
          vote: voteType === 'yes',
          userName: userName,
          timestamp: new Date()
        });
      });

      console.log("Vote successfully cast");
      
      // Update local state
      setHiddenLayups(prevLayups => 
        prevLayups.map(layup => {
          if (layup.id === id) {
            let newYesCount = layup.yes_count || 0;
            let newNoCount = layup.no_count || 0;
            
            if (layup.userVote === null) {
              // New vote
              voteType === 'yes' ? newYesCount++ : newNoCount++;
            } else if (layup.userVote !== (voteType === 'yes')) {
              // Changed vote
              if (voteType === 'yes') {
                newYesCount++;
                newNoCount--;
              } else {
                newYesCount--;
                newNoCount++;
              }
            } else {
              // Removing vote
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ color: '#34495e', fontWeight: 600 }}>
              Hidden Gems 💎
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
              color: '#000000', // Black font color
              fontSize: '0.85rem', // Smaller font size
              fontWeight: '500', // Semi-bold for better readability
              borderRadius: '20px', // Curved edges
              padding: '6px 16px', // Smaller padding for a compact look
              '&:hover': {
                backgroundColor: '#571ce0', // Black background on hover
                color: '#ffffff', // White font color on hover for contrast
              },
              height: 'fit-content',
              ml: 2,
              transition: 'background-color 0.3s, color 0.3s', // Smooth transition for hover effect
            }}
          >
            Recommend a Course
          </Button>
          
          )}
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Grid container spacing={3}>
          {hiddenLayups.map((layup, index) => {
            const yesCount = layup.yes_count || 0;
            const noCount = layup.no_count || 0;
            const yesPercentage = calculatePercentage(yesCount, noCount);
            const noPercentage = 100 - yesPercentage;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={layup.id}>
                <Box 
                  sx={{ 
                    border: '1px solid #ecf0f1',
                    borderRadius: '8px',
                    padding: '16px',
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    },
                    transition: 'box-shadow 0.3s ease-in-out',
                  }}
                >
                  <Box>
                    <Tooltip title={layup.name} arrow>
                      <Typography 
                        variant="subtitle1" 
                        component={Link}
                        to={`/departments/${layup.department}/courses/${layup.id}`}
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1, 
                          textDecoration: 'none',
                          color: '#2c3e50',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {layup.name}
                      </Typography>
                    </Tooltip>
                    <Typography variant="body2" sx={{ mb: 2, color: '#7f8c8d' }}>
                      {layup.department}
                    </Typography>
                    <Tooltip
                      title={`Yes: ${yesPercentage.toFixed(1)}% | No: ${noPercentage.toFixed(1)}%`}
                      arrow
                    >
                      <Box sx={{ width: '100%', mb: 1, position: 'relative' }}>
                        <Box
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#f6f6f6',
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
                              transition: 'width 0.3s ease-in-out',
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 0.5,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#00693E' }}>
                            {yesPercentage > 0 ? `${yesPercentage.toFixed(0)}%` : ''}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#e74c3c' }}>
                            {noPercentage > 0 ? `${noPercentage.toFixed(0)}%` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, color: '#7f8c8d' }}>
                      <span>Yes: {yesCount}</span>
                      <span>No: {noCount}</span>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button 
                      variant="contained" 
                      size="small"
                      color={layup.userVote === true ? "primary" : "inherit"}
                      onClick={(e) => {
                        e.preventDefault();
                        handleVote(layup.id, 'yes');
                      }}
                      sx={{ 
                        mr: 1, 
                        flex: 1, 
                        boxShadow: 'none',
                        backgroundColor: layup.userVote === true ? '#00693E' : '#ecf0f1',
                        color: layup.userVote === true ? '#ffffff' : '#34495e',
                        '&:hover': {
                          backgroundColor: '#571ce0',
                          color: '#ffffff',
                        },
                      }}
                    >
                      Yes
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small"
                      color={layup.userVote === false ? "primary" : "inherit"}
                      onClick={(e) => {
                        e.preventDefault();
                        handleVote(layup.id, 'no');
                      }}
                      sx={{ 
                        flex: 1,
                        boxShadow: 'none',
                        backgroundColor: layup.userVote === false ? '#00693E' : '#ecf0f1',
                        color: layup.userVote === false ? '#ffffff' : '#34495e',
                        '&:hover': {
                          backgroundColor: '#c0392b',
                          color: '#ffffff',
                        },
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