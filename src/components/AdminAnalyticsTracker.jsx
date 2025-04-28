import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getRecentAnalyticsViews, 
  checkUserIsAdmin, 
  getUserAnalyticsData, 
  testCreateAnalyticsSession 
} from '../services/analyticsService';
import { format } from 'date-fns';
import { Snackbar, Alert } from '@mui/material';

// Import our new components
import AnalyticsSidebar from './analytics/AnalyticsSidebar';
import AnalyticsTabs from './analytics/AnalyticsTabs';
import AnalyticsOverview from './analytics/AnalyticsOverview';
import AnalyticsViewsTab from './analytics/AnalyticsViewsTab';
import AnalyticsSessionsTab from './analytics/AnalyticsSessionsTab';
import AnalyticsUsersTab from './analytics/AnalyticsUsersTab';

const AdminAnalyticsTracker = ({ darkMode }) => {
  // State management
  const [viewerData, setViewerData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, professor, course
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, views, sessions, users
  const [dateRange, setDateRange] = useState('last7days');
  const [usersList, setUsersList] = useState([]);
  const [statsData, setStatsData] = useState({
    totalViews: 0,
    activeUsers: 0,
    avgDuration: '0s'
  });
  
  // Snackbar state
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has admin privileges
  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setIsLoading(false);
        setError('You must be logged in to view this page');
        return;
      }
      
      try {
        const adminStatus = await checkUserIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          setError('You do not have permission to access this page');
        }
      } catch (err) {
        setError('Error verifying admin status');
        console.error('Error checking admin status:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAdminStatus();
  }, [currentUser]);
  
  // Redirect non-admins
  useEffect(() => {
    if (!isLoading && !isAdmin && error) {
      // Redirect after a short delay to allow the error to be seen
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAdmin, error, navigate]);
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!isAdmin) return;
      
      setIsLoading(true);
      try {
        // Fetch views data
        let viewsData;
        if (selectedUser) {
          viewsData = await getUserAnalyticsData(selectedUser);
        } else {
          viewsData = await getRecentAnalyticsViews(100); // Limit to last 100 views
        }
        
        // Apply content type filter if needed
        if (filter !== 'all') {
          viewsData = viewsData.filter(item => item.contentType === filter);
        }
        
        // Format dates for display
        viewsData = viewsData.map(item => ({
          ...item,
          formattedTime: item.timestamp 
            ? format(new Date(item.timestamp instanceof Date ? item.timestamp : item.timestamp.toDate?.() || item.timestamp), 'MMM d, h:mm a')
            : 'Unknown time'
        }));
        
        setViewerData(viewsData);
        
        // Extract unique users for filtering
        const users = Array.from(new Set(viewsData.map(item => item.userId)))
          .map(userId => {
            const userItems = viewsData.filter(item => item.userId === userId);
            return {
              id: userId,
              name: userItems[0]?.userName || 'Unknown User',
              email: userItems[0]?.userEmail || 'No Email'
            };
          })
          .filter(user => user.id); // Filter out undefined user IDs
        
        setUsersList(users);
        
        // Calculate stats data
        setStatsData({
          totalViews: viewsData.length,
          activeUsers: users.length,
          avgDuration: '2m 34s' // Placeholder, would calculate from actual session data
        });
        
        // TODO: Fetch actual session data from Firestore
        // For now, we'll use placeholder data
        const mockSessionData = [
          { 
            id: 'session1', 
            userId: viewsData[0]?.userId,
            userName: viewsData[0]?.userName,
            userEmail: viewsData[0]?.userEmail,
            contentType: 'course', 
            contentId: 'CS 101', 
            deviceType: 'desktop', 
            startTime: new Date(Date.now() - 1800000), 
            endTime: new Date(Date.now() - 1500000),
            durationMs: 300000
          },
          { 
            id: 'session2', 
            userId: viewsData[1]?.userId,
            userName: viewsData[1]?.userName,
            userEmail: viewsData[1]?.userEmail,
            contentType: 'professor', 
            contentId: 'Smith, John', 
            deviceType: 'mobile', 
            startTime: new Date(Date.now() - 3600000), 
            endTime: new Date(Date.now() - 3300000),
            durationMs: 300000
          }
        ];
        
        setSessionData(mockSessionData);
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
      
      // Set up interval to refresh data every minute
      const intervalId = setInterval(fetchAnalyticsData, 60000);
      return () => clearInterval(intervalId);
    }
  }, [isAdmin, filter, selectedUser]);
  
  // Handle test session creation
  const handleTestSessionCreate = async () => {
    try {
      const docId = await testCreateAnalyticsSession();
      if (docId) {
        setSnackbarMessage(`Test session created successfully! Document ID: ${docId}`);
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Failed to create test session. Check console for details.');
        setSnackbarSeverity('error');
      }
      setShowSnackbar(true);
      
      // No need to refresh here - the button will do that
    } catch (error) {
      console.error('Error in test session creation:', error);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };
  
  // Handle data refresh
  const handleRefreshData = () => {
    // Re-fetch data
    if (isAdmin) {
      // Use the existing useEffect dependencies to trigger a refresh
      setFilter(filter);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          <h2 className="text-2xl font-bold mb-4">Access Error</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to home page...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-4 sm:p-6 min-h-screen ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Monitor user activity and engagement across the platform
        </p>
      </div>
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <AnalyticsSidebar 
            darkMode={darkMode}
            filter={filter}
            setFilter={setFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            usersList={usersList}
            handleRefreshData={handleRefreshData}
            statsData={statsData}
          />
          
          {/* Test Session Button */}
          <div className={`mt-4 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`${darkMode ? 'text-white' : 'text-gray-800'} text-lg font-semibold mb-3`}>
              Admin Tools
            </h3>
            <button
              onClick={handleTestSessionCreate}
              className={`w-full py-2 px-4 rounded-md transition-colors 
                bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Test Session
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <AnalyticsTabs 
            darkMode={darkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <AnalyticsOverview 
                darkMode={darkMode}
                viewerData={viewerData}
              />
            )}
            
            {activeTab === 'views' && (
              <AnalyticsViewsTab 
                darkMode={darkMode}
                viewerData={viewerData}
              />
            )}
            
            {activeTab === 'sessions' && (
              <AnalyticsSessionsTab 
                darkMode={darkMode}
                sessionData={sessionData}
              />
            )}
            
            {activeTab === 'users' && (
              <AnalyticsUsersTab 
                darkMode={darkMode}
                viewerData={viewerData}
                sessionData={sessionData}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminAnalyticsTracker;
