import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, CircularProgress, Chip, Tooltip, Card, CardContent, Divider } from '@mui/material';
import { collection, query, getDocs, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { TrendingUp, BookOpen, Lightbulb, BookText, Target } from 'lucide-react';

/**
 * SimilarCourses component that displays course recommendations based on similarity to the current course
 * The enhanced algorithm focuses on substantive similarities across departments, not just within them
 */
const SimilarCourses = ({ courseId, currentDepartment, darkMode, course }) => {
  const [loading, setLoading] = useState(true);
  const [similarCourses, setSimilarCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilarCourses = async () => {
      if (!courseId || !course) return;

      try {
        setLoading(true);
        
        // Extract current course information for comparison
        const currentCourseNumber = extractCourseNumber(courseId);
        const currentCourseLevel = Math.floor(parseInt(currentCourseNumber) / 100) * 100;
        const currentDistribs = course.distribs ? course.distribs.split(',').map(d => d.trim()) : [];
        const currentQuality = course.quality || 0;
        const currentLayup = course.layup || 0;
        const currentMetrics = course.metrics || {};
        const currentDescription = course.description || '';
        const currentName = course.name || '';
        
        // Fetch current course's full data to get description and additional fields
        const courseDocRef = doc(db, 'courses', courseId);
        const courseDocSnap = await getDoc(courseDocRef);
        let courseKeywords = [];
        let currentReviewSummary = '';
        
        if (courseDocSnap.exists()) {
          const fullCourseData = courseDocSnap.data();
          // Extract keywords from current course description
          if (fullCourseData.description) {
            courseKeywords = extractKeywords(fullCourseData.description);
          }
          
          // Get the AI summary if available
          if (fullCourseData.summary) {
            currentReviewSummary = fullCourseData.summary;
          }
        }
        
        // Add keywords from course name
        if (currentName) {
          courseKeywords = [...courseKeywords, ...extractKeywords(currentName)];
        }
        
        // Add keywords from review summary
        if (currentReviewSummary) {
          courseKeywords = [...courseKeywords, ...extractKeywords(currentReviewSummary)];
        }
        
        // Remove duplicates and normalize
        courseKeywords = [...new Set(courseKeywords.map(kw => kw.toLowerCase()))];
        
        // List of related subject area pairs
        const relatedSubjects = [
          // Humanities
          ['ENGL', 'CRWT'], // English & Creative Writing
          ['ENGL', 'COLT'], // English & Comparative Literature
          ['PHIL', 'GOVT'], // Philosophy & Government
          ['PHIL', 'COGS'], // Philosophy & Cognitive Science
          ['HIST', 'GOVT'], // History & Government
          ['HIST', 'AAAS'], // History & African American Studies
          ['HIST', 'ANTH'], // History & Anthropology
          ['HIST', 'ASCL'], // History & Asian Studies
          ['HIST', 'JWST'], // History & Jewish Studies
          ['HIST', 'LACS'], // History & Latin American Studies
          ['HIST', 'MES'], // History & Middle Eastern Studies
          ['HIST', 'NAS'], // History & Native American Studies
          ['HIST', 'WGSS'], // History & Women's Studies
          
          // STEM
          ['MATH', 'COSC'], // Math & Computer Science
          ['MATH', 'PHYS'], // Math & Physics  
          ['MATH', 'ENGS'], // Math & Engineering
          ['PHYS', 'ASTR'], // Physics & Astronomy
          ['PHYS', 'ENGS'], // Physics & Engineering
          ['PHYS', 'CHEM'], // Physics & Chemistry
          ['CHEM', 'BIOL'], // Chemistry & Biology
          ['CHEM', 'ENGS'], // Chemistry & Engineering
          ['BIOL', 'PSYC'], // Biology & Psychology
          ['COSC', 'ENGS'], // Computer Science & Engineering
          ['COSC', 'QSS'], // Computer Science & Quantitative Social Science
          
          // Social Sciences
          ['PSYC', 'SOCY'], // Psychology & Sociology
          ['PSYC', 'COGS'], // Psychology & Cognitive Science
          ['SOCY', 'ANTH'], // Sociology & Anthropology
          ['SOCY', 'GOVT'], // Sociology & Government
          ['SOCY', 'WGSS'], // Sociology & Women's Studies
          ['ECON', 'GOVT'], // Economics & Government
          ['ECON', 'QSS'], // Economics & Quantitative Social Science
          ['ECON', 'MATH'], // Economics & Math
          
          // Arts
          ['MUS', 'THEA'], // Music & Theater
          ['SART', 'FILM'], // Studio Art & Film
          ['FILM', 'THEA'], // Film & Theater
          
          // Regional Studies
          ['AAAS', 'GOVT'], // African Studies & Government
          ['AAAS', 'SOCY'], // African Studies & Sociology
          ['ASCL', 'GOVT'], // Asian Studies & Government
          ['LACS', 'SPAN'], // Latin American Studies & Spanish
          ['MES', 'GOVT'], // Middle Eastern Studies & Government
          ['MES', 'ANTH'], // Middle Eastern Studies & Anthropology
          
          // Languages
          ['SPAN', 'PORT'], // Spanish & Portuguese
          ['FREN', 'ITAL'], // French & Italian
          ['CHIN', 'JAPN'], // Chinese & Japanese
          ['GERM', 'RUSS'], // German & Russian
        ];
        
        // Determine related departments to current department
        const relatedDepartments = new Set();
        relatedSubjects.forEach(pair => {
          if (pair[0] === currentDepartment) {
            relatedDepartments.add(pair[1]);
          } else if (pair[1] === currentDepartment) {
            relatedDepartments.add(pair[0]);
          }
        });
        
        // Fetch all courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        
        // Process and score the similarity of each course
        const scoredCourses = [];
        
        for (const docSnapshot of coursesSnapshot.docs) {
          const courseData = docSnapshot.data();
          const candidateId = docSnapshot.id;
          
          // Skip the current course
          if (candidateId === courseId) continue;
          
          // Skip courses without necessary data
          if (!courseData.department || !courseData.course_number) continue;
          
          // Calculate similarity score
          let similarityScore = 0;
          const reasons = [];
          
          // 1. Same department (some weight, but not dominant)
          if (courseData.department === currentDepartment) {
            similarityScore += 15;
            reasons.push('Same department');
          }
          
          // 2. Related department (give significant weight to cross-departmental similarities)
          if (relatedDepartments.has(courseData.department)) {
            similarityScore += 20;
            reasons.push(`Related to ${currentDepartment} studies`);
          }
          
          // 3. Similar course level (100s with 100s, etc.)
          const candidateCourseNumber = parseInt(courseData.course_number);
          const candidateCourseLevel = Math.floor(candidateCourseNumber / 100) * 100;
          
          if (candidateCourseLevel === currentCourseLevel) {
            similarityScore += 10;
            reasons.push('Similar course level');
          }
          
          // 4. Matching distribs (very important - key academic categorization)
          const candidateDistribs = courseData.distribs ? courseData.distribs.split(',').map(d => d.trim()) : [];
          const matchingDistribs = candidateDistribs.filter(d => currentDistribs.includes(d));
          
          if (matchingDistribs.length > 0) {
            similarityScore += matchingDistribs.length * 15;
            reasons.push(`${matchingDistribs.length} matching distribution${matchingDistribs.length > 1 ? 's' : ''}`);
          }
          
          // 5. Keyword matching (most important - content similarity)
          let candidateKeywords = [];
          
          // Extract from name
          if (courseData.name) {
            candidateKeywords = [...candidateKeywords, ...extractKeywords(courseData.name)];
          }
          
          // Extract from description if available
          if (courseData.description) {
            candidateKeywords = [...candidateKeywords, ...extractKeywords(courseData.description)];
          }
          
          // Extract from summary if available
          if (courseData.summary) {
            candidateKeywords = [...candidateKeywords, ...extractKeywords(courseData.summary)];
          }
          
          // Remove duplicates and normalize
          candidateKeywords = [...new Set(candidateKeywords.map(kw => kw.toLowerCase()))];
          
          // Calculate keyword matches
          const matchingKeywords = candidateKeywords.filter(kw => courseKeywords.includes(kw));
          
          if (matchingKeywords.length > 0) {
            // Give higher weight to keyword matches - this is about actual content
            const keywordScore = Math.min(matchingKeywords.length * 5, 40); // Cap at 40 to prevent domination
            similarityScore += keywordScore;
            
            if (matchingKeywords.length >= 3) {
              reasons.push(`Similar content (${matchingKeywords.length} matching topics)`);
            } else {
              reasons.push(`Some similar topics`);
            }
          }
          
          // 6. Similar quality rating
          const qualityDiff = Math.abs((courseData.quality || 0) - currentQuality);
          if (qualityDiff <= 5) {
            similarityScore += 5;
            reasons.push('Similar quality rating');
          }
          
          // 7. Similar layup score
          const layupDiff = Math.abs((courseData.layup || 0) - currentLayup);
          if (layupDiff <= 5) {
            similarityScore += 5;
            reasons.push('Similar workload');
          }
          
          // 8. Similar metrics if available (student experience)
          if (courseData.metrics && currentMetrics) {
            const metricsToCompare = ['difficulty_score', 'quality_score', 'sentiment_score'];
            let metricMatches = 0;
            
            metricsToCompare.forEach(metric => {
              if (courseData.metrics[metric] && currentMetrics[metric]) {
                const diff = Math.abs(courseData.metrics[metric] - currentMetrics[metric]);
                if (diff <= 15) { // Within 15% similarity threshold
                  metricMatches++;
                }
              }
            });
            
            if (metricMatches > 0) {
              similarityScore += metricMatches * 5;
              reasons.push('Similar student experience');
            }
          }
          
          // 9. Complementary courses (courses that are different but complementary)
          const isComplementary = (currentDepartment !== courseData.department) && 
            (currentDistribs.some(d => candidateDistribs.includes(d)));
            
          if (isComplementary) {
            similarityScore += 10;
            reasons.push('Complementary subject matter');
          }
          
          // Only include courses with a minimum similarity
          if (similarityScore >= 25) {
            scoredCourses.push({
              id: candidateId,
              name: courseData.name || `${courseData.department} ${courseData.course_number}`,
              department: courseData.department,
              course_number: courseData.course_number,
              distribs: candidateDistribs,
              score: similarityScore,
              reasons,
              metrics: courseData.metrics || {},
              quality: courseData.quality || 0,
              layup: courseData.layup || 0
            });
          }
        }
        
        // Sort by similarity score (descending) and take top 4
        const topSimilarCourses = scoredCourses
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);
        
        setSimilarCourses(topSimilarCourses);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching similar courses:', error);
        setError('Failed to fetch similar courses');
        setLoading(false);
      }
    };

    fetchSimilarCourses();
  }, [courseId, currentDepartment, course]);

  // Helper function to extract course number from ID
  const extractCourseNumber = (id) => {
    const match = id.match(/[A-Z]+(\d+)/);
    return match ? match[1] : '0';
  };

  // Helper function to extract meaningful keywords from text
  const extractKeywords = (text) => {
    if (!text) return [];
    
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    
    // Split by non-word characters and filter out common words and short words
    const stopWords = [
      'the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 
      'by', 'about', 'as', 'of', 'this', 'that', 'these', 'those', 'is', 'are', 
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 
      'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 
      'could', 'course', 'student', 'students', 'class', 'classes', 'lecture', 
      'lectures', 'professor', 'professors'
    ];
    
    const words = cleanText.split(/[^\w]/)
      .map(word => word.toLowerCase())
      .filter(word => 
        word.length > 3 && 
        !stopWords.includes(word) && 
        !word.match(/^\d+$/) // Filter out just numbers
      );
    
    return [...new Set(words)]; // Remove duplicates
  };

  // Helper function to generate URL for a course
  const generateCourseUrl = (course) => {
    return `/departments/${course.department}/courses/${course.id}`;
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', padding: '20px' }}>
        <CircularProgress size={24} sx={{ color: darkMode ? '#90CAF9' : '#1976D2' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', padding: '20px', color: darkMode ? '#F48FB1' : '#D32F2F' }}>
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (similarCourses.length === 0) {
    return (
      <Box sx={{ padding: '20px', textAlign: 'center' }}>
        <Typography 
          variant="body2" 
          sx={{ fontStyle: 'italic', color: darkMode ? '#A0AEC0' : '#718096' }}
        >
          No similar courses found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '20px' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '16px',
          gap: 1
        }}
      >
        <Lightbulb size={18} color={darkMode ? '#90CAF9' : '#1976D2'} />
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: '1.1rem', 
            fontWeight: 600, 
            color: darkMode ? '#F0F4F8' : '#2D3748' 
          }}
        >
          Recommended Courses
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {similarCourses.map((similarCourse) => {
          // Get the distribs from the current course we're viewing (not the similarCourse)
          const viewedCourseDistribs = course?.distribs ? course.distribs.split(',').map(d => d.trim()) : [];
          
          return (
            <Card 
              key={similarCourse.id} 
              component={Link} 
              to={generateCourseUrl(similarCourse)}
              sx={{
                textDecoration: 'none',
                backgroundColor: darkMode ? '#1A202C' : '#FFFFFF',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                },
                border: darkMode ? '1px solid #2D3748' : '1px solid #E2E8F0',
              }}
            >
              <CardContent sx={{ padding: '16px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography 
                    sx={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 600, 
                      color: darkMode ? '#F0F4F8' : '#2D3748',
                      flexGrow: 1 
                    }}
                  >
                    {similarCourse.department} {similarCourse.course_number}: {similarCourse.name}
                  </Typography>
                  <Chip
                    label={similarCourse.department}
                    size="small"
                    sx={{
                      ml: 1,
                      backgroundColor: similarCourse.department === currentDepartment 
                        ? (darkMode ? '#4A5568' : '#E2E8F0') 
                        : (darkMode ? '#2C5282' : '#EBF8FF'),
                      color: similarCourse.department === currentDepartment
                        ? (darkMode ? '#CBD5E0' : '#4A5568')
                        : (darkMode ? '#90CDF4' : '#2B6CB0'),
                      fontSize: '0.7rem',
                      height: '20px',
                      flexShrink: 0
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                  {similarCourse.distribs.map((distrib, idx) => (
                    <Chip
                      key={`${distrib}-${idx}`}
                      label={distrib}
                      size="small"
                      sx={{
                        backgroundColor: viewedCourseDistribs.includes(distrib)
                          ? (darkMode ? '#2D3748' : '#EDF2F7')
                          : (darkMode ? '#1A365D' : '#E6FFFA'),
                        color: viewedCourseDistribs.includes(distrib)
                          ? (darkMode ? '#CBD5E0' : '#4A5568')
                          : (darkMode ? '#81E6D9' : '#2C7A7B'),
                        fontSize: '0.7rem',
                        height: '20px',
                      }}
                    />
                  ))}
                </Box>
                
                <Divider sx={{ my: 1, borderColor: darkMode ? '#2D3748' : '#E2E8F0' }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tooltip 
                    title={similarCourse.reasons.join(', ')} 
                    placement="top"
                    arrow
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5, 
                      cursor: 'help' 
                    }}>
                      <Target size={14} color={darkMode ? '#90CAF9' : '#1976D2'} />
                      <Typography 
                        variant="caption" 
                        sx={{ color: darkMode ? '#A0AEC0' : '#718096' }}
                      >
                        {Math.round(similarCourse.score)}% match
                      </Typography>
                    </Box>
                  </Tooltip>
                  
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Tooltip title="Quality Rating" placement="top" arrow>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: darkMode ? '#A0AEC0' : '#718096'
                        }}
                      >
                        Q: {similarCourse.quality}
                      </Typography>
                    </Tooltip>
                    
                    <Tooltip title="Workload Rating" placement="top" arrow>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: darkMode ? '#A0AEC0' : '#718096'
                        }}
                      >
                        W: {similarCourse.layup}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default SimilarCourses; 