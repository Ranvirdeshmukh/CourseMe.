import React, { useState } from 'react';
import { Clock, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { differenceInSeconds, formatDistance } from 'date-fns';

const AnalyticsSessionsTab = ({ darkMode, sessionData = [] }) => {
  const [sortField, setSortField] = useState('duration');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const secondaryTextColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const cardBgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const tableBgColor = darkMode ? 'bg-gray-900/50' : 'bg-gray-50';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBgColor = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Format duration from milliseconds
  const formatDuration = (ms) => {
    if (!ms) return 'Unknown';
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  };
  
  // Filter by search term
  const filteredData = sessionData.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.userName && item.userName.toLowerCase().includes(searchLower)) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(searchLower)) ||
      (item.contentType && item.contentType.toLowerCase().includes(searchLower)) ||
      (item.contentId && item.contentId.toLowerCase().includes(searchLower))
    );
  });
  
  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'startTime':
        const startTimeA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const startTimeB = b.startTime ? new Date(b.startTime).getTime() : 0;
        comparison = startTimeA - startTimeB;
        break;
      case 'endTime':
        const endTimeA = a.endTime ? new Date(a.endTime).getTime() : 0;
        const endTimeB = b.endTime ? new Date(b.endTime).getTime() : 0;
        comparison = endTimeA - endTimeB;
        break;
      case 'duration':
        comparison = (a.durationMs || 0) - (b.durationMs || 0);
        break;
      case 'user':
        comparison = (a.userName || '').localeCompare(b.userName || '');
        break;
      case 'content':
        comparison = `${a.contentType || ''}:${a.contentId || ''}`.localeCompare(`${b.contentType || ''}:${b.contentId || ''}`);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Use sample data if no real data available
  const displayData = sortedData.length > 0 ? sortedData : [
    { 
      id: 1, 
      userName: 'Alex Johnson', 
      userEmail: 'ajohnson@dartmouth.edu', 
      contentType: 'course', 
      contentId: 'CS 101', 
      deviceType: 'desktop', 
      startTime: new Date(Date.now() - 1800000), 
      endTime: new Date(Date.now() - 1500000),
      durationMs: 300000
    },
    { 
      id: 2, 
      userName: 'Sarah Smith', 
      userEmail: 'ssmith@dartmouth.edu', 
      contentType: 'professor', 
      contentId: 'Smith, John', 
      deviceType: 'mobile', 
      startTime: new Date(Date.now() - 3600000), 
      endTime: new Date(Date.now() - 3300000),
      durationMs: 300000
    },
    { 
      id: 3, 
      userName: 'Michael Brown', 
      userEmail: 'mbrown@dartmouth.edu', 
      contentType: 'course', 
      contentId: 'MATH 240', 
      deviceType: 'desktop', 
      startTime: new Date(Date.now() - 86400000), 
      endTime: new Date(Date.now() - 85200000),
      durationMs: 1200000
    },
    { 
      id: 4, 
      userName: 'Emily Davis', 
      userEmail: 'edavis@dartmouth.edu', 
      contentType: 'professor', 
      contentId: 'Johnson, Sarah', 
      deviceType: 'tablet', 
      startTime: new Date(Date.now() - 86400000 * 2), 
      endTime: new Date(Date.now() - 86400000 * 2 + 1800000),
      durationMs: 1800000
    },
    { 
      id: 5, 
      userName: 'James Wilson', 
      userEmail: 'jwilson@dartmouth.edu', 
      contentType: 'course', 
      contentId: 'PHYS 110', 
      deviceType: 'mobile', 
      startTime: new Date(Date.now() - 86400000 * 3), 
      endTime: new Date(Date.now() - 86400000 * 3 + 600000),
      durationMs: 600000
    },
  ];
  
  // Helper to render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline-block ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };
  
  // Helper to format date
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    
    try {
      const d = new Date(date);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };
  
  // Get duration color based on length
  const getDurationColor = (ms) => {
    if (!ms) return darkMode ? 'text-gray-400' : 'text-gray-500';
    
    if (ms < 30000) { // Less than 30s
      return darkMode ? 'text-red-300' : 'text-red-600';
    } else if (ms < 300000) { // Less than 5min
      return darkMode ? 'text-yellow-300' : 'text-yellow-600';
    } else {
      return darkMode ? 'text-green-300' : 'text-green-600';
    }
  };

  return (
    <div className={`${cardBgColor} rounded-lg shadow-md`}>
      <div className="p-4 border-b ${borderColor}">
        <div className="flex justify-between items-center">
          <h3 className={`${textColor} text-lg font-semibold flex items-center`}>
            <Clock className="h-5 w-5 mr-2" />
            Session Analytics
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
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={tableBgColor}>
            <tr>
              <th 
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                onClick={() => handleSort('user')}
              >
                <span className="flex items-center">
                  User {renderSortIcon('user')}
                </span>
              </th>
              <th 
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                onClick={() => handleSort('content')}
              >
                <span className="flex items-center">
                  Content {renderSortIcon('content')}
                </span>
              </th>
              <th 
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                onClick={() => handleSort('startTime')}
              >
                <span className="flex items-center">
                  Start Time {renderSortIcon('startTime')}
                </span>
              </th>
              <th 
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                onClick={() => handleSort('endTime')}
              >
                <span className="flex items-center">
                  End Time {renderSortIcon('endTime')}
                </span>
              </th>
              <th 
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                onClick={() => handleSort('duration')}
              >
                <span className="flex items-center">
                  Duration {renderSortIcon('duration')}
                </span>
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${secondaryTextColor}`}>
                Device
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderColor}`}>
            {displayData.map((session, index) => (
              <tr 
                key={session.id || index} 
                className={`${hoverBgColor} transition-colors duration-150`}
              >
                <td className={`px-6 py-4 whitespace-nowrap`}>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${textColor}`}>{session.userName || 'Unnamed User'}</span>
                    <span className={`text-xs ${secondaryTextColor}`}>{session.userEmail || session.userId || 'No Email'}</span>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap`}>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${textColor}`}>{session.contentId || 'Unknown Content'}</span>
                    <span className={`text-xs ${secondaryTextColor} capitalize`}>{session.contentType || 'Unknown Type'}</span>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextColor}`}>
                  {formatDate(session.startTime)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextColor}`}>
                  {formatDate(session.endTime)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getDurationColor(session.durationMs)}`}>
                  {formatDuration(session.durationMs)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                  <div className="flex items-center">
                    {session.deviceType === 'mobile' ? (
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : session.deviceType === 'tablet' ? (
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span className="capitalize">{session.deviceType || 'Unknown'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsSessionsTab;
