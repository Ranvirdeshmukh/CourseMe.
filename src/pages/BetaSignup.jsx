import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  CircularProgress,
  Alert,
  Card
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const BetaSignup = ({ darkMode }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const db = getFirestore();

  // Define design variables similar to AllClassesPage
  const mainBgColor = darkMode 
    ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
    : '#F9F9F9';
  const paperBgColor = darkMode ? '#1C1F43' : '#FFFFFF';
  const textColor = darkMode ? '#FFFFFF' : '#333333';
  const headerTextColor = darkMode ? '#FFFFFF' : '#571CE0';

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      try {
        // Check existing beta subscription
        const betaRef = doc(db, 'beta', currentUser.uid);
        const betaDoc = await getDoc(betaRef);
        if (betaDoc.exists()) {
          setHasSubscribed(betaDoc.data().subscribed || false);
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

  const handleSubscribe = async () => {
    if (hasSubscribed) return;
    try {
      const betaRef = doc(db, 'beta', currentUser.uid);
      await setDoc(betaRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        subscribedAt: new Date(),
        subscribed: true
      });
      
      setHasSubscribed(true);
      setSuccess('Thank you for subscribing! We will notify you as soon as CORA is live.');
    } catch (err) {
      console.error('Error subscribing:', err);
      setError('Failed to submit subscription. Please try again.');
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
        backgroundColor: mainBgColor,
        padding: '30px',
        fontFamily: 'SF Pro Display, sans-serif',
        color: textColor,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <Container maxWidth="lg">
        <Card
          sx={{ 
            p: 4,
            bgcolor: paperBgColor,
            color: textColor,
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'background-color 0.3s ease, color 0.3s ease'
          }}
        >
          <Typography
            variant="h3"
            gutterBottom
            align="center"
            sx={{ 
              fontFamily: 'SF Pro Display, sans-serif',
              fontWeight: 600,
              mb: 4,
              color: headerTextColor,
            }}
          >
            CORA 1.0 Launching Monday, 17th February 2025
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          CORA, AI-powered Undergraduate dean and major planner, is being made available right now exclusively to 500 users. We’re continuously iterating to make it even better. Subscribe below, and we’ll notify you as soon as it’s live on Monday for everyone.          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              disabled={hasSubscribed}
              onClick={handleSubscribe}
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
              {hasSubscribed ? 'Subscription Confirmed' : 'Subscribe for Launch Notification'}
            </Button>
          </Box>

          {hasSubscribed && (
            <Typography
              variant="body2"
              align="center"
              sx={{ 
                mt: 2,
                color: darkMode ? '#CCCCCC' : '#666666'
              }}
            >
              We'll notify you as soon as CORA is live!
            </Typography>
          )}
        </Card>
      </Container>
    </Box>
  );
};

export default BetaSignup;
