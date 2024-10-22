import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert,
  Paper,
  CircularProgress
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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const AdminRecommendations = ({ user }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const q = query(
          collection(db, 'course_recommendations'),
          where('status', '==', 'pending'),
          orderBy('submittedAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        setRecommendations(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // In AdminRecommendations.jsx, modify the handleApprove function:
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
            }}
          >
            <Typography variant="h6" sx={{ color: '#2c3e50', mb: 1 }}>
              {recommendation.department} - {recommendation.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#7f8c8d', mb: 2 }}>
              Submitted by: {recommendation.submittedBy.name}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
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
};

export default AdminRecommendations;