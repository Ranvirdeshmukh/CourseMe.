import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRecentAnalyticsViews, 
  checkUserIsAdmin, 
  getUserAnalyticsData 
} from '../services/analyticsService';
import { Info, Filter, Download, User, Calendar, Clock, Monitor, Smartphone, Tablet } from 'lucide-react';

const AdminAnalyticsTracker = ({ darkMode }) => {
  const [viewerData, setViewerData] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, professor, course
  const [selectedUser, setSelectedUser] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has admin privileges
  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const adminStatus = await checkUserIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
      } catch (err) {
        setError('Error verifying admin status');
        console.error('Error checking admin status:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAdminStatus();
  }, [currentUser]);
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!isAdmin) return;
      
      setIsLoading(true);
      try {
        let data;
        if (selectedUser) {
          data = await getUserAnalyticsData(selectedUser);
        } else {
          data = await getRecentAnalyticsViews(100);
        }
        
        // Apply content type filter if needed
        if (filter !== 'all') {
          data = data.filter(item => item.contentType === filter);
        }
        
        setViewerData(data);
      } catch (err) {
        setError('Error fetching analytics data');
        console.error('Error fetching analytics data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if the user is confirmed to be an admin
    if (isAdmin) {
      fetchAnalyticsData();
      
      // Set up interval to refresh data every 30 seconds
      const intervalId = setInterval(fetchAnalyticsData, 30000);
      return () => clearInterval(intervalId);
    }
  }, [isAdmin, filter, selectedUser]);
  
  // Handle user selection for filtering
  const handleUserFilter = async (userId) => {
    setSelectedUser(userId === selectedUser ? null : userId);
  };
  
  // Handle content type filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };
  
  // Export data to CSV
  const exportToCSV = () => {
    if (!viewerData.length) return;
    
    // Create CSV content
    const csvContent = [
      // CSV header
      ['Time', 'User', 'Email', 'Content Type', 'Content ID', 'Device', 'Page Path'].join(','),
      // CSV rows
      ...viewerData.map(view => [
        view.formattedTime || 'N/A',
        view.userName || 'N/A',
        view.userEmail || 'N/A',
        view.contentType || 'N/A',
        view.contentId || 'N/A',
        view.deviceType || 'N/A',
        view.pagePath || 'N/A'
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_data_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render device icon based on device type
  const renderDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className={darkMode ? 'w-4 h-4 text-gray-300' : 'w-4 h-4 text-gray-600'} />;
      case 'tablet':
        return <Tablet className={darkMode ? 'w-4 h-4 text-gray-300' : 'w-4 h-4 text-gray-600'} />;
      default:
        return <Monitor className={darkMode ? 'w-4 h-4 text-gray-300' : 'w-4 h-4 text-gray-600'} />;
    }
  };
  
  // Group data by user for showing stats
  const getUserStats = () => {
    const userMap = {};
    viewerData.forEach(view => {
      const userId = view.userId;
      if (!userMap[userId]) {
        userMap[userId] = {
          userId,
          userName: view.userName,
          userEmail: view.userEmail,
          viewCount: 0,
          lastView: view.timestamp?.toDate() || null,
          contentTypes: new Set()
        };
      }
      userMap[userId].viewCount++;
      userMap[userId].contentTypes.add(view.contentType);
    });
    
    return Object.values(userMap);
  };
  
  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <div className="flex items-center space-x-3">
          <Info className={darkMode ? 'w-5 h-5 text-red-400' : 'w-5 h-5 text-red-500'} />
          <h2 className="text-lg font-medium">Access Restricted</h2>
        </div>
        <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          You need administrator privileges to view the analytics dashboard.
        </p>
        <button
          onClick={() => navigate('/')}
          className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium 
          ${darkMode ? 'bg-indigo-700 text-white hover:bg-indigo-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <div className="flex items-center space-x-3">
          <Info className={darkMode ? 'w-5 h-5 text-red-400' : 'w-5 h-5 text-red-500'} />
          <h2 className="text-lg font-medium">Error</h2>
        </div>
        <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium 
          ${darkMode ? 'bg-indigo-700 text-white hover:bg-indigo-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          Retry
        </button>
      </div>
    );
  }
  
  const userStats = getUserStats();
  
  return (
    <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Real-time Analytics Viewer Tracking
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Monitoring exactly who accesses course and professor analytics
          </p>
        </div>
        
        <div className="flex space-x-2">
          <div className={`flex items-center space-x-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Filter className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={`text-sm border-none focus:ring-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
            >
              <option value="all">All Content</option>
              <option value="professor">Professors Only</option>
              <option value="course">Courses Only</option>
            </select>
          </div>
          
          <button
            onClick={exportToCSV}
            className={`flex items-center space-x-1 p-2 rounded-lg text-sm
            ${darkMode 
              ? 'bg-indigo-700 text-white hover:bg-indigo-600' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {/* User Stats */}
      <div className={`mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
        {userStats.slice(0, 6).map(user => (
          <div 
            key={user.userId}
            onClick={() => handleUserFilter(user.userId)}
            className={`p-4 rounded-lg border cursor-pointer transition-all
            ${selectedUser === user.userId 
              ? (darkMode ? 'bg-indigo-900 border-indigo-700' : 'bg-indigo-50 border-indigo-200') 
              : (darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50')}
            `}
          >
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <User className={darkMode ? 'w-4 h-4 text-gray-300' : 'w-4 h-4 text-gray-600'} />
                <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {user.userName || user.userEmail || user.userId.substring(0, 8)}
                </h3>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full
                ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-600'}`}>
                {user.viewCount} views
              </span>
            </div>
            <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Last active: {user.lastView ? user.lastView.toLocaleString() : 'Unknown'}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {Array.from(user.contentTypes).map(type => (
                <span 
                  key={type}
                  className={`text-xs px-2 py-0.5 rounded-full
                  ${type === 'professor' 
                    ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                    : (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')}`}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Data Table */}
      <div className={`rounded-lg border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Time</span>
                  </div>
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>User</span>
                  </div>
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Content Type</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Content ID</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  <div className="flex items-center space-x-1">
                    <Monitor className="w-3 h-3" />
                    <span>Device</span>
                  </div>
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Page</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {viewerData.length > 0 ? (
                viewerData.map((view) => (
                  <tr key={view.id} className={darkMode ? 'bg-gray-800' : 'bg-white'}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {view.formattedTime || 'Unknown'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{view.userName || 'Unnamed User'}</span>
                        <span className="text-xs">{view.userEmail || view.userId}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${view.contentType === 'professor' 
                          ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                          : (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')}`}
                      >
                        {view.contentType}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {view.contentId}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <div className="flex items-center space-x-1">
                        {renderDeviceIcon(view.deviceType)}
                        <span className="capitalize">{view.deviceType || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {view.pagePath || 'Unknown'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan="6" 
                    className={`px-6 py-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    No analytics data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsTracker;
