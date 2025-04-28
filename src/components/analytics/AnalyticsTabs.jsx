import React from 'react';
import { BarChart2, Clock, Eye, Users } from 'lucide-react';

const AnalyticsTabs = ({ darkMode, activeTab, setActiveTab }) => {
  const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const inactiveTextColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBgColor = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const activeBgColor = darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50';
  const activeTextColor = 'text-indigo-500';
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'views', label: 'Page Views', icon: <Eye className="h-4 w-4" /> },
    { id: 'sessions', label: 'Sessions', icon: <Clock className="h-4 w-4" /> },
    { id: 'users', label: 'User Activity', icon: <Users className="h-4 w-4" /> }
  ];
  
  return (
    <div className={`${bgColor} rounded-lg mb-6 flex`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            flex-1 py-3 px-2 sm:px-4 flex justify-center sm:justify-start items-center
            transition-colors rounded-md m-1
            ${activeTab === tab.id ? `${activeBgColor} ${activeTextColor}` : `${inactiveTextColor} ${hoverBgColor}`}
          `}
        >
          <div className="flex items-center">
            {tab.icon}
            <span className="ml-2 hidden sm:inline">{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AnalyticsTabs;
