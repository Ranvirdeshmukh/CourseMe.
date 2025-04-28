import React, { useState, useMemo } from 'react';
import { Users, ChevronDown, ChevronUp, Search, Activity } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsUsersTab = ({ darkMode, viewerData = [], sessionData = [] }) => {
  const [sortField, setSortField] = useState('activity');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const cardBgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBgColor = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  
  // Process user data
  const userData = useMemo(() => {
    // Combine view and session data by user
    const userMap = new Map();
    
    // Process views
    viewerData.forEach(view => {
      if (!view.userId) return;
      
      if (!userMap.has(view.userId)) {
        userMap.set(view.userId, {
          userId: view.userId,
          userName: view.userName || 'Unknown User',
          userEmail: view.userEmail || 'No Email',
          viewCount: 0,
          sessionCount: 0,
          totalDuration: 0,
          lastActive: null,
          avgSessionDuration: 0,
          deviceTypes: new Set(),
          contentViewed: new Set(),
          profileUrl: view.profileUrl || null
        });
      }
      
      const userData = userMap.get(view.userId);
      userData.viewCount++;
      
      if (view.deviceType) {
        userData.deviceTypes.add(view.deviceType);
      }
      
      if (view.contentType && view.contentId) {
        userData.contentViewed.add(`${view.contentType}:${view.contentId}`);
      }
      
      if (view.timestamp) {
        const timestamp = new Date(view.timestamp);
        if (!userData.lastActive || timestamp > userData.lastActive) {
          userData.lastActive = timestamp;
        }
      }
    });
    
    // Process sessions
    sessionData.forEach(session => {
      if (!session.userId) return;
      
      if (!userMap.has(session.userId)) {
        userMap.set(session.userId, {
          userId: session.userId,
          userName: session.userName || 'Unknown User',
          userEmail: session.userEmail || 'No Email',
          viewCount: 0,
          sessionCount: 0,
          totalDuration: 0,
          lastActive: null,
          avgSessionDuration: 0,
          deviceTypes: new Set(),
          contentViewed: new Set(),
          profileUrl: session.profileUrl || null
        });
      }
      
      const userData = userMap.get(session.userId);
      userData.sessionCount++;
      userData.totalDuration += session.durationMs || 0;
      
      if (session.deviceType) {
        userData.deviceTypes.add(session.deviceType);
      }
      
      if (session.contentType && session.contentId) {
        userData.contentViewed.add(`${session.contentType}:${session.contentId}`);
      }
      
      if (session.endTime) {
        const timestamp = new Date(session.endTime);
        if (!userData.lastActive || timestamp > userData.lastActive) {
          userData.lastActive = timestamp;
        }
      }
    });
    
    // Calculate average session duration
    userMap.forEach(user => {
      if (user.sessionCount > 0) {
        user.avgSessionDuration = user.totalDuration / user.sessionCount;
      }
      
      // Convert sets to arrays for easier rendering
      user.deviceTypes = Array.from(user.deviceTypes);
      user.contentViewed = Array.from(user.contentViewed);
    });
    
    return Array.from(userMap.values());
  }, [viewerData, sessionData]);
  
  // Format duration from milliseconds
  const formatDuration = (ms) => {
    if (!ms) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  };
  
  // Format date relative to now
  const formatRelativeDate = (date) => {
    if (!date) return 'Never';
    
    try {
      const now = new Date();
      const timestamp = new Date(date);
      
      const diffMs = now - timestamp;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 30) {
        return timestamp.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      } else if (diffDays > 1) {
        return `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return 'Just now';
      }
    } catch (err) {
      return 'Unknown';
    }
  };
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filter by search term
  const filteredData = userData.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.userName && user.userName.toLowerCase().includes(searchLower)) ||
      (user.userEmail && user.userEmail.toLowerCase().includes(searchLower)) ||
      (user.userId && user.userId.toLowerCase().includes(searchLower))
    );
  });
  
  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = (a.userName || '').localeCompare(b.userName || '');
        break;
      case 'views':
        comparison = (a.viewCount || 0) - (b.viewCount || 0);
        break;
      case 'sessions':
        comparison = (a.sessionCount || 0) - (b.sessionCount || 0);
        break;
      case 'duration':
        comparison = (a.totalDuration || 0) - (b.totalDuration || 0);
        break;
      case 'lastActive':
        const timeA = a.lastActive ? a.lastActive.getTime() : 0;
        const timeB = b.lastActive ? b.lastActive.getTime() : 0;
        comparison = timeA - timeB;
        break;
      case 'activity':
        // Most active users based on combined views and sessions
        comparison = ((a.viewCount || 0) + (a.sessionCount || 0)) - 
                    ((b.viewCount || 0) + (b.sessionCount || 0));
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Use sample data if no real data available
  const displayData = sortedData.length > 0 ? sortedData : [
    { 
      userId: '1', 
      userName: 'Alex Johnson', 
      userEmail: 'ajohnson@dartmouth.edu', 
      viewCount: 45, 
      sessionCount: 12, 
      totalDuration: 3600000, // 1 hour
      lastActive: new Date(Date.now() - 1800000), // 30 minutes ago
      avgSessionDuration: 300000, // 5 minutes
      deviceTypes: ['desktop', 'mobile'],
      contentViewed: ['course:CS 101', 'professor:Smith, John']
    },
    { 
      userId: '2', 
      userName: 'Sarah Smith', 
      userEmail: 'ssmith@dartmouth.edu', 
      viewCount: 32, 
      sessionCount: 8, 
      totalDuration: 2400000, // 40 minutes
      lastActive: new Date(Date.now() - 86400000), // 1 day ago
      avgSessionDuration: 300000, // 5 minutes
      deviceTypes: ['mobile'],
      contentViewed: ['professor:Smith, John', 'course:MATH 240']
    },
    { 
      userId: '3', 
      userName: 'Michael Brown', 
      userEmail: 'mbrown@dartmouth.edu', 
      viewCount: 18, 
      sessionCount: 5, 
      totalDuration: 1800000, // 30 minutes
      lastActive: new Date(Date.now() - 172800000), // 2 days ago
      avgSessionDuration: 360000, // 6 minutes
      deviceTypes: ['desktop'],
      contentViewed: ['course:MATH 240', 'course:PHYS 110']
    },
    { 
      userId: '4', 
      userName: 'Emily Davis', 
      userEmail: 'edavis@dartmouth.edu', 
      viewCount: 12, 
      sessionCount: 3, 
      totalDuration: 900000, // 15 minutes
      lastActive: new Date(Date.now() - 259200000), // 3 days ago
      avgSessionDuration: 300000, // 5 minutes
      deviceTypes: ['tablet'],
      contentViewed: ['professor:Johnson, Sarah']
    },
    { 
      userId: '5', 
      userName: 'James Wilson', 
      userEmail: 'jwilson@dartmouth.edu', 
      viewCount: 8, 
      sessionCount: 2, 
      totalDuration: 600000, // 10 minutes
      lastActive: new Date(Date.now() - 345600000), // 4 days ago
      avgSessionDuration: 300000, // 5 minutes
      deviceTypes: ['mobile'],
      contentViewed: ['course:PHYS 110']
    },
  ];
  
  // Prepare chart data for top users
  const chartData = {
    labels: displayData.slice(0, 5).map(user => user.userName || 'Unknown'),
    datasets: [
      {
        label: 'Page Views',
        data: displayData.slice(0, 5).map(user => user.viewCount || 0),
        backgroundColor: darkMode ? 'rgba(102, 126, 234, 0.6)' : 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1,
      },
      {
        label: 'Sessions',
        data: displayData.slice(0, 5).map(user => user.sessionCount || 0),
        backgroundColor: darkMode ? 'rgba(236, 72, 153, 0.6)' : 'rgba(236, 72, 153, 0.8)',
        borderColor: 'rgba(236, 72, 153, 1)',
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
  
  // Helper to render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline-block ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Users Chart */}
      <div className={`${cardBgColor} rounded-lg shadow-md p-4`}>
        <h3 className={`${textColor} text-lg font-semibold mb-4 flex items-center`}>
          <Activity className="h-5 w-5 mr-2" />
          Most Active Users
        </h3>
        <div className="h-60">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
      
      {/* User Table */}
      <div className={`${cardBgColor} rounded-lg shadow-md`}>
        <div className="p-4 border-b ${borderColor} flex justify-between items-center">
          <h3 className={`${textColor} text-lg font-semibold flex items-center`}>
            <Users className="h-5 w-5 mr-2" />
            User Analytics
          </h3>
          <div className={`relative rounded-md shadow-sm max-w-xs`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className={`pl-10 block w-full rounded-md sm:text-sm border-gray-300 py-2 ${
                darkMode 
                  ? 'bg-gray-700 text-white border-gray-600 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-white text-gray-900 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}>
              <tr>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center">
                    User {renderSortIcon('name')}
                  </span>
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                  onClick={() => handleSort('views')}
                >
                  <span className="flex items-center">
                    Views {renderSortIcon('views')}
                  </span>
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                  onClick={() => handleSort('sessions')}
                >
                  <span className="flex items-center">
                    Sessions {renderSortIcon('sessions')}
                  </span>
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                  onClick={() => handleSort('duration')}
                >
                  <span className="flex items-center">
                    Total Time {renderSortIcon('duration')}
                  </span>
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                  onClick={() => handleSort('lastActive')}
                >
                  <span className="flex items-center">
                    Last Active {renderSortIcon('lastActive')}
                  </span>
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${secondaryTextColor}`}
                >
                  Devices
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${borderColor}`}>
              {displayData.map((user, index) => (
                <tr 
                  key={user.userId || index} 
                  className={`${hoverBgColor} transition-colors duration-150`}
                >
                  <td className={`px-6 py-4 whitespace-nowrap`}>
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${textColor}`}>{user.userName || 'Unnamed User'}</span>
                      <span className={`text-xs ${secondaryTextColor}`}>{user.userEmail || 'No Email'}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor} font-medium`}>
                    {user.viewCount || 0}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor} font-medium`}>
                    {user.sessionCount || 0}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                    {formatDuration(user.totalDuration)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextColor}`}>
                    {formatRelativeDate(user.lastActive)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap`}>
                    <div className="flex space-x-1">
                      {user.deviceTypes.map((device, idx) => (
                        <span 
                          key={idx}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            device === 'desktop'
                              ? (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
                              : device === 'mobile'
                                ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                                : (darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800')
                          }`}
                        >
                          {device}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsUsersTab;
