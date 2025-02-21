import { collection, getDocs, getFirestore, limit, orderBy, query } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
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
      const professorsRef = collection(db, 'professor');
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
    <div className="min-h-screen bg-[#F5F5F7] px-6 py-8">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto mb-16 text-center">
        <h1 className="text-5xl font-semibold text-[#1D1D1F] mb-4">Professor Directory</h1>
        <p className="text-xl text-[#86868B] max-w-2xl mx-auto">
          Explore our distinguished faculty members and academic departments.
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="relative">
          <input
            type="text"
            placeholder="Search professors or departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all text-lg bg-white shadow-sm backdrop-blur-xl bg-opacity-80"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#86868B] w-5 h-5" />
        </div>
      </div>

      {/* Top Departments Section */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-2xl font-semibold text-[#1D1D1F] mb-8">Featured Departments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topDepartments.map((dept) => (
            <div 
              key={dept.name}
              onClick={() => handleDepartmentClick(dept.name)}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-[#E8E8ED]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">{dept.name}</h3>
                  <p className="text-sm text-[#86868B] mt-1">{dept.professorCount} Professors</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-[#0071E3] rounded-full">
                  <span className="text-white font-medium text-sm">
                    {dept.avgRating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-[#86868B]">{dept.reviewCount} Reviews</div>
                <div className="mt-2 w-full bg-[#E8E8ED] rounded-full h-1">
                  <div 
                    className="h-1 rounded-full bg-[#0071E3]"
                    style={{ width: `${(dept.avgRating / 100) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Professors Section */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-[#1D1D1F] mb-8">Outstanding Professors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topProfessors.map((prof) => (
            <div 
              key={prof.id}
              onClick={() => handleProfessorClick(prof.id)}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-[#E8E8ED]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0071E3] to-[#40A9FF] flex items-center justify-center text-white font-medium text-lg shadow-lg">
                  {prof.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">{prof.name}</h3>
                  <p className="text-sm text-[#86868B]">{prof.contact_info?.title || 'Professor'}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#86868B]">{prof.reviewCount} Reviews</span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-semibold text-[#1D1D1F]">
                      {(prof.rating / 20).toFixed(1)}
                    </span>
                    <span className="text-sm text-[#86868B]">/5.0</span>
                  </div>
                </div>
                <Progress 
                  value={(prof.rating / 100) * 100} 
                  className="mt-2 h-1 bg-[#E8E8ED]"
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


