import React, { useState } from 'react';
import { Eye, Search, ChevronDown, ChevronUp } from 'lucide-react';

const AnalyticsViewsTab = ({ darkMode, viewerData = [] }) => {
  const [sortField, setSortField] = useState('time');
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
  
  // Filter by search term
  const filteredData = viewerData.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.userName && item.userName.toLowerCase().includes(searchLower)) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(searchLower)) ||
      (item.contentType && item.contentType.toLowerCase().includes(searchLower)) ||
      (item.contentId && item.contentId.toLowerCase().includes(searchLower)) ||
      (item.pagePath && item.pagePath.toLowerCase().includes(searchLower))
    );
  });
  
  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'time':
        // Convert times to comparable values
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        comparison = timeA - timeB;
        break;
      case 'user':
        comparison = (a.userName || '').localeCompare(b.userName || '');
        break;
      case 'content':
        comparison = (a.contentType || '').localeCompare(b.contentType || '');
        break;
      case 'id':
        comparison = (a.contentId || '').localeCompare(b.contentId || '');
        break;
      case 'device':
        comparison = (a.deviceType || '').localeCompare(b.deviceType || '');
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Use sample data if no real data available
  const displayData = sortedData.length > 0 ? sortedData : [
    { id: 1, userName: 'Alex Johnson', userEmail: 'ajohnson@dartmouth.edu', contentType: 'course', contentId: 'CS 101', deviceType: 'desktop', formattedTime: '10:32 AM', pagePath: '/courses/cs101' },
    { id: 2, userName: 'Sarah Smith', userEmail: 'ssmith@dartmouth.edu', contentType: 'professor', contentId: 'Smith, John', deviceType: 'mobile', formattedTime: '09:45 AM', pagePath: '/professors/smith-john' },
    { id: 3, userName: 'Michael Brown', userEmail: 'mbrown@dartmouth.edu', contentType: 'course', contentId: 'MATH 240', deviceType: 'desktop', formattedTime: 'Yesterday', pagePath: '/courses/math240' },
    { id: 4, userName: 'Emily Davis', userEmail: 'edavis@dartmouth.edu', contentType: 'professor', contentId: 'Johnson, Sarah', deviceType: 'tablet', formattedTime: 'Yesterday', pagePath: '/professors/johnson-sarah' },
    { id: 5, userName: 'James Wilson', userEmail: 'jwilson@dartmouth.edu', contentType: 'course', contentId: 'PHYS 110', deviceType: 'mobile', formattedTime: '2 days ago', pagePath: '/courses/phys110' }
  ];
  
  // Helper to render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline-block ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  return (
    <div className={`${cardBgColor} rounded-lg shadow-md`}>
      <div className="p-4 border-b ${borderColor}">
        <div className="flex justify-between items-center">
          <h3 className={`${textColor} text-lg font-semibold flex items-center`}>
            <Eye className="h-5 w-5 mr-2" />
            Page Views
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
              placeholder="Search views..."
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
                onClick={() => handleSort('time')}
              >
                <span className="flex items-center">
                  Time {renderSortIcon('time')}
                </span>
              </th>
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
                  Content Type {renderSortIcon('content')}
                </span>
              </th>
              <th 
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                onClick={() => handleSort('id')}
              >
                <span className="flex items-center">
                  Content ID {renderSortIcon('id')}
                </span>
              </th>
              <th 
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${secondaryTextColor}`}
                onClick={() => handleSort('device')}
              >
                <span className="flex items-center">
                  Device {renderSortIcon('device')}
                </span>
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${secondaryTextColor}`}>
                Page
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderColor}`}>
            {displayData.map((view, index) => (
              <tr 
                key={view.id || index} 
                className={`${hoverBgColor} transition-colors duration-150`}
              >
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${secondaryTextColor}`}>
                  {view.formattedTime || 'Unknown'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap`}>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${textColor}`}>{view.userName || 'Unnamed User'}</span>
                    <span className={`text-xs ${secondaryTextColor}`}>{view.userEmail || view.userId}</span>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap`}>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${view.contentType === 'professor' 
                      ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                      : view.contentType === 'course'
                        ? (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
                        : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
                    }`}
                  >
                    {view.contentType || 'unknown'}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                  {view.contentId || 'Unknown'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                  <div className="flex items-center">
                    {view.deviceType === 'mobile' ? (
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : view.deviceType === 'tablet' ? (
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span className="capitalize">{view.deviceType || 'unknown'}</span>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                  {view.pagePath || 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsViewsTab;
