import { addDoc, collection, doc, getDoc, getFirestore, getDocs } from 'firebase/firestore';
import {
  Building, ChevronDown,
  ChevronUp, Flag, Globe, Info, Mail,
  Phone, Sparkles, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProfessorAnalytics from './ProfessorAnalytics';

/* ===========================
   Reusable Dark Mode Helpers
   =========================== */
const getCardClass = (darkMode) => {
  return darkMode
    ? 'bg-[#1C1F43] text-white border-[#332F56]'
    : 'bg-white/80 backdrop-blur-xl text-[#1D1D1F] border-[#E8E8ED]';
};

const getContainerStyle = (darkMode) => ({
  background: darkMode
    ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
    : '#F9F9F9',
  transition: 'background-color 0.3s ease, color 0.3s ease'
});

const getErrorContainerClass = (darkMode) => {
  return darkMode
    ? 'min-h-screen flex items-center justify-center p-4'
    : 'min-h-screen flex items-center justify-center bg-[#F9F9F9] p-4';
};

const getLoadingContainerClass = (darkMode) => {
  return darkMode
    ? 'min-h-screen flex items-center justify-center'
    : 'min-h-screen flex items-center justify-center bg-[#f9f9f9]';
};

/* ===========================
   DisplayTitle Component
   =========================== */
const DisplayTitle = ({ title }) => {
  if (!title) return null;
  
  const titles = title.split(';').map(t => t.trim()).filter(t => t);
  const firstTitle = titles[0];
  const hasMoreTitles = titles.length > 1;

  return (
    <div className="relative group">
      <p className="text-xl text-[#86868B] mt-1">
        {firstTitle}
        {hasMoreTitles && (
          <span className="ml-2 text-sm text-[#98989D] cursor-help">
            (+{titles.length - 1} more)
          </span>
        )}
      </p>
      {hasMoreTitles && (
        <div className="absolute left-0 top-full mt-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-4 hidden group-hover:block z-10 w-max max-w-lg border border-[#E8E8ED]">
          <ul className="space-y-2">
            {titles.map((title, index) => (
              <li key={index} className="text-[#1D1D1F]">{title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ===========================
   ContactInfo Component
   =========================== */
   const ContactInfo = ({ info, darkMode }) => {
    if (!info) return null;
    const { email, phone, office, website } = info;
  
    // Generic text color for phone, office, website:
    const textColor = darkMode ? 'text-gray-200' : 'text-[#1D1D1F]';
    const hoverColor = darkMode ? 'hover:text-blue-300' : 'hover:text-[#0071E3]';
  
    // Special color overrides for the email link
    const emailBaseColor = darkMode ? 'text-white' : 'text-[#0071E3]';
    const emailHoverColor = darkMode ? 'hover:text-blue-300' : 'hover:text-[#0071E3]';
  
    return (
      <div className="mt-4 space-y-3">
        {email && (
          <div className={`flex items-center gap-2 group ${textColor}`}>
            <Mail className="w-4 h-4 text-[#00693e]" />
            <a
              href={`mailto:${email}`}
              className={`transition-colors ${emailBaseColor} ${emailHoverColor}`}
            >
              {email}
            </a>
          </div>
        )}
  
        {phone && (
          <div className={`flex items-center gap-2 ${textColor}`}>
            <Phone className="w-4 h-4 text-[#0071E3]" />
            <span>{phone}</span>
          </div>
        )}
  
        {office && (
          <div className={`flex items-center gap-2 ${textColor}`}>
            <Building className="w-4 h-4 text-[#0071E3]" />
            <span>{office}</span>
          </div>
        )}
  
        {website && (
          <div className={`flex items-center gap-2 group ${textColor}`}>
            <Globe className="w-4 h-4 text-[#0071E3]" />
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${hoverColor}`}
            >
              Personal Website
            </a>
          </div>
        )}
      </div>
    );
  };
  

/* ===========================
   LoadingState Component
   =========================== */
const LoadingState = ({ darkMode }) => (
  <div 
    className={getLoadingContainerClass(darkMode)} 
    style={darkMode ? getContainerStyle(darkMode) : {}}
  >
    <div className="w-full max-w-md text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-[#E8E8ED] rounded-full w-3/4 mx-auto" />
        <div className="h-4 bg-[#E8E8ED] rounded-full w-1/2 mx-auto" />
        <div className="h-4 bg-[#E8E8ED] rounded-full w-2/3 mx-auto" />
      </div>
      <p className="text-center mt-6 text-[#86868B] font-medium">Loading professor details...</p>
    </div>
  </div>
);

/* ===========================
   AISummary Component
   =========================== */
const AISummary = ({ summary, courseId, professorId, professorName, darkMode }) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <div className="mt-6">
      <div className="mb-3 flex justify-between items-center">
        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Summary of Student Feedback
        </h3>
        {!isSubmitted && (
          <button
            onClick={() => setIsReportModalOpen(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
              darkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Report inaccurate summary"
          >
            <Flag className="w-3 h-3" />
            <span>Report Issue</span>
          </button>
        )}
      </div>
      
      <div className={`p-4 relative ${
        darkMode 
          ? 'bg-gradient-to-r from-[#252a51] to-[#282c54] rounded-xl border border-[#343b6d]' 
          : 'bg-gradient-to-r from-[#F5F5F7] to-white rounded-xl border border-[#E8E8ED]'
      }`}>
        <div className="absolute -top-3 left-3 px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1"
          style={darkMode ? 
            { background: 'linear-gradient(135deg, #3b4ee8, #6366f1)', color: 'white' } : 
            { background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white' }
          }
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Generated</span>
        </div>
        
        <div className="pt-1">
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {summary}
          </p>
        </div>
      </div>
      
      <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        This summary is automatically generated based on student reviews and may not be perfectly accurate.
      </div>
      
      <ReportSummaryModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        courseId={courseId}
        professorId={professorId}
        professorName={professorName}
        darkMode={darkMode}
        onSubmit={() => {
          setIsSubmitted(true);
          setIsReportModalOpen(false);
        }}
      />
    </div>
  );
};

/* ===========================
   CourseCard Component
   =========================== */
const CourseCard = ({ course, professorId, professorName, darkMode, isExpanded = false }) => {
  const hasReviews = course.metrics.review_count > 0;
  const [isExpandedState, setIsExpanded] = useState(isExpanded);
  const navigate = useNavigate();
  const [courseDocId, setCourseDocId] = useState(null);
  const [courseDepartment, setCourseDepartment] = useState(null);
  
  // When the outer isExpanded prop changes, update our internal state
  useEffect(() => {
    setIsExpanded(isExpanded);
  }, [isExpanded]);

  // Use the same approach as ProfessorAnalytics to find the courseDocId
  useEffect(() => {
    const fetchCourseDocId = async () => {
      if (!course.courseId) return;
      try {
        const db = getFirestore();
        const normalizedId = normalizeCourseId(course.courseId);
        
        if (!normalizedId) {
          console.error('Invalid course ID format');
          return;
        }

        // Set department from the course data or extract it from courseId
        const dept = course.deptName || course.courseId.match(/([A-Z]+)/)[0];
        setCourseDepartment(dept);

        // First, try to see if we already have courseDocId from ProfessorAnalytics
        if (course.fullDocId) {
          setCourseDocId(course.fullDocId);
          return;
        }

        // Otherwise, query Firestore to find the document
        const coursesRef = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesRef);
        
        const matchingDoc = coursesSnapshot.docs.find(doc =>
          doc.id.startsWith(normalizedId)
        );

        if (matchingDoc) {
          setCourseDocId(matchingDoc.id);
        } else {
          // As a fallback, try the normalized ID as the doc ID
          // Check if this document exists
          const directDocRef = doc(db, 'courses', normalizedId);
          const directDocSnap = await getDoc(directDocRef);
          
          if (directDocSnap.exists()) {
            setCourseDocId(normalizedId);
          } else {
            // If course name is available, try to construct a potential full ID
            if (course.name) {
              const formattedName = course.name.replace(/\s+/g, '_').replace(/[^\w]/g, '');
              const potentialId = `${normalizedId}_${formattedName}`;
              
              // Check if this constructed ID exists
              const constructedDocRef = doc(db, 'courses', potentialId);
              const constructedDocSnap = await getDoc(constructedDocRef);
              
              if (constructedDocSnap.exists()) {
                setCourseDocId(potentialId);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching course doc ID:', error);
      }
    };

    fetchCourseDocId();
  }, [course.courseId, course.deptName, course.fullDocId, course.name]);
  
  // Utility function from your code
  const normalizeCourseId = (courseId) => {
    const match = courseId.match(/([A-Z]+)(\d+.*)/);
    if (!match) return null;

    const [_, dept, number] = match;
    const parts = number.split('.');
    const baseNumber = parts[0].padStart(3, '0');
    const section = parts[1];
    
    if (section) {
      return `${dept}_${dept}${baseNumber}_${section.padStart(2, '0')}`;
    } else {
      return `${dept}_${dept}${baseNumber}__`;
    }
  };

  // Handle navigation to course reviews page with professor param
  const handleSeeReviews = (e) => {
    e.stopPropagation(); // Prevent toggling the card expansion
    
    if (courseDocId && courseDepartment) {
      // Capitalize first letter of each word in professor name
      const formattedProfessorName = professorName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase() + name.slice(1))
        .join(' ');
      
      // Navigate to the course page with the professor parameter
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(`/departments/${courseDepartment}/courses/${courseDocId}/professors/${encodeURIComponent(formattedProfessorName)}`);
    } else {
      console.error('Course document ID or department not found');
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        darkMode
          ? 'bg-[#1C1F43] text-white border-[#332F56] hover:scale-[1.005]'
          : 'bg-white/80 text-[#1D1D1F] border-[#E8E8ED] hover:scale-[1.005]'
      }`}
    >
      <div
        className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        onClick={() => hasReviews && setIsExpanded(!isExpandedState)}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={`text-base font-medium ${
                darkMode ? 'text-white' : 'text-[#1D1D1F]'
              }`}
            >
              {course.courseId}
            </h3>
            <span
              className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-[#86868B]'
              }`}
            >
              {course.deptName}
            </span>
          </div>
          <p
            className={`mt-1 text-sm ${
              darkMode ? 'text-gray-300' : 'text-[#1D1D1F]'
            }`}
          >
            {course.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasReviews && (
            <button
              onClick={handleSeeReviews}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm
                ${darkMode 
                  ? 'text-white bg-blue-600 hover:bg-blue-700 border border-blue-500' 
                  : 'text-white bg-blue-600 hover:bg-blue-700 border border-blue-500'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              See Reviews
            </button>
          )}
          <div 
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
              hasReviews
                ? darkMode
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-800/50'
                  : 'bg-blue-50 text-blue-700 border border-blue-100'
                : darkMode
                ? 'bg-[#24273c] text-gray-400 border border-gray-700'
                : 'bg-gray-50 text-gray-500 border border-gray-100'
            }`}
          >
            <span className="font-semibold">{course.metrics.review_count}</span>
            <span>{course.metrics.review_count === 1 ? 'Review' : 'Reviews'}</span>
          </div>
          {hasReviews && (
            <button
              className={`transition-colors p-1.5 rounded-full ${
                darkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isExpandedState ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>
          )}
        </div>
      </div>

      {hasReviews && isExpandedState && (
        <div
          className={`px-5 pb-5 border-t ${
            darkMode ? 'border-[#332F56] bg-[#1A1D3D]' : 'border-gray-100'
          }`}
        >
          <div className="pt-4">
            <ProfessorAnalytics
              analysis={course.metrics}
              courseId={course.courseId}
              darkMode={darkMode}
            />
            {course.summary && (
              <AISummary
                summary={course.summary}
                courseId={course.courseId}
                professorId={professorId}
                professorName={professorName}
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      )}
      
      {!hasReviews && (
        <div className="px-5 pb-3 flex items-center gap-1.5 text-xs">
          <Info className={`w-3 h-3 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            No reviews available
          </span>
        </div>
      )}
    </div>
  );
};

/* ===========================
   CoursesSection Component
   =========================== */
const CoursesSection = ({ courses, professorId, professorName, darkMode }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandAll, setExpandAll] = useState(false);

  const sortedCourses = [...courses].sort((a, b) => {
    const aReviews = a.metrics.review_count || 0;
    const bReviews = b.metrics.review_count || 0;
    return bReviews - aReviews || a.courseId.localeCompare(b.courseId);
  });

  const filteredCourses = sortedCourses.filter(course => {
    if (selectedFilter === 'reviewed') return course.metrics.review_count > 0;
    if (selectedFilter === 'unreviewed') return !course.metrics.review_count;
    return true;
  });

  // Count how many courses have reviews
  const coursesWithReviews = sortedCourses.filter(course => course.metrics.review_count > 0).length;
  
  return (
    <div
      className={`transition-all duration-300 ${
        darkMode ? 'bg-[#1C1F43] text-white' : 'bg-white text-[#1D1D1F]'
      } p-6 rounded-2xl shadow-lg`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2
            className={`text-2xl font-semibold ${
              darkMode ? 'text-white' : 'text-[#1D1D1F]'
            }`}
          >
            Courses Taught
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} • {coursesWithReviews} with reviews
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div
            className={`flex rounded-full border ${
              darkMode
                ? 'border-[#332F56] bg-[#24273C]'
                : 'border-[#E8E8ED] bg-white/80 backdrop-blur-xl'
            } p-1`}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'reviewed', label: 'With Reviews' },
              { id: 'unreviewed', label: 'No Reviews' },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  selectedFilter === filter.id
                    ? darkMode
                      ? 'bg-[#0071E3] text-white'
                      : 'bg-[#0071E3] text-white'
                    : darkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-[#1D1D1F] hover:text-[#0071E3]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setExpandAll(!expandAll)}
            className={`text-sm transition-colors px-4 py-1.5 rounded-lg ${
              darkMode
                ? 'text-gray-200 bg-gray-800/50 hover:bg-gray-800'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className={`p-8 text-center rounded-lg ${
          darkMode ? 'bg-[#1a1d3d] text-gray-300' : 'bg-gray-50 text-gray-600'
        }`}>
          <p>No courses match the selected filter.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.courseId}
              course={course}
              professorId={professorId}
              professorName={professorName}
              darkMode={darkMode}
              isExpanded={expandAll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ===========================
   ProfessorDetails Component
   =========================== */
const ProfessorDetails = ({ darkMode = false }) => {
  const { professorId } = useParams();
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchProfessorData = async () => {
      try {
        const db = getFirestore();
        const docRef = doc(db, 'professor', professorId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Professor not found');
          return;
        }

        const professorData = docSnap.data();
        setProfessor({
          id: docSnap.id,
          ...professorData,
        });

        const allCourses = [];
        Object.entries(professorData.departments || {}).forEach(([deptName, deptCourses]) => {
          Object.entries(deptCourses).forEach(([courseId, courseData]) => {
            allCourses.push({
              deptName,
              courseId,
              ...courseData,
            });
          });
        });

        setCourses(allCourses);
      } catch (err) {
        console.error('Error fetching professor:', err);
        setError('Failed to load professor data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessorData();
  }, [professorId]);

  if (loading) return <LoadingState darkMode={darkMode} />;

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          darkMode ? 'bg-[#1C1F43] text-white' : 'bg-[#F9F9F9] text-[#1D1D1F]'
        }`}
      >
        <div
          className={`px-6 py-4 rounded-2xl font-medium ${
            darkMode
              ? 'bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]'
              : 'bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30]'
          }`}
        >
          {error}
        </div>
      </div>
    );
  }

  const hasAnalytics = professor?.overall_metrics?.review_count > 0;

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        background: darkMode
          ? 'linear-gradient(90deg, #1C093F 0%, #0C0F33 100%)'
          : '#F9F9F9',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Card */}
        <div
          className={`rounded-2xl border p-8 transition-all duration-300 ${
            darkMode
              ? 'bg-[#1C1F43] text-white border-[#332F56]'
              : 'bg-white text-[#1D1D1F] border-[#E8E8ED]'
          }`}
        >
          <div className="flex items-start gap-8">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-medium shadow-lg ${
                darkMode
                  ? 'bg-gradient-to-br from-[#00693e] to-[#004d30] text-white'
                  : 'bg-gradient-to-br from-[#00693e] to-[#004d30] text-white'
              }`}
            >
              {professor.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-semibold">{professor.name}</h1>
              <DisplayTitle title={professor.contact_info?.title} />
              <ContactInfo info={professor.contact_info} darkMode={darkMode} />

              {/* Quick stats badges if available */}
              {hasAnalytics && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {professor.overall_metrics.review_count} {professor.overall_metrics.review_count === 1 ? 'Review' : 'Reviews'}
                  </div>
                  {professor.overall_metrics.quality_score >= 70 && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-50 text-green-700'
                    }`}>
                      Highly Rated
                    </div>
                  )}
                  {(100 - professor.overall_metrics.difficulty_score) >= 70 && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
                    }`}>
                      Student Friendly
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {hasAnalytics && (
          <div
            className={`p-8 transition-all duration-300 rounded-2xl border ${
              darkMode
                ? 'bg-[#1C1F43] text-white border-[#332F56]'
                : 'bg-white text-[#1D1D1F] border-[#E8E8ED]'
            }`}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Performance Metrics</h2>
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs ${
                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Info className="w-3.5 h-3.5" />
                  <span>AI-generated</span>
                </div>
              </div>
              <ProfessorAnalytics
                analysis={professor.overall_metrics}
                darkMode={darkMode}
              />
            </div>
          </div>
        )}

        {/* Courses Section */}
        {courses.length > 0 && (
          <div>
            <CoursesSection
              courses={courses}
              professorId={professor.id}
              professorName={professor.name}
              darkMode={darkMode} // Pass dark mode
            />
          </div>
        )}

        {/* No Courses Message */}
        {courses.length === 0 && (
          <div
            className={`text-center p-8 rounded-2xl border ${
              darkMode
                ? 'bg-[#1C1F43] text-white border-[#332F56]'
                : 'bg-white text-[#1D1D1F] border-[#E8E8ED]'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <Info
                className={`w-12 h-12 ${
                  darkMode ? 'text-[#98989D]' : 'text-[#86868B]'
                }`}
              />
              <p className="text-lg font-medium">
                No courses found for this professor
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                We don't have information about courses taught by this professor yet.
              </p>
            </div>
          </div>
        )}
        
        {/* How this page works - help text */}
        <div className={`p-6 rounded-2xl border ${
          darkMode
            ? 'bg-[#1C1F43]/80 text-white border-[#332F56]'
            : 'bg-white/80 text-[#1D1D1F] border-[#E8E8ED]'
        }`}>
          <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            About This Page
          </h3>
          <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            All metrics are AI-generated from student reviews. Click any course to view details and course-specific ratings.
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Please keep adding reviews to courses as it helps train our model and will eventually benefit you and your peers in making informed course decisions.
          </p>
        </div>
      </div>
    </div>
  );
};


/* ===========================
   ReportSummaryModal Component
   =========================== */
   const ReportSummaryModal = ({ isOpen, onClose, courseId, professorId, professorName, darkMode, onSubmit }) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
  
      try {
        const db = getFirestore();
        const reportsRef = collection(db, 'summary_error');
  
        await addDoc(reportsRef, {
          courseId,
          professorId,
          professorName,
          message,
          timestamp: new Date().toISOString(),
          status: 'pending',
        });
  
        onSubmit();
        onClose();
      } catch (err) {
        console.error('Error submitting report:', err);
        setError('Failed to submit report. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };
  
    if (!isOpen) return null;
  
    return (
      <div
        className={`fixed inset-0 ${
          darkMode ? 'bg-black/50' : 'bg-black/20'
        } backdrop-blur-sm z-50 flex items-center justify-center p-4`}
      >
        <div
          className={`rounded-2xl max-w-md w-full p-6 relative shadow-xl transition-all ${
            darkMode
              ? 'bg-[#1C1F43] border border-[#332F56] text-white'
              : 'bg-white/90 border border-[#E8E8ED] text-[#1D1D1F]'
          }`}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 transition-colors ${
              darkMode ? 'text-[#98989D] hover:text-[#FFFFFF]' : 'text-[#98989D] hover:text-[#1D1D1F]'
            }`}
          >
            <X size={20} />
          </button>
  
          <h3 className="text-xl font-semibold mb-4">Report Inaccurate Summary</h3>
  
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe what's inaccurate about this summary..."
              className={`w-full p-4 h-32 resize-none rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-transparent placeholder:text-[#98989D] transition-colors ${
                darkMode
                  ? 'bg-[#24273c] text-white border-[#44475a] focus:ring-blue-400 placeholder:text-[#6B7280]'
                  : 'bg-white/50 text-[#1D1D1F] border-[#E8E8ED] focus:ring-[#0071E3]'
              }`}
              required
            />
  
            {error && (
              <p className={`text-sm font-medium px-1 ${darkMode ? 'text-[#FF6B6B]' : 'text-[#FF3B30]'}`}>{error}</p>
            )}
  
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2.5 font-medium rounded-full transition-colors disabled:opacity-50 ${
                  darkMode
                    ? 'text-white hover:text-gray-300'
                    : 'text-[#1D1D1F] hover:text-[#86868B]'
                }`}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-[#0071E3] hover:bg-[#0077ED] text-white'
                }`}
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  

export default ProfessorDetails;
