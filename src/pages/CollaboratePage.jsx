import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Paper, Grid, Card, CardContent,
  Chip, Fade
} from '@mui/material';
import { 
  GitHub,
  People,
  EmojiEvents
} from '@mui/icons-material';

const CollaboratePage = ({ darkMode }) => {
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    setFadeIn(true);
  }, []);

  // Role definitions with refined set
  const roles = [
    {
      id: 'mts-ai',
      title: 'Member of Technical Staff',
      subtitle: 'AI Features',
      description: 'Build cutting-edge AI features for course recommendations, academic planning, and intelligent search capabilities.',
      skills: ['React', 'Python', 'AI/ML', 'NoSQL Database', 'OpenAI API'],
      impact: 'Direct impact on 4,000+ students through AI-powered features'
    },
    {
      id: 'mts-frontend',
      title: 'Member of Technical Staff',
      subtitle: 'Frontend Development',
      description: 'Enhance user experience, build beautiful responsive interfaces, and implement modern design systems.',
      skills: ['React', 'Material-UI', 'JavaScript', 'CSS', 'TypeScript'],
      impact: 'Shape the daily experience of thousands of Dartmouth students'
    },
    {
      id: 'mts-backend',
      title: 'Member of Technical Staff',
      subtitle: 'Backend Engineering',
      description: 'Scale infrastructure, build robust APIs, optimize database performance, and ensure system reliability.',
      skills: ['Python', 'NoSQL Database', 'Cloud Functions', 'Database Design', 'API Development'],
      impact: 'Build the foundation that powers CourseMe for thousands of users'
    },
    {
      id: 'marketing',
      title: 'Marketing Manager',
      subtitle: 'Growth & Community',
      description: 'Lead social media strategy, create engaging content, and grow our user base across Instagram, TikTok, and other platforms.',
      skills: ['Instagram', 'TikTok', 'Content Creation', 'Social Media Strategy', 'Analytics'],
      impact: 'Help more Dartmouth students discover and benefit from CourseMe'
    },
    {
      id: 'product',
      title: 'Product Manager',
      subtitle: 'Strategy & Coordination',
      description: 'Define product roadmap, coordinate between teams, conduct user research, and drive product decisions.',
      skills: ['Product Strategy', 'User Research', 'Project Management', 'Analytics', 'Communication'],
      impact: 'Shape the future direction of CourseMe and prioritize features that matter most'
    }
  ];

  const handleRoleClick = (roleId) => {
    // Navigate to Google Form with role pre-selected
    // You can replace this URL with your actual Google Form URL
    const googleFormUrl = 'https://forms.google.com/your-form-url';
    window.open(googleFormUrl, '_blank');
  };

  const RoleCard = ({ role, isSelected, onClick }) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: darkMode 
          ? 'linear-gradient(145deg, rgba(44, 25, 79, 0.55), rgba(28, 9, 63, 0.55))' 
          : 'linear-gradient(145deg, #ffffff, #f7f7f7)',
        border: darkMode 
          ? '1px solid rgba(87, 28, 224, 0.2)' 
          : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: darkMode 
          ? '0 8px 20px rgba(0, 0, 0, 0.25)' 
          : '0 8px 16px rgba(0, 0, 0, 0.06)',
        borderRadius: '20px',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: darkMode 
            ? '0 12px 30px rgba(87, 28, 224, 0.3)' 
            : '0 12px 30px rgba(87, 28, 224, 0.15)',
        }
      }}
      onClick={() => {
        setSelectedRole(role.id);
        handleRoleClick(role.id);
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: darkMode ? '#ffffff' : '#333333',
              fontSize: '1.2rem',
              mb: 0.5
            }}
          >
            {role.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            {role.subtitle}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
            mb: 3,
            lineHeight: 1.6,
            fontSize: '0.95rem'
          }}
        >
          {role.description}
        </Typography>

        <Box>
          <Typography
            variant="caption"
            sx={{
              color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              fontWeight: 600,
              mb: 1.5,
              display: 'block',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Key Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {role.skills.map((skill, index) => (
              <Typography
                key={index}
                variant="caption"
                sx={{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                {skill}
              </Typography>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: darkMode
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
          : '#f9f9f9',
        color: darkMode ? '#FFF' : '#000',
        fontFamily: 'SF Pro Display, sans-serif',
        paddingTop: '80px',
        paddingBottom: '40px',
        transition: 'opacity 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
        opacity: fadeIn ? 1 : 0,
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ mb: 8 }}>
          <Fade in={fadeIn} timeout={1000}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={8}>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: '2.2rem', md: '3.2rem' },
                  color: darkMode ? '#ffffff' : '#333333',
                  mb: 3,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1
                }}
              >
                Build the Future of Course Selection
              </Typography>
              
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'SF Pro Display, sans-serif',
                    fontWeight: 400,
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                    color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                    mb: 4,
                    lineHeight: 1.5,
                    maxWidth: '500px'
                  }}
                >
                  Join 4,000+ students already using CourseMe. Enhance your resume and make a real impact.
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { icon: <People />, label: '4,000+ Active Users', color: '#571CE0' },
                    { icon: <GitHub />, label: 'Open Source', color: '#F26655' },
                    { icon: <EmojiEvents />, label: 'Student Built', color: '#00693e' }
                  ].map((stat, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1,
                        borderRadius: '20px',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                        justifyContent: { xs: 'flex-start', md: 'flex-end' }
                      }}
                    >
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: darkMode ? '#ffffff' : '#333333'
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Fade>
        </Box>

        {/* Available Roles Section */}
        <Fade in={fadeIn} timeout={1400}>
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: darkMode ? '#ffffff' : '#333333',
                mb: 4,
                textAlign: 'left'
              }}
            >
              Available Roles
            </Typography>

            <Grid container spacing={3}>
              {roles.map((role) => (
                <Grid item xs={12} md={6} lg={4} key={role.id}>
                  <RoleCard
                    role={role}
                    isSelected={selectedRole === role.id}
                    onClick={() => {}}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>

        {/* Why Join Section */}
        <Fade in={fadeIn} timeout={1600}>
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: darkMode ? '#ffffff' : '#333333',
                mb: 3,
                textAlign: 'left'
              }}
            >
              Why Join CourseMe?
            </Typography>
            
            <Grid container spacing={3}>
              {[
                {
                  title: 'Resume Impact',
                  description: 'Add meaningful open-source contributions with real user impact to your resume'
                },
                {
                  title: 'Real Impact',
                  description: 'Your work directly helps thousands of Dartmouth students plan their academic journey'
                },
                {
                  title: 'Skill Building',
                  description: 'Gain hands-on experience with AI, React, NoSQL databases, and modern development practices'
                },
                {
                  title: 'Community',
                  description: 'Join a passionate team of student developers building something meaningful together'
                }
              ].map((benefit, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: darkMode ? '#ffffff' : '#333333',
                        mb: 1
                      }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                        lineHeight: 1.6
                      }}
                    >
                      {benefit.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default CollaboratePage;
