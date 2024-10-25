import React, { useEffect, useState } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const normalizeCourseId = (courseId) => {
  // Extract department and number
  const match = courseId.match(/([A-Z]+)(\d+.*)/);
  if (!match) return null;

  const [_, dept, number] = match;
  
  // Check if it's a decimal number (has section)
  const parts = number.split('.');
  const baseNumber = parts[0].padStart(3, '0');
  const section = parts[1];
  
  // Construct the document ID
  if (section) {
    // For sectioned courses (e.g., "ECON_ECON022_01")
    const paddedSection = section.padStart(2, '0');
    return `${dept}_${dept}${baseNumber}_${paddedSection}`;
  } else {
    // For regular courses (e.g., "ECON_ECON022__Introduction_to_Economics")
    return `${dept}_${dept}${baseNumber}__`;
  }
};

const getComparisonColor = (score, average) => {
  if (!average) return 'bg-indigo-600';
  const diff = score - average;
  
  if (diff > 15) return 'bg-emerald-500';
  if (diff > 5) return 'bg-green-400';
  if (diff > -5) return 'bg-yellow-400';
  if (diff > -15) return 'bg-orange-400';
  return 'bg-red-500';
};

const getComparisonText = (score, average) => {
  if (!average) return null;
  const diff = score - average;
  const absDiff = Math.abs(diff).toFixed(1);
  
  if (diff > 15) return `${absDiff}% above average`;
  if (diff > 5) return `${absDiff}% higher`;
  if (diff > -5) return 'About average';
  if (diff > -15) return `${absDiff}% lower`;
  return `${absDiff}% below average`;
};

const getScoreColor = (score, average) => {
  if (!average) {
    // Absolute position colors when no average is available
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  }

  const diff = score - average;
  
  // Combined colors based on both position and difference
  if (score >= 80) {
    // Excellent range
    return diff > 0 ? 'bg-emerald-500' : 'bg-emerald-400';
  } else if (score >= 60) {
    // Good range
    return diff > 0 ? 'bg-green-500' : 'bg-green-400';
  } else if (score >= 40) {
    // Fair range
    return diff > 0 ? 'bg-yellow-500' : 'bg-yellow-400';
  } else if (score >= 20) {
    // Poor range
    return diff > 0 ? 'bg-orange-500' : 'bg-orange-400';
  }
  // Very poor range
  return diff > 0 ? 'bg-red-500' : 'bg-red-400';
};

const ScoreIndicator = ({ score, averageScore, label, interpretations, reviewCount }) => {
    const opacity = Math.min(0.3 + (reviewCount / 50) * 0.7, 1);
    
    const ranges = interpretations.map(item => ({
      ...item,
      position: (item.threshold / 100) * 100
    }));
  
    if (!score || reviewCount === 0) return null;
  
    const getCurrentRange = (value) => {
      return ranges.reduce((prev, curr) => 
        value >= curr.threshold ? curr : prev, ranges[0]).label;
    };
  
    const comparisonColor = getComparisonColor(score, averageScore);
    const comparisonText = getComparisonText(score, averageScore);
    const barDirection = averageScore && score > averageScore ? 'right' : 'left';
  
    return (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex items-center gap-3">
              {comparisonText && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  score > averageScore ? 'bg-green-100 text-green-800' : 
                  score < averageScore ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {comparisonText}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-600">
                  {score.toFixed(1)}
                  <span className="text-xs text-gray-500 hidden sm:inline"> ({getCurrentRange(score)})</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative h-24">
            {/* Range markers - Now at the top */}
            <div className="hidden sm:block absolute w-full top-0 px-6">
              {ranges.map((range, index) => (
                <div 
                  key={index}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${range.position}%` }}
                >
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {range.label}
                  </div>
                  <div className="h-2 w-px bg-gray-200 mt-1" />
                </div>
              ))}
            </div>
    
            {/* Bar and indicators container - centered vertically */}
            <div className="absolute w-full top-8 px-6">
              {/* Background track */}
              <div className="w-full h-3 bg-gray-100 rounded-full" />
              
              {/* Professor's score indicator */}
              {averageScore ? (
                <div 
                  className={`absolute h-3 ${comparisonColor} rounded-full top-0 transition-all duration-300`}
                  style={{ 
                    width: `${Math.abs(score - averageScore)}%`,
                    left: barDirection === 'left' ? `${score}%` : `${averageScore}%`,
                    opacity
                  }} 
                />
              ) : (
                <div 
                  className="absolute h-3 bg-indigo-600 rounded-full top-0 transition-all duration-300"
                  style={{ 
                    width: `${score}%`,
                    opacity
                  }} 
                />
              )}
              
              {/* Course average indicator */}
              {averageScore !== null && averageScore !== undefined && (
                <>
                  <div className="absolute h-6 w-px bg-gray-400 -top-1.5"
                    style={{ 
                      left: `${averageScore}%`,
                    }} 
                  />
                  {/* Course average label - Now at the bottom */}
                  <div className="absolute text-xs text-gray-500 transform -translate-x-1/2 top-8"
                    style={{ 
                      left: `${averageScore}%`,
                    }}>
                    Course avg: {averageScore.toFixed(1)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      );
    };

const NoDataMessage = ({ type = "analytics" }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-100">
    <Info className="w-8 h-8 text-gray-400 mb-3" />
    <p className="text-gray-600 text-center font-medium">
      Not enough {type} data available yet.
      {type === "reviews" && " Check back after students submit their reviews."}
    </p>
  </div>
);

const ProfessorAnalytics = ({ analysis, courseId }) => {
    const [courseMetrics, setCourseMetrics] = useState(null);
  
    useEffect(() => {
      const fetchCourseMetrics = async () => {
        if (!courseId) return;
        
        try {
          const db = getFirestore();
          const normalizedId = normalizeCourseId(courseId);
          
          if (!normalizedId) {
            console.error('Invalid course ID format');
            return;
          }
  
          // Query for documents that start with the normalized ID pattern
          const coursesRef = collection(db, 'courses');
          const coursesSnapshot = await getDocs(coursesRef);
          
          // Find the first matching document
          const matchingDoc = coursesSnapshot.docs.find(doc => 
            doc.id.startsWith(normalizedId)
          );
  
          if (matchingDoc) {
            const data = matchingDoc.data();
            setCourseMetrics(data.metrics || null);
          } else {
            console.error('No matching course document found');
          }
        } catch (error) {
          console.error('Error fetching course metrics:', error);
        }
      };
  
      fetchCourseMetrics();
    }, [courseId]);

  const {
    metrics: {
      quality_score,
      difficulty_score,
      sentiment_score,
      review_count = 0
    } = {}
  } = analysis || {};

  const qualityInterpretations = [
    { threshold: 20, label: "Poor" },
    { threshold: 40, label: "Fair" },
    { threshold: 60, label: "Good" },
    { threshold: 80, label: "Great" },
    { threshold: 100, label: "Best" }
  ];

  const difficultyInterpretations = [
    { threshold: 20, label: "Hardest" },
    { threshold: 40, label: "Hard" },
    { threshold: 60, label: "Medium" },
    { threshold: 80, label: "Light" },
    { threshold: 100, label: "Easy" }
  ];

  const sentimentInterpretations = [
    { threshold: 20, label: "Poor" },
    { threshold: 40, label: "Fair" },
    { threshold: 60, label: "Good" },
    { threshold: 80, label: "Great" },
    { threshold: 100, label: "Best" }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">Professor Analytics</h3>
          <p className="text-sm text-gray-500">
            Based on {review_count} student {review_count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        {courseMetrics && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Compared to course average</span>
          </div>
        )}
      </div>
      
      <div className="space-y-12 mt-6">  {/* Increased spacing between metrics */}
        <ScoreIndicator 
          score={quality_score}
          averageScore={courseMetrics?.quality_score}
          label="Teaching Quality"
          interpretations={qualityInterpretations}
          reviewCount={review_count}
        />
        <ScoreIndicator 
          score={100-difficulty_score}
          averageScore={100-courseMetrics?.difficulty_score}
          label="Teacher Difficulty"
          interpretations={difficultyInterpretations}
          reviewCount={review_count}
        />
        <ScoreIndicator 
          score={sentiment_score}
          averageScore={courseMetrics?.sentiment_score}
          label="Student Sentiment"
          interpretations={sentimentInterpretations}
          reviewCount={review_count}
        />
      </div>
    </div>
  );
};
export default ProfessorAnalytics;