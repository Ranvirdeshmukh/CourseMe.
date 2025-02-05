import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Alert } from '@mui/material'; // or use your own alert if you want
import { Search } from 'lucide-react'; // if you want icons
// import your tailwind classes or config, etc.

const LayupCard = ({ course, darkMode, onClick }) => {
  // Example: If we had a difficulty or layup metric,
  // we could add a "MetricBadge" from your existing logic.
  // For simplicity, we’ll just show a “Layup Score”.
  
  // If you want to replicate the "MetricBadge" approach exactly,
  // you can copy that from your professor snippet as well.

  const handleCardClick = () => {
    onClick(course.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
        darkMode
          ? 'bg-[#1C1F43] text-white shadow-md hover:bg-[#24273c]'
          : 'bg-white text-gray-900 shadow-lg hover:shadow-xl'
      }`}
      style={{
        minWidth: '250px',
        maxWidth: '300px',
        boxShadow: darkMode
          ? '0 6px 16px rgba(255, 255, 255, 0.1)'
          : '0 6px 16px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Top row with course name */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">{course.name}</h3>
          {/* Distrib pills */}
          {course.distribs && Array.isArray(course.distribs) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {course.distribs.map((dist, idx) => (
                <span
                  key={idx}
                  className={
                    darkMode
                      ? 'text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-200'
                      : 'text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600'
                  }
                >
                  {dist}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layup Score or other metrics */}
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          Layup Score: {course.layup ?? 'N/A'}
        </span>
        <span
          className={`text-sm ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          Reviews: {course.numOfReviews ?? 0}
        </span>
      </div>
    </div>
  );
};

const TopLayupsScroller = ({ darkMode }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const db = getFirestore();

  // Example: fetch top 12 or 15 courses, sorted by layup desc
  useEffect(() => {
    const fetchTopLayups = async () => {
      try {
        const q = query(
          collection(db, 'courses'),
          orderBy('layup', 'desc'),
          limit(15)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            name: docData.name || 'Untitled',
            // If your "distribs" is stored as a comma-separated string,
            // convert it to an array:
            distribs: docData.distribs
              ? docData.distribs.split(',').map((d) => d.trim())
              : [],
            layup: docData.layup ?? 0,
            numOfReviews: docData.numOfReviews ?? 0,
          };
        });
        setCourses(data);
      } catch (err) {
        console.error('Error fetching top layups:', err);
        setError('Failed to load layups');
      } finally {
        setLoading(false);
      }
    };

    fetchTopLayups();
  }, [db]);

  const handleCardClick = (courseId) => {
    // Navigate to the course details route
    navigate(`/courses/${courseId}`);
  };

  return (
    <div
      className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex overflow-x-auto gap-4 pb-4 mb-8"
      // The above tailwind classes replicate the "full-bleed" approach:
      // w-screen => 100vw, shift it with left/right and negative margins
    >
      {loading ? (
        [...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-[250px] h-[140px] rounded-lg bg-gray-200 animate-pulse"
          />
        ))
      ) : error ? (
        <Alert severity="error" style={{ marginLeft: 16 }}>
          {error}
        </Alert>
      ) : (
        courses.map((course) => (
          <LayupCard
            key={course.id}
            course={course}
            darkMode={darkMode}
            onClick={handleCardClick}
          />
        ))
      )}
    </div>
  );
};

export default TopLayupsScroller;
