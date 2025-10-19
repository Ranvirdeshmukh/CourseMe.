import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Paper, Grid, Card, CardContent,
  TextField, MenuItem, Chip, Fade
} from '@mui/material';
import { 
  Code, 
  Brush, 
  Storage, 
  TrendingUp, 
  Assignment,
  GitHub,
  Star,
  People,
  Rocket,
  EmojiEvents
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const CollaboratePage = ({ darkMode }) => {
  const navigate = useNavigate();
  // const { currentUser } = useAuth(); // Available for future authentication features
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    classYear: '',
    role: '',
    motivation: '',
    portfolio: '',
    availability: ''
  });

  useEffect(() => {
    setFadeIn(true);
  }, []);

  // Role definitions with refined set
  const roles = [
    {
      id: 'mts-ai',
      title: 'Member of Technical Staff',
      subtitle: 'AI Features',
      icon: <Code />,
      color: '#571CE0',
      description: 'Build cutting-edge AI features for course recommendations, academic planning, and intelligent search capabilities.',
      skills: ['React', 'Python', 'AI/ML', 'Firebase', 'OpenAI API'],
      commitment: '8-12 hours/week',
      impact: 'Direct impact on 4,000+ students through AI-powered features'
    },
    {
      id: 'mts-frontend',
      title: 'Member of Technical Staff',
      subtitle: 'Frontend Development',
      icon: <Brush />,
      color: '#F26655',
      description: 'Enhance user experience, build beautiful responsive interfaces, and implement modern design systems.',
      skills: ['React', 'Material-UI', 'JavaScript', 'CSS', 'TypeScript'],
      commitment: '6-10 hours/week',
      impact: 'Shape the daily experience of thousands of Dartmouth students'
    },
    {
      id: 'mts-backend',
      title: 'Member of Technical Staff',
      subtitle: 'Backend Engineering',
      icon: <Storage />,
      color: '#00693e',
      description: 'Scale infrastructure, build robust APIs, optimize database performance, and ensure system reliability.',
      skills: ['Python', 'Firebase', 'Cloud Functions', 'Database Design', 'API Development'],
      commitment: '8-12 hours/week',
      impact: 'Build the foundation that powers CourseMe for thousands of users'
    },
    {
      id: 'marketing',
      title: 'Marketing Manager',
      subtitle: 'Growth & Community',
      icon: <TrendingUp />,
      color: '#F26655',
      description: 'Lead social media strategy, create engaging content, and grow our user base across Instagram, TikTok, and other platforms.',
      skills: ['Instagram', 'TikTok', 'Content Creation', 'Social Media Strategy', 'Analytics'],
      commitment: '5-8 hours/week',
      impact: 'Help more Dartmouth students discover and benefit from CourseMe'
    },
    {
      id: 'product',
      title: 'Product Manager',
      subtitle: 'Strategy & Coordination',
      icon: <Assignment />,
      color: '#571CE0',
      description: 'Define product roadmap, coordinate between teams, conduct user research, and drive product decisions.',
      skills: ['Product Strategy', 'User Research', 'Project Management', 'Analytics', 'Communication'],
      commitment: '6-10 hours/week',
      impact: 'Shape the future direction of CourseMe and prioritize features that matter most'
    }
  ];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Here you would integrate with Airtable or your preferred form handler
    console.log('Form submitted:', formData);
    
    // For now, show success message
    alert('Application submitted successfully! We\'ll get back to you within 48 hours.');
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      classYear: '',
      role: '',
      motivation: '',
      portfolio: '',
      availability: ''
    });
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
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
        border: isSelected 
          ? `2px solid ${role.color}` 
          : darkMode 
            ? '1px solid rgba(87, 28, 224, 0.2)' 
            : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isSelected
          ? `0 8px 25px ${role.color}40`
          : darkMode 
            ? '0 8px 20px rgba(0, 0, 0, 0.25)' 
            : '0 8px 16px rgba(0, 0, 0, 0.06)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 30px ${role.color}30`,
          border: `2px solid ${role.color}`,
        }
      }}
      onClick={() => onClick(role.id)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: `${role.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              color: role.color
            }}
          >
            {role.icon}
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: darkMode ? '#ffffff' : '#333333',
                fontSize: '1.1rem'
              }}
            >
              {role.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: role.color,
                fontWeight: 500
              }}
            >
              {role.subtitle}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
            mb: 2,
            lineHeight: 1.5
          }}
        >
          {role.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              fontWeight: 500,
              mb: 1,
              display: 'block'
            }}
          >
            KEY SKILLS
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {role.skills.slice(0, 3).map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                size="small"
                sx={{
                  backgroundColor: `${role.color}15`,
                  color: role.color,
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            ))}
            {role.skills.length > 3 && (
              <Chip
                label={`+${role.skills.length - 3} more`}
                size="small"
                sx={{
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              fontWeight: 500
            }}
          >
            {role.commitment}
          </Typography>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isSelected ? role.color : 'transparent',
              border: `2px solid ${role.color}`,
              transition: 'all 0.2s ease'
            }}
          />
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
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Fade in={fadeIn} timeout={1000}>
            <Box>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  color: darkMode ? '#ffffff' : '#333333',
                  mb: 2,
                  letterSpacing: '-0.02em'
                }}
              >
                Build the Future of{' '}
                <Box component="span" sx={{ color: '#571CE0' }}>
                  Course Selection
                </Box>
              </Typography>
              
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'SF Pro Display, sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: '1.2rem', md: '1.5rem' },
                  color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  mb: 4,
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.4
                }}
              >
                Join 4,000+ students already using CourseMe. Help us make course planning effortless for every Dartmouth student.
              </Typography>

              {/* Stats */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: { xs: 2, md: 4 }, 
                  mb: 4,
                  flexWrap: 'wrap'
                }}
              >
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
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
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
            </Box>
          </Fade>
        </Box>

        {/* Why Join Section */}
        <Fade in={fadeIn} timeout={1200}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 6,
              borderRadius: '20px',
              background: darkMode 
                ? 'linear-gradient(145deg, rgba(44, 25, 79, 0.3), rgba(28, 9, 63, 0.3))' 
                : 'linear-gradient(145deg, #ffffff, #f7f7f7)',
              border: darkMode 
                ? '1px solid rgba(87, 28, 224, 0.2)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: darkMode ? '#ffffff' : '#333333',
                mb: 3,
                textAlign: 'center'
              }}
            >
              Why Join CourseMe?
            </Typography>
            
            <Grid container spacing={3}>
              {[
                {
                  icon: <Star sx={{ color: '#F26655' }} />,
                  title: 'Resume Impact',
                  description: 'Add meaningful open-source contributions with real user impact to your resume'
                },
                {
                  icon: <Rocket sx={{ color: '#571CE0' }} />,
                  title: 'Real Impact',
                  description: 'Your work directly helps thousands of Dartmouth students plan their academic journey'
                },
                {
                  icon: <Code sx={{ color: '#00693e' }} />,
                  title: 'Skill Building',
                  description: 'Gain hands-on experience with AI, React, Firebase, and modern development practices'
                },
                {
                  icon: <People sx={{ color: '#F26655' }} />,
                  title: 'Community',
                  description: 'Join a passionate team of student developers building something meaningful together'
                }
              ].map((benefit, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {benefit.icon}
                    </Box>
                    <Box>
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
                        variant="body2"
                        sx={{
                          color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                          lineHeight: 1.5
                        }}
                      >
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Fade>

        {/* Available Roles Section */}
        <Fade in={fadeIn} timeout={1400}>
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: darkMode ? '#ffffff' : '#333333',
                mb: 1,
                textAlign: 'center'
              }}
            >
              Available Roles
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                mb: 4
              }}
            >
              Choose the role that matches your interests and skills
            </Typography>

            <Grid container spacing={3}>
              {roles.map((role) => (
                <Grid item xs={12} md={6} lg={4} key={role.id}>
                  <RoleCard
                    role={role}
                    isSelected={selectedRole === role.id}
                    onClick={setSelectedRole}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>

        {/* Application Form */}
        <Fade in={fadeIn} timeout={1600}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '20px',
              background: darkMode 
                ? 'linear-gradient(145deg, rgba(44, 25, 79, 0.3), rgba(28, 9, 63, 0.3))' 
                : 'linear-gradient(145deg, #ffffff, #f7f7f7)',
              border: darkMode 
                ? '1px solid rgba(87, 28, 224, 0.2)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: darkMode ? '#ffffff' : '#333333',
                mb: 1,
                textAlign: 'center'
              }}
            >
              Ready to Join?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                mb: 4
              }}
            >
              Fill out this quick application and we'll get back to you within 48 hours
            </Typography>

            <Box component="form" onSubmit={handleFormSubmit} sx={{ maxWidth: '600px', mx: 'auto' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Class Year"
                    value={formData.classYear}
                    onChange={handleInputChange('classYear')}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      }
                    }}
                  >
                    {['2025', '2026', '2027', '2028'].map((year) => (
                      <MenuItem key={year} value={year}>
                        Class of {year}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Role of Interest"
                    value={formData.role}
                    onChange={handleInputChange('role')}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      }
                    }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.title} - {role.subtitle}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Why do you want to join CourseMe?"
                    value={formData.motivation}
                    onChange={handleInputChange('motivation')}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Portfolio/GitHub (Optional)"
                    value={formData.portfolio}
                    onChange={handleInputChange('portfolio')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Availability"
                    value={formData.availability}
                    onChange={handleInputChange('availability')}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      }
                    }}
                  >
                    {[
                      '5-8 hours/week',
                      '8-12 hours/week',
                      '12+ hours/week',
                      'Flexible based on project needs'
                    ].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: '#F26655',
                        color: 'white',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        '&:hover': {
                          backgroundColor: '#E55A4A',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(242, 102, 85, 0.3)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Apply Now
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/landing')}
                      sx={{
                        borderColor: '#571CE0',
                        color: '#571CE0',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        '&:hover': {
                          backgroundColor: 'rgba(87, 28, 224, 0.1)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Back to CourseMe
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default CollaboratePage;
