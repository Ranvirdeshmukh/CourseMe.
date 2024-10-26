import React from 'react';
import { TrendingUp, ThumbsUp, Scale, Users, Brain, BookOpen } from 'lucide-react';

const getScoreColor = (score) => {
  if (score >= 75) {
    const greenIntensity = Math.min((score - 75) * 4, 100);
    return `bg-gradient-to-r from-green-400 to-emerald-500 opacity-${Math.round(greenIntensity)}`;
  } else if (score >= 25) {
    const yellowness = (score - 25) * 2;
    return score > 50 
      ? `bg-gradient-to-r from-yellow-400 to-green-400 opacity-${Math.round(yellowness)}`
      : `bg-gradient-to-r from-orange-400 to-yellow-400 opacity-${Math.round(yellowness)}`;
  } else {
    const redIntensity = Math.min((25 - score) * 4, 100);
    return `bg-gradient-to-r from-red-500 to-orange-400 opacity-${Math.round(redIntensity)}`;
  }
};

const ScoreIndicator = ({ score, label, icon: Icon, interpretations }) => {
  if (!score && score !== 0) return null;

  const getRange = (score) => {
    if (score >= 80) return interpretations[4];
    if (score >= 60) return interpretations[3];
    if (score >= 40) return interpretations[2];
    if (score >= 20) return interpretations[1];
    return interpretations[0];
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm text-gray-600">
          {score.toFixed(1)}
          <span className="text-xs text-gray-500 ml-1">({getRange(score)})</span>
        </span>
      </div>
      
      <div className="relative h-20">
        <div className="absolute w-full top-8 px-6">
          <div className="w-full h-3 bg-gray-100 rounded-full relative">
            <div
              className={`absolute h-3 ${getScoreColor(score)} rounded-full top-0 transition-all duration-300`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseAnalytics = ({ metrics }) => {
  // Check if metrics exists and has valid data
  const hasValidData = metrics && (
    metrics.difficulty_score > 0 ||
    metrics.quality_score > 0 ||
    metrics.sentiment_score > 0 ||
    metrics.workload_score > 0 ||
    metrics.numOfReviews > 0
  );

  if (!hasValidData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">Course Analytics</h3>
            <p className="text-sm text-gray-500">Based on student reviews</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500 text-center">
            Not enough data to generate course analytics. Check back after more students review the course.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">Course Analytics</h3>
          <p className="text-sm text-gray-500">
            Based on {metrics.numOfReviews} student {metrics.numOfReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Course statistics</span>
        </div>
      </div>

      {/* Summary section */}
      {metrics.summary && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 leading-relaxed">{metrics.summary}</p>
        </div>
      )}

      <div className="space-y-12 mt-6">
        <ScoreIndicator 
          score={metrics.quality_score || 0}
          label="Course Quality"
          icon={ThumbsUp}
          interpretations={["Poor", "Fair", "Good", "Great", "Excellent"]}
        />
        <ScoreIndicator 
          score={100 - (metrics.difficulty_score || 0)}
          label="Course Difficulty"
          icon={Scale}
          interpretations={["Very Hard", "Hard", "Moderate", "Manageable", "Easy"]}
        />
        <ScoreIndicator 
          score={metrics.workload_score || 0}
          label="Workload"
          icon={BookOpen}
          interpretations={["Heavy", "Substantial", "Moderate", "Light", "Very Light"]}
        />
        <ScoreIndicator 
          score={metrics.sentiment_score || 0}
          label="Student Sentiment"
          icon={Users}
          interpretations={["Negative", "Mixed-", "Neutral", "Mixed+", "Positive"]}
        />
      </div>
    </div>
  );
};

export default CourseAnalytics;