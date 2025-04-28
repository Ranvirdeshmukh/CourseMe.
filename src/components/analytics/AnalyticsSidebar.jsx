import React from 'react';
import { Filter, Calendar, User } from 'lucide-react';

const AnalyticsSidebar = ({ 
  darkMode, 
  filter, 
  setFilter, 
  dateRange, 
  setDateRange, 
  selectedUser, 
  setSelectedUser,
  usersList,
  handleRefreshData,
  statsData
}) => {
  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const accentColor = 'text-indigo-500';
  
  return (
    <div className={`${bgColor} shadow-lg rounded-lg p-4 mb-4`}>
      <div className="mb-6">
        <h3 className={`${textColor} text-lg font-semibold mb-3 flex items-center`}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </h3>
        
        <div className="space-y-4">
          {/* Content Type Filter */}
          <div>
            <label className={`block ${textColor} text-sm font-medium mb-2`}>Content Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 text-sm rounded-md ${
                  filter === 'all' 
                    ? 'bg-indigo-600 text-white' 
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('professor')}
                className={`px-3 py-2 text-sm rounded-md ${
                  filter === 'professor' 
                    ? 'bg-indigo-600 text-white' 
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Professor
              </button>
              <button
                onClick={() => setFilter('course')}
                className={`px-3 py-2 text-sm rounded-md ${
                  filter === 'course' 
                    ? 'bg-indigo-600 text-white' 
                    : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Course
              </button>
            </div>
          </div>
          
          {/* User Filter */}
          <div>
            <label className={`block ${textColor} text-sm font-medium mb-2 flex items-center`}>
              <User className="w-4 h-4 mr-1" />
              Filter by User
            </label>
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value || null)}
              className={`w-full px-3 py-2 text-sm rounded-md ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 border-gray-600' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              } border`}
            >
              <option value="">All Users</option>
              {usersList && usersList.map((user, index) => (
                <option key={user.id || index} value={user.id}>
                  {user.name || user.email || user.id}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Range Filter - simplified for now */}
          <div>
            <label className={`block ${textColor} text-sm font-medium mb-2 flex items-center`}>
              <Calendar className="w-4 h-4 mr-1" />
              Time Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-md ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 border-gray-600' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              } border`}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="allTime">All Time</option>
            </select>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefreshData}
            className={`w-full mt-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors`}
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className={`pt-4 border-t ${borderColor}`}>
        <h3 className={`${textColor} text-lg font-semibold mb-3`}>Quick Stats</h3>
        
        <div className="space-y-3">
          <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Views</p>
            <p className={`text-xl font-semibold ${textColor}`}>{statsData?.totalViews || 0}</p>
          </div>
          
          <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Users</p>
            <p className={`text-xl font-semibold ${textColor}`}>{statsData?.activeUsers || 0}</p>
          </div>
          
          <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg. Session Duration</p>
            <p className={`text-xl font-semibold ${textColor}`}>{statsData?.avgDuration || '0s'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSidebar;
