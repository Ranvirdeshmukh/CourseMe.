import React, { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Progress } from '../components/ui/progress';

const LoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
    <div className="w-[300px]">
      <Progress value={33} className="h-2" />
    </div>
    <div className="text-sm text-gray-500">Loading professors...</div>
  </div>
);

const ProfessorDirectory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [topDepartments, setTopDepartments] = useState([]);
  const [topProfessors, setTopProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    fetchTopProfessorsAndDepartments();
  }, []);

  const fetchTopProfessorsAndDepartments = async () => {
    try {
      setLoading(true);
      
      // Fetch professors
      const professorsRef = collection(db, 'professors');
      const professorsQuery = query(
        professorsRef,
        orderBy('overall_analysis.metrics.review_count', 'desc'),
        limit(8)
      );
      
      const professorsSnapshot = await getDocs(professorsQuery);
      const professorsData = professorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rating: doc.data().overall_analysis.metrics.quality_score || 0,
        reviewCount: doc.data().overall_analysis.metrics.review_count || 0
      }));
      
      // Process departments data from professors
      const departmentStats = {};
      professorsSnapshot.docs.forEach(doc => {
        const profData = doc.data();
        Object.keys(profData.departments || {}).forEach(dept => {
          if (!departmentStats[dept]) {
            departmentStats[dept] = {
              name: dept,
              professorCount: 0,
              reviewCount: 0,
              totalRating: 0,
              ratingCount: 0
            };
          }
          departmentStats[dept].professorCount++;
          
          // Aggregate department reviews and ratings
          Object.values(profData.departments[dept] || {}).forEach(course => {
            if (course.analysis) {
              departmentStats[dept].reviewCount += course.reviews?.length || 0;
              if (course.analysis.metrics?.quality_score) {
                departmentStats[dept].totalRating += course.analysis.metrics.quality_score;
                departmentStats[dept].ratingCount++;
              }
            }
          });
        });
      });

      // Convert department stats to array and calculate averages
      const departmentsData = Object.values(departmentStats)
        .map(dept => ({
          ...dept,
          avgRating: dept.ratingCount > 0 ? dept.totalRating / dept.ratingCount : 0
        }))
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 8);

      setTopProfessors(professorsData);
      setTopDepartments(departmentsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfessorClick = (professorId) => {
    navigate(`/professors/${professorId}`);
  };

  const handleDepartmentClick = (departmentName) => {
    navigate(`/departments/${departmentName}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">{error}</p>
          <button 
            onClick={fetchTopProfessorsAndDepartments}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Search Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="relative">
          <input
            type="text"
            placeholder="Search professors or departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg bg-white shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Top Departments Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Top Departments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topDepartments.map((dept) => (
            <div 
              key={dept.name}
              onClick={() => handleDepartmentClick(dept.name)}
              className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{dept.professorCount} Professors</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-full">
                  <span className="text-indigo-600 font-semibold">
                    {dept.avgRating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600">{dept.reviewCount} Reviews</div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${(dept.avgRating / 100) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Professors Section */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Top Professors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topProfessors.map((prof) => (
            <div 
              key={prof.id}
              onClick={() => handleProfessorClick(prof.id)}
              className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                  {prof.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{prof.name}</h3>
                  <p className="text-sm text-gray-600">{prof.contact_info?.title || 'Professor'}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{prof.reviewCount} Reviews</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-indigo-600">
                      {(prof.rating / 20).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">/5.0</span>
                  </div>
                </div>
                <Progress 
                  value={(prof.rating / 100) * 100} 
                  className="mt-2 h-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfessorDirectory;