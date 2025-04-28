import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Activity, Users, Clock, Monitor } from 'lucide-react';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsOverview = ({ darkMode, viewerData = [] }) => {
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const cardBgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  
  // Prepare chart data
  const pageViewData = {
    labels: ['Last 7 Days'].map((_,i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Page Views',
        data: [12, 19, 8, 15, 25, 17, 10],
        backgroundColor: darkMode ? 'rgba(102, 126, 234, 0.6)' : 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
        bodyColor: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      }
    }
  };
  
  // Summary metrics
  const metrics = [
    { 
      title: 'Total Views', 
      value: viewerData.length || 36, 
      icon: <Activity className="h-5 w-5 text-indigo-500" />,
      change: '+12%',
      trend: 'up'
    },
    { 
      title: 'Unique Users', 
      value: Array.from(new Set(viewerData.map(d => d.userId))).length || 18, 
      icon: <Users className="h-5 w-5 text-blue-500" />,
      change: '+5%',
      trend: 'up'
    },
    { 
      title: 'Avg. Session Duration', 
      value: '3m 24s', 
      icon: <Clock className="h-5 w-5 text-emerald-500" />,
      change: '-2%',
      trend: 'down'
    },
    { 
      title: 'Popular Device', 
      value: 'Desktop', 
      icon: <Monitor className="h-5 w-5 text-purple-500" />,
      change: '84%',
      percent: true
    }
  ];
  
  // Most viewed content
  const topContent = Array.from(
    viewerData.reduce((acc, item) => {
      const key = `${item.contentType}:${item.contentId}`;
      if (!acc.has(key)) {
        acc.set(key, { 
          contentType: item.contentType, 
          contentId: item.contentId, 
          count: 0 
        });
      }
      acc.get(key).count++;
      return acc;
    }, new Map())
  )
  .map(([_, value]) => value)
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);
  
  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className={`${cardBgColor} rounded-lg shadow-md p-4`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm ${secondaryTextColor}`}>{metric.title}</p>
                <h4 className={`text-2xl font-semibold ${textColor} mt-1`}>{metric.value}</h4>
              </div>
              <div className="p-2 rounded-full bg-opacity-10 bg-indigo-100">
                {metric.icon}
              </div>
            </div>
            <div className={`flex items-center mt-3 text-sm ${
              metric.trend === 'up' 
                ? 'text-emerald-500' 
                : metric.trend === 'down' 
                  ? 'text-red-500' 
                  : 'text-gray-500'
            }`}>
              {metric.change}
              {metric.trend === 'up' && 
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              }
              {metric.trend === 'down' && 
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              }
              {metric.percent && <span className="ml-1">of users</span>}
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page Views Chart */}
        <div className={`${cardBgColor} rounded-lg shadow-md p-4 lg:col-span-2`}>
          <h3 className={`${textColor} text-lg font-semibold mb-4`}>Page Views Trend</h3>
          <div className="h-60">
            <Bar data={pageViewData} options={chartOptions} />
          </div>
        </div>
        
        {/* Top Content */}
        <div className={`${cardBgColor} rounded-lg shadow-md p-4`}>
          <h3 className={`${textColor} text-lg font-semibold mb-4`}>Most Viewed Content</h3>
          <div className="space-y-4">
            {(topContent.length > 0 ? topContent : [
              { contentType: 'course', contentId: 'CS 101', count: 32 },
              { contentType: 'professor', contentId: 'Smith, John', count: 28 },
              { contentType: 'course', contentId: 'MATH 240', count: 19 },
              { contentType: 'professor', contentId: 'Johnson, Sarah', count: 17 },
              { contentType: 'course', contentId: 'PHYS 110', count: 12 }
            ]).map((item, idx) => (
              <div key={idx} className={`flex justify-between items-center p-2 rounded-md ${
                darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
              }`}>
                <div className="flex items-center">
                  <span className={`inline-block w-6 h-6 rounded-full mr-3 text-xs flex items-center justify-center ${
                    idx === 0 ? 'bg-yellow-500 text-yellow-900' : 
                    idx === 1 ? 'bg-gray-400 text-gray-800' : 
                    idx === 2 ? 'bg-amber-600 text-amber-900' : 
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className={`font-medium ${textColor}`}>{item.contentId}</p>
                    <p className={`text-xs capitalize ${secondaryTextColor}`}>{item.contentType}</p>
                  </div>
                </div>
                <span className={`${textColor} text-sm font-semibold`}>{item.count} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className={`${cardBgColor} rounded-lg shadow-md p-4`}>
        <h3 className={`${textColor} text-lg font-semibold mb-4`}>Recent Activity</h3>
        <div className={`border-l-2 ${borderColor} ml-3 pl-6 space-y-6 relative before:absolute before:w-0.5 before:h-full before:left-0 before:top-0 ${darkMode ? 'before:bg-gray-700' : 'before:bg-gray-200'}`}>
          {(viewerData.slice(0, 5).length > 0 ? viewerData.slice(0, 5) : [
            { userName: 'Alex Johnson', userEmail: 'ajohnson@dartmouth.edu', contentType: 'course', contentId: 'CS 101', formattedTime: '10:32 AM' },
            { userName: 'Sarah Smith', userEmail: 'ssmith@dartmouth.edu', contentType: 'professor', contentId: 'Smith, John', formattedTime: '09:45 AM' },
            { userName: 'Michael Brown', userEmail: 'mbrown@dartmouth.edu', contentType: 'course', contentId: 'MATH 240', formattedTime: 'Yesterday' },
            { userName: 'Emily Davis', userEmail: 'edavis@dartmouth.edu', contentType: 'professor', contentId: 'Johnson, Sarah', formattedTime: 'Yesterday' },
            { userName: 'James Wilson', userEmail: 'jwilson@dartmouth.edu', contentType: 'course', contentId: 'PHYS 110', formattedTime: '2 days ago' }
          ]).map((item, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-8 mt-0.5">
                <div className={`h-3 w-3 rounded-full border-2 ${
                  darkMode ? 'border-gray-700 bg-indigo-500' : 'border-white bg-indigo-600'
                }`} />
              </div>
              <div>
                <p className={`${textColor} font-medium`}>
                  {item.userName || 'Anonymous User'} viewed <span className="capitalize">{item.contentType}</span> <span className="font-semibold">{item.contentId}</span>
                </p>
                <div className="flex justify-between mt-1">
                  <p className={`text-sm ${secondaryTextColor}`}>{item.userEmail || 'Unknown Email'}</p>
                  <p className={`text-sm ${secondaryTextColor}`}>{item.formattedTime || 'Unknown Time'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
