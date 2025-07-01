import React, { useEffect, useState } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


/* ===========================
   Utility Functions
   =========================== */
const normalizeCourseId = (courseId) => {
  const match = courseId.match(/([A-Z]+)(\d+.*)/);
  if (!match) return null;

  const [_, dept, number] = match;
  const parts = number.split('.');
  const baseNumber = parts[0].padStart(3, '0');
  const section = parts[1];
  
  if (section) {
    return `${dept}_${dept}${baseNumber}_${section.padStart(2, '0')}`;
  } else {
    return `${dept}_${dept}${baseNumber}__`;
  }
};

/**
 * Returns a Tailwind class to color the "comparison" portion of the bar
 * If darkMode, we use darker versions.
 */
const getComparisonColor = (score, average, darkMode = false) => {
  if (!average) {
    return darkMode ? 'bg-indigo-900' : 'bg-indigo-600';
  }
  const diff = score - average;
  
  if (diff > 15) return darkMode ? 'bg-emerald-800' : 'bg-emerald-500';
  if (diff > 5)  return darkMode ? 'bg-green-700'   : 'bg-green-400';
  if (diff > -5) return darkMode ? 'bg-yellow-700'  : 'bg-yellow-400';
  if (diff > -15)return darkMode ? 'bg-orange-700'  : 'bg-orange-400';
  return darkMode ? 'bg-red-800' : 'bg-red-500';
};

/** Returns a small text label describing how far above or below the average we are */
const getComparisonText = (score, average) => {
  // Return null in all cases to remove confusing comparison labels
  return null;
};

/**
 * Returns a Tailwind class to color the "main score" portion of the bar
 * If darkMode, we use darker versions.
 */
const getScoreColor = (score, average, darkMode = false) => {
  if (!average) {
    // absolute color scale if no average
    if (score >= 80) return darkMode ? 'bg-emerald-800' : 'bg-emerald-500';
    if (score >= 60) return darkMode ? 'bg-green-700'   : 'bg-green-500';
    if (score >= 40) return darkMode ? 'bg-yellow-700'  : 'bg-yellow-500';
    if (score >= 20) return darkMode ? 'bg-orange-700'  : 'bg-orange-500';
    return darkMode ? 'bg-red-800' : 'bg-red-500';
  }

  const diff = score - average;
  // relative color if we do have an average
  if (score >= 80) {
    return diff > 0 
      ? (darkMode ? 'bg-emerald-800' : 'bg-emerald-500') 
      : (darkMode ? 'bg-emerald-600' : 'bg-emerald-400');
  } else if (score >= 60) {
    return diff > 0 
      ? (darkMode ? 'bg-green-700' : 'bg-green-500') 
      : (darkMode ? 'bg-green-600' : 'bg-green-400');
  } else if (score >= 40) {
    return diff > 0 
      ? (darkMode ? 'bg-yellow-700' : 'bg-yellow-500') 
      : (darkMode ? 'bg-yellow-600' : 'bg-yellow-400');
  } else if (score >= 20) {
    return diff > 0 
      ? (darkMode ? 'bg-orange-700' : 'bg-orange-500') 
      : (darkMode ? 'bg-orange-600' : 'bg-orange-400');
  }
  return diff > 0
    ? (darkMode ? 'bg-red-800' : 'bg-red-500')
    : (darkMode ? 'bg-red-600' : 'bg-red-400');
};

/* =====================================
   ScoreIndicator (Supports darkMode)
   ===================================== */
const ScoreIndicator = ({
  score,
  averageScore,
  label,
  interpretations,
  reviewCount,
  showCourseAvg = true,
  courseDocId,
  courseDept,
  onCourseClick,
  darkMode = false
}) => {
  const opacity = Math.min(0.3 + (reviewCount / 50) * 0.7, 1);
  
  const handleCourseClick = (e) => {
    if (courseDocId && courseDept) {
      e.stopPropagation();
      onCourseClick(courseDept, courseDocId);
    }
  };

  // For label text
  const labelTextColor = darkMode ? 'text-gray-200' : 'text-gray-700';
  // Sub text color
  const subTextColor = darkMode ? 'text-gray-400' : 'text-gray-600';
  // The "bar track" color behind the bar
  const barTrackColor = darkMode ? 'bg-gray-700/70' : 'bg-gray-100';
  // The small vertical lines in the range
  const rangeLineColor = darkMode ? 'bg-gray-600' : 'bg-gray-300';
  // The text color for the range labels
  const rangeTextColor = darkMode ? 'text-gray-300' : 'text-gray-500';

  // If no score or no reviews, don't show
  if (!score || reviewCount === 0) return null;

  // Figure out which label to display next to the numeric score
  const getCurrentRange = (value) => {
    const foundInterpretation = interpretations
      .find(item => value >= item.threshold && value < (item.threshold + 25)) || interpretations[4];
    return foundInterpretation.label;
  };

  const comparisonColor = getComparisonColor(score, averageScore, darkMode);
  const comparisonText = getComparisonText(score, averageScore);
  const barDirection = averageScore && score > averageScore ? 'right' : 'left';
  const shouldShowAverage = showCourseAvg && !isNaN(averageScore) && averageScore !== null;

  // The range markers (0%,25%,50%,75%,100%) along the bar
  const ranges = [
    { threshold: 0,  label: interpretations[0].label, position: 0   },
    { threshold: 25, label: interpretations[1].label, position: 25  },
    { threshold: 50, label: interpretations[2].label, position: 50  },
    { threshold: 75, label: interpretations[3].label, position: 75  },
    { threshold: 100,label: interpretations[4].label, position: 100 }
  ];

  return (
    <div className="space-y-3">
      {/* Top row: Label, comparison chip, numeric score - now removed since we show label in the parent component */}
      <div className="flex justify-between items-center">
        <span className="hidden">{label}</span>

        <div className="flex items-center gap-3">
          {/* Chip showing "X% above average" etc. */}
          {comparisonText && shouldShowAverage && (
            <span
              className={`
                text-xs px-2 py-1 rounded-full
                ${
                  score > averageScore 
                    ? (darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800')
                    : score < averageScore 
                      ? (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800')
                      : (darkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                }
              `}
            >
              {comparisonText}
            </span>
          )}

          {/* Numeric score + label - hidden since we show score in the parent component */}
          <div className="flex items-center gap-1.5 hidden">
            <span className={`text-sm ${subTextColor}`}>
              {score.toFixed(1)}
              <span className={`text-xs ${rangeTextColor} hidden sm:inline`}>
                {' '}
                ({getCurrentRange(score)})
              </span>
            </span>
          </div>
        </div>
      </div>
      
      {/* The main bar visualization */}
      <div className="relative h-16 mt-6">
        <div className="absolute w-full px-6">
          {/* Background track */}
          <div className={`w-full h-4 ${barTrackColor} rounded-full relative`}>
            {/* Range markers */}
            <div className="absolute w-full top-[-20px] left-0">
              {ranges.map((range, index) => (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2"
                  style={{
                    left: `${range.position}%`,
                    textAlign:
                      index === 0 
                        ? 'left' 
                        : index === ranges.length - 1 
                          ? 'right' 
                          : 'center',
                    transform:
                      index === 0
                        ? 'translateX(0)'
                        : index === ranges.length - 1
                          ? 'translateX(-100%)'
                          : 'translateX(-50%)'
                  }}
                >
                  <div className={`text-xs whitespace-nowrap ${rangeTextColor} font-medium`}>
                    {range.label}
                  </div>
                  <div className={`h-4 w-0.5 ${rangeLineColor} mt-1`} />
                </div>
              ))}
            </div>
          </div>

          {/* Remove any additional percentage labels that might be showing up */}
          <style jsx>{`
            .comparison-text, .percentage-label, .above-average-text {
              display: none !important;
            }
          `}</style>

          {/* Current Score Marker */}
          <div 
            className={`absolute h-6 w-1.5 -top-1 rounded-full bg-white z-10`}
            style={{ 
              left: `${score}%`,
              boxShadow: darkMode ? '0 0 0 2px rgba(255,255,255,0.2)' : '0 0 0 2px rgba(0,0,0,0.1)'
            }}
          />

          {/* The "comparison" portion of the bar if we have an average */}
          {shouldShowAverage ? (
            <div
              className={`absolute h-4 ${comparisonColor} rounded-full top-0 transition-all duration-300`}
              style={{
                width: `${Math.abs(score - averageScore)}%`,
                left: barDirection === 'left' ? `${score}%` : `${averageScore}%`,
                opacity
              }}
            />
          ) : (
            // If no average, show a single bar
            <div
              className={`absolute h-4 bg-indigo-600 rounded-full top-0 transition-all duration-300`}
              style={{
                width: `${score}%`,
                opacity
              }}
            />
          )}

          {/* Vertical line + label for "Course avg" */}
          {shouldShowAverage && (
            <>
              <div
                className={`
                  absolute h-7 w-0.5 -top-1.5
                  ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}
                `}
                style={{ left: `${averageScore}%` }}
              />
              <div
                className={`
                  absolute text-xs transform -translate-x-1/2 -top-6 px-1 py-0.5 rounded whitespace-nowrap
                  ${darkMode ? 'text-white bg-gray-700' : 'text-gray-700 bg-gray-100'}
                `}
                style={{ left: `${averageScore}%` }}
              >
                Course avg: {averageScore.toFixed(1)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==================================
   NoDataMessage (Supports darkMode)
   ================================== */
const NoDataMessage = ({ type = "analytics", darkMode = false }) => (
  <div
    className={`
      flex flex-col items-center justify-center p-8 rounded-lg border
      ${darkMode
        ? 'bg-[#1C1F43] border-[#332F56] text-gray-200'
        : 'bg-gray-50 border-gray-100 text-gray-600'}
    `}
  >
    <Info className={darkMode ? 'w-8 h-8 text-gray-400 mb-3' : 'w-8 h-8 text-gray-400 mb-3'} />
    <p className="text-center font-medium">
      Not enough {type} data available yet.
      {type === "review_count" && " Check back after students submit their reviews."}
    </p>
  </div>
);

/* ======================================================
   ProfessorAnalytics (Main component with darkMode)
   ====================================================== */
const ProfessorAnalytics = ({
  analysis,
  courseId,
  darkMode = false
}) => {
  const [courseMetrics, setCourseMetrics] = useState(null);
  const [courseDocId, setCourseDocId] = useState(null);
  const [courseDepartment, setCourseDepartment] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const location = useLocation();

  // Attempt to fetch the course metrics for an overall "course average"
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

        const dept = courseId.match(/([A-Z]+)/)[0];
        setCourseDepartment(dept);

        const coursesRef = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesRef);
        
        const matchingDoc = coursesSnapshot.docs.find(doc =>
          doc.id.startsWith(normalizedId)
        );

        if (matchingDoc) {
          const data = matchingDoc.data();
          setCourseMetrics(data.metrics || null);
          setCourseDocId(matchingDoc.id);
        }
      } catch (error) {
        console.error('Error fetching course metrics:', error);
      }
    };

    fetchCourseMetrics();
  }, [courseId]);



  const handleCourseClick = (dept, courseId) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/departments/${dept}/courses/${courseId}`);
  };

  // Extract metrics from the analysis
  const {
    quality_score = 0,
    difficulty_score = 0,
    sentiment_score = 0,
    review_count = 0
  } = analysis || {};

  if (!analysis || review_count === 0) {
    return <NoDataMessage type="analytics" darkMode={darkMode} />;
  }

  // Interpretations (e.g., poor/fair/good/great/best)
  const qualityInterpretations = [
    { threshold: 0, label: "Poor" },
    { threshold: 25, label: "Fair" },
    { threshold: 50, label: "Good" },
    { threshold: 75, label: "Great" },
    { threshold: 100, label: "Best" }
  ];
  const difficultyInterpretations = [
    { threshold: 0, label: "Hardest" },
    { threshold: 25, label: "Hard" },
    { threshold: 50, label: "Medium" },
    { threshold: 75, label: "Light" },
    { threshold: 100, label: "Easy" }
  ];
  const sentimentInterpretations = [
    { threshold: 0, label: "Poor" },
    { threshold: 25, label: "Fair" },
    { threshold: 50, label: "Good" },
    { threshold: 75, label: "Great" },
    { threshold: 100, label: "Best" }
  ];

  // Container background & border
  const containerClasses = darkMode
    ? 'bg-[#1C1F43] text-white border-[#332F56]'
    : 'bg-white text-gray-900 border-gray-200';

  // Get the quality rating description
  const getQualityDescription = (score) => {
    if (score >= 80) return "Clear explanations and engaging teaching style.";
    if (score >= 60) return "Communicates concepts effectively.";
    if (score >= 40) return "Adequate teaching methods.";
    return "May struggle with clear explanations.";
  };

  // Get the difficulty rating description
  const getDifficultyDescription = (score) => {
    const easyScore = 100 - score; // Convert to "ease" score
    if (easyScore >= 80) return "Manageable workload with approachable assignments.";
    if (easyScore >= 60) return "Reasonable expectations with moderate challenge.";
    if (easyScore >= 40) return "Challenging but fair coursework.";
    return "Rigorous standards with demanding assignments.";
  };

  // Get the sentiment rating description
  const getSentimentDescription = (score) => {
    if (score >= 80) return "Highly positive student feedback.";
    if (score >= 60) return "Generally favorable reviews.";
    if (score >= 40) return "Mixed student feedback.";
    return "Students express some dissatisfaction.";
  };

  return (
    <div className={`rounded-xl shadow-sm border p-6 ${containerClasses}`}>
      {/* Top section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100/40 gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            Professor Performance
          </h3>
          <p className="text-sm">
            Based on {review_count} student {review_count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {courseDocId && courseDepartment && (
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                navigate(`/departments/${courseDepartment}/courses/${courseDocId}`);
              }}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${darkMode 
                  ? 'text-indigo-200 bg-indigo-900 hover:bg-indigo-800' 
                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}
              `}
            >
              View Course Details
            </button>
          )}
          {courseMetrics && (
            <div
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg
                ${darkMode 
                  ? 'bg-gray-700' 
                  : 'bg-gray-50'}
              `}
            >
              <TrendingUp 
                className={darkMode ? 'w-4 h-4 text-gray-300' : 'w-4 h-4 text-gray-400'}
              />
              <span className={darkMode ? 'text-sm text-gray-200' : 'text-sm text-gray-600'}>
                vs. Course Average
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Introduction */}
      <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-[#242659]' : 'bg-indigo-50'}`}>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Metrics calculated from student reviews. Higher scores always better. Bars show how this professor compares to others teaching the same course.
        </p>
      </div>

      {/* Score bars */}
      <div className="space-y-10 mt-8">
        {/* Teaching Quality */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Quality: 
              </span>
              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {getQualityDescription(quality_score)}
              </span>
            </div>
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              quality_score >= 75 ? (darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700') :
              quality_score >= 50 ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700') :
              quality_score >= 25 ? (darkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700') :
              (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
            }`}>
              {quality_score.toFixed(1)} / 100
            </span>
          </div>
          <ScoreIndicator
            score={quality_score}
            averageScore={courseMetrics?.quality_score}
            label=""
            interpretations={qualityInterpretations}
            reviewCount={review_count}
            showCourseAvg={true}
            darkMode={darkMode}
          />
        </div>

        {/* Teacher Difficulty (inverted) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Difficulty: 
              </span>
              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {getDifficultyDescription(difficulty_score)} <span className="italic text-xs">(Higher = Easier)</span>
              </span>
            </div>
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              (100-difficulty_score) >= 75 ? (darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700') :
              (100-difficulty_score) >= 50 ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700') :
              (100-difficulty_score) >= 25 ? (darkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700') :
              (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
            }`}>
              {(100-difficulty_score).toFixed(1)} / 100
            </span>
          </div>
          <ScoreIndicator
            score={100 - difficulty_score}
            averageScore={
              courseMetrics?.difficulty_score !== undefined
                ? 100 - courseMetrics.difficulty_score
                : undefined
            }
            label=""
            interpretations={difficultyInterpretations}
            reviewCount={review_count}
            showCourseAvg={true}
            courseDocId={courseDocId}
            courseDept={courseDepartment}
            onCourseClick={handleCourseClick}
            darkMode={darkMode}
          />
        </div>

        {/* Student Sentiment */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Sentiment: 
              </span>
              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {getSentimentDescription(sentiment_score)}
              </span>
            </div>
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              sentiment_score >= 75 ? (darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700') :
              sentiment_score >= 50 ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700') :
              sentiment_score >= 25 ? (darkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700') :
              (darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700')
            }`}>
              {sentiment_score.toFixed(1)} / 100
            </span>
          </div>
          <ScoreIndicator
            score={sentiment_score}
            averageScore={courseMetrics?.sentiment_score}
            label=""
            interpretations={sentimentInterpretations}
            reviewCount={review_count}
            showCourseAvg={true}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* Legend */}
      <div className={`mt-8 p-4 rounded-lg ${darkMode ? 'bg-[#242659]' : 'bg-gray-50'}`}>
        <h4 className={`text-xs font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>How to read:</h4>
        <ul className={`text-xs space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <li>• Bar shows professor's score (0-100)</li>
          <li>• Vertical line is course average</li>
          <li>• Darker portion shows difference from average</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfessorAnalytics;
