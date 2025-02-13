import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Card,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const BetaSignup = ({ darkMode }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userReviews, setUserReviews] = useState([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const db = getFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Check existing beta application
        const betaRef = doc(db, 'beta', currentUser.uid);
        const betaDoc = await getDoc(betaRef);
        
        if (betaDoc.exists()) {
          setHasApplied(betaDoc.data().applied || false);
        }

        // Fetch user's reviews
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserReviews(userData.reviews || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, db, navigate]);

  const calculateAverageWordCount = (reviews) => {
    if (!reviews.length) return 0;
    const totalWords = reviews.reduce((acc, review) => {
      return acc + (review.review?.trim().split(/\s+/).length || 0);
    }, 0);
    return totalWords / reviews.length;
  };

  const meetsRequirements = () => {
    return userReviews.length >= 5 && calculateAverageWordCount(userReviews) > 50;
  };

  const handleApply = async () => {
    if (hasApplied) return;

    try {
      const betaRef = doc(db, 'beta', currentUser.uid);
      await setDoc(betaRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        appliedAt: new Date(),
        applied: true,
        reviewCount: userReviews.length,
        averageWordCount: calculateAverageWordCount(userReviews)
      });
      
      setHasApplied(true);
      setSuccess('Thank you for applying! We will review your application and get back to you within 24 hours.');
    } catch (err) {
      console.error('Error applying:', err);
      setError('Failed to submit application. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: darkMode 
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
          : '#f9f9f9',
        py: 8
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ 
          p: 4,
          bgcolor: darkMode ? '#1C093F' : '#ffffff',
          color: darkMode ? '#FFFFFF' : '#000000',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h3" gutterBottom align="center" sx={{ 
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            mb: 4
          }}>
            CourseMe Beta Program
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#571CE0', mb: 2 }}>
              Beta Tester Benefits
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="🚀 Early Access" 
                  secondary="Be the first to try our new AI chatbot - CORA"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="🎯 Direct Impact" 
                  secondary="Your feedback will shape the future of CourseMe"
                />
              </ListItem>
            </List>
          </Box>


          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              disabled={hasApplied}
              onClick={handleApply}
              sx={{
                bgcolor: darkMode ? '#571CE0' : '#000000',
                color: '#FFFFFF',
                py: 1.5,
                px: 4,
                borderRadius: '8px',
                '&:hover': {
                  bgcolor: darkMode ? '#6A1DE0' : '#333333',
                },
                '&.Mui-disabled': {
                  bgcolor: darkMode ? '#2C194F' : '#cccccc',
                }
              }}
            >
              {hasApplied ? 'Application Submitted' : 'Apply for Beta Access'}
            </Button>
          </Box>

          {hasApplied && (
            <Typography 
              variant="body2" 
              align="center" 
              sx={{ 
                mt: 2,
                color: darkMode ? '#CCCCCC' : '#666666'
              }}
            >
              We'll review your application and get back to you within 24 hours.
            </Typography>
          )}
        </Card>
      </Container>
    </Box>
  );
};

export default BetaSignup;