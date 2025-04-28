import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Link
} from '@mui/material';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { getRecentAnalyticsViews, getUserAnalyticsData } from '../services/analyticsService';
import { useNavigate } from 'react-router-dom';
import { Analytics, Person, Lightbulb, School, Refresh, ArrowForward } from '@mui/icons-material';

const AdminRecommendations = ({ user, darkMode = false }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [userEngagementData, setUserEngagementData] = useState([]);
  const navigate = useNavigate();

  // Fetch both recommendations and analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recommendations
        const recommendationsQuery = query(
          collection(db, 'course_recommendations'),
          where('status', '==', 'pending'),
          orderBy('submittedAt', 'desc')
        );
        
        const snapshot = await getDocs(recommendationsQuery);
        setRecommendations(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
        setLoading(false);
        
        // Fetch analytics data
        setAnalyticsLoading(true);
        const analyticsViews = await getRecentAnalyticsViews(50);
        setAnalyticsData(analyticsViews);
        
        // Process user engagement data
        processUserEngagementData(analyticsViews);
        
        setAnalyticsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
        setLoading(false);
        setAnalyticsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process analytics data to get user engagement insights
  const processUserEngagementData = (analyticsData) => {
    // Group by user
    const userMap = {};
    
    analyticsData.forEach(view => {
      const userId = view.userId;
      if (!userMap[userId]) {
        userMap[userId] = {
          userId,
          userName: view.userName || 'Unknown User',
          userEmail: view.userEmail || 'No Email',
          viewCount: 0,
          lastActiveTime: view.timestamp?.toDate() || new Date(),
          contentViewed: new Set(),
          contentTypeCount: { professor: 0, course: 0 },
          sessions: [],
          deviceTypes: new Set()
        };
      }
      
      userMap[userId].viewCount++;
      userMap[userId].contentViewed.add(view.contentId);
      userMap[userId].contentTypeCount[view.contentType]++;
      userMap[userId].deviceTypes.add(view.deviceType || 'unknown');
      
      // Update last active time if more recent
      if (view.timestamp?.toDate() > userMap[userId].lastActiveTime) {
        userMap[userId].lastActiveTime = view.timestamp.toDate();
      }
    });
    
    // Convert to array and sort by activity
    const userData = Object.values(userMap).sort((a, b) => b.viewCount - a.viewCount);
    setUserEngagementData(userData);
  };

  const handleViewUserAnalytics = async (userId) => {
    try {
      setAnalyticsLoading(true);
      const userData = await getUserAnalyticsData(userId);
      // Process user data here if needed
      setAnalyticsLoading(false);
      
      // Navigate to analytics dashboard filtered by this user
      navigate(`/admin/analytics?user=${userId}`);
    } catch (err) {
      console.error('Error fetching user analytics:', err);
      setError('Failed to fetch user analytics');
      setAnalyticsLoading(false);
    }
  };

  const handleApprove = async (recommendation) => {
    try {
      // First update the recommendation status
      await updateDoc(doc(db, 'course_recommendations', recommendation.id), {
        status: 'approved',
        approvedBy: user.uid,
        approvedAt: serverTimestamp()
      });

      // Then add to hidden_layups collection
      await setDoc(doc(db, 'hidden_layups', recommendation.id), {
        name: recommendation.name,
        department: recommendation.department,
        yes_count: 0,
        no_count: 0
      });

      // Update local state to remove from pending list
      setRecommendations(prev => 
        prev.filter(rec => rec.id !== recommendation.id)
      );

      console.log(`Approved and added ${recommendation.name} to hidden layups`);
    } catch (err) {
      console.error('Error approving recommendation:', err);
      setError('Failed to approve recommendation');
    }
  };

  const handleReject = async (recommendation) => {
    try {
      await updateDoc(doc(db, 'course_recommendations', recommendation.id), {
        status: 'rejected',
        rejectedBy: user.uid,
        rejectedAt: serverTimestamp()
      });

      setRecommendations(prev => 
        prev.filter(rec => rec.id !== recommendation.id)
      );
    } catch (err) {
      console.error('Error rejecting recommendation:', err);
      setError('Failed to reject recommendation');
    }
  };

  const handleRefreshAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const analyticsViews = await getRecentAnalyticsViews(50);
      setAnalyticsData(analyticsViews);
      processUserEngagementData(analyticsViews);
      setAnalyticsLoading(false);
    } catch (err) {
      console.error('Error refreshing analytics:', err);
      setError('Failed to refresh analytics data');
      setAnalyticsLoading(false);
    }
  };

  // Get most viewed content
  const getMostViewedContent = () => {
    const contentMap = {};
    
    analyticsData.forEach(view => {
      const key = `${view.contentType}-${view.contentId}`;
      if (!contentMap[key]) {
        contentMap[key] = {
          type: view.contentType,
          id: view.contentId,
          count: 0,
          users: new Set()
        };
      }
      contentMap[key].count++;
      contentMap[key].users.add(view.userId);
    });
    
    return Object.values(contentMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Recommendations
        if (loading) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          );
        }
        
        return (
          <Box sx={{ mt: 2 }}>
            {recommendations.length === 0 ? (
              <Typography color="textSecondary">No pending recommendations</Typography>
            ) : (
              recommendations.map(recommendation => (
                <Paper 
                  key={recommendation.id}
                  sx={{ 
                    p: 3, 
                    mb: 2,
                    border: '1px solid #ecf0f1',
                    borderRadius: '8px',
                    backgroundColor: darkMode ? '#1e1e2d' : '#fff',
                    color: darkMode ? '#fff' : '#2c3e50',
                  }}
                >
                  <Typography variant="h6" sx={{ color: darkMode ? '#fff' : '#2c3e50', mb: 1 }}>
                    {recommendation.department} - {recommendation.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d', mb: 2 }}>
                    Submitted by: {recommendation.submittedBy.name}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, color: darkMode ? '#d0d0e0' : 'inherit' }}>
                    {recommendation.reason}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      onClick={() => handleApprove(recommendation)}
                      variant="contained"
                      sx={{ 
                        backgroundColor: '#00693E',
                        '&:hover': {
                          backgroundColor: '#005032',
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleReject(recommendation)}
                      variant="contained"
                      color="error"
                    >
                      Reject
                    </Button>
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        );
      
      case 1: // Analytics Overview
        if (analyticsLoading) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          );
        }
        
        const mostViewedContent = getMostViewedContent();
        
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: darkMode ? '#fff' : '#2c3e50' }}>
                Analytics Overview
              </Typography>
              <Button 
                startIcon={<Refresh />} 
                onClick={handleRefreshAnalytics}
                variant="outlined"
                size="small"
                sx={{ color: darkMode ? '#90caf9' : '#1976d2', borderColor: darkMode ? '#90caf9' : '#1976d2' }}
              >
                Refresh Data
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    backgroundColor: darkMode ? '#1e1e2d' : '#fff',
                    color: darkMode ? '#fff' : 'inherit',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person /> Active Users ({userEngagementData.length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {userEngagementData.slice(0, 5).map(user => (
                    <Box key={user.userId} sx={{ mb: 2, p: 1, borderRadius: 1, backgroundColor: darkMode ? '#2a2a3c' : '#f7f9fc' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {user.userName || user.userEmail || user.userId.substring(0, 8)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d' }}>
                          {user.viewCount} views
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d' }}>
                          Last active: {user.lastActiveTime.toLocaleString()}
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={() => handleViewUserAnalytics(user.userId)}
                          sx={{ color: darkMode ? '#90caf9' : '#1976d2' }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Box>
                  ))}
                  
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                      component={Link} 
                      to="/admin/analytics"
                      onClick={() => navigate('/admin/analytics')} 
                      endIcon={<ArrowForward />}
                      sx={{ color: darkMode ? '#90caf9' : '#1976d2' }}
                    >
                      View All User Data
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    backgroundColor: darkMode ? '#1e1e2d' : '#fff',
                    color: darkMode ? '#fff' : 'inherit',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School /> Most Viewed Content
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {mostViewedContent.map((content, i) => (
                    <Box key={i} sx={{ mb: 2, p: 1, borderRadius: 1, backgroundColor: darkMode ? '#2a2a3c' : '#f7f9fc' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {content.type === 'professor' ? 'Professor: ' : 'Course: '}
                          {content.id}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d' }}>
                          {content.count} views
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d', mt: 1 }}>
                        Viewed by {content.users.size} unique user{content.users.size !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info" sx={{ backgroundColor: darkMode ? '#193c47' : '#e1f5fe', color: darkMode ? '#81d4fa' : '#0277bd' }}>
                      <Typography variant="body2">
                        You can see which users are viewing specific content in the full analytics dashboard.
                      </Typography>
                    </Alert>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    mt: 2,
                    backgroundColor: darkMode ? '#1e1e2d' : '#fff',
                    color: darkMode ? '#fff' : 'inherit',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lightbulb /> Insights
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, borderRadius: 1, backgroundColor: darkMode ? '#2a2a3c' : '#f7f9fc' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                          Recent Activity
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d' }}>
                          {analyticsData.length > 0 
                            ? `${analyticsData.length} analytics views in the last 24 hours` 
                            : 'No recent analytics views'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, borderRadius: 1, backgroundColor: darkMode ? '#2a2a3c' : '#f7f9fc' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                          Content Preference
                        </Typography>
                        {analyticsData.length > 0 ? (
                          <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d' }}>
                            {analyticsData.filter(d => d.contentType === 'professor').length > 
                              analyticsData.filter(d => d.contentType === 'course').length
                              ? 'Users are more interested in professor analytics'
                              : 'Users are more interested in course analytics'
                            }
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d' }}>
                            No data available
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, borderRadius: 1, backgroundColor: darkMode ? '#2a2a3c' : '#f7f9fc' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                          Device Usage
                        </Typography>
                        {analyticsData.length > 0 ? (
                          <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d' }}>
                            {(() => {
                              const devices = analyticsData.map(d => d.deviceType || 'unknown');
                              const deviceCounts = devices.reduce((acc, device) => {
                                acc[device] = (acc[device] || 0) + 1;
                                return acc;
                              }, {});
                              const topDevice = Object.entries(deviceCounts)
                                .sort((a, b) => b[1] - a[1])[0];
                              return `Most users access from ${topDevice[0]} devices (${topDevice[1]} views)`;
                            })()}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: darkMode ? '#b0b0c0' : '#7f8c8d' }}>
                            No data available
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { color: darkMode ? '#90caf9' : '#1976d2' },
            '& .Mui-selected': { color: darkMode ? '#90caf9' : '#1976d2' }
          }}
        >
          <Tab 
            icon={<Lightbulb />} 
            iconPosition="start" 
            label="Recommendations" 
          />
          <Tab 
            icon={<Analytics />} 
            iconPosition="start" 
            label="User Analytics" 
          />
        </Tabs>
      </Box>
      
      {renderTabContent()}
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/admin/analytics')}
          startIcon={<Analytics />}
        >
          Full Analytics Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default AdminRecommendations;