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
  getCourseRecommendations,
  approveCourseRecommendation,
  rejectCourseRecommendation
} from '../services/recommendationService';

import { useNavigate } from 'react-router-dom';
import { Analytics, Lightbulb } from '@mui/icons-material';

const AdminRecommendations = ({ user, darkMode = false }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  // Fetch both recommendations and analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recommendations
        const result = await getCourseRecommendations('pending');
        
        if (result.success) {
          setRecommendations(result.recommendations);
        } else {
          setError(result.error);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const handleApprove = async (recommendation) => {
    const result = await approveCourseRecommendation(recommendation);

    if (result.success) {
      // Update local state to remove from pending list
      setRecommendations(prev => 
        prev.filter(rec => rec.id !== recommendation.id)
      );
      console.log(`Approved and added ${recommendation.name} to hidden layups`);
    } else {
      setError(result.error);
    }
  };

  const handleReject = async (recommendation) => {
    const result = await rejectCourseRecommendation(recommendation.id);

    if (result.success) {
      setRecommendations(prev => 
        prev.filter(rec => rec.id !== recommendation.id)
      );
    } else {
      setError(result.error);
    }
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
      
      case 1: // Analytics Overview - Removed
        return (
          <Box sx={{ mt: 2 }}>
            <Typography color="textSecondary">Analytics functionality has been removed.</Typography>
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
            label="Analytics (Disabled)" 
          />
        </Tabs>
      </Box>
      
      {renderTabContent()}
      

    </Box>
  );
};

export default AdminRecommendations;