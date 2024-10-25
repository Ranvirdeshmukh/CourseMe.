import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { getFirestore, doc, getDoc, addDoc, collection } from 'firebase/firestore';
import ProfessorAnalytics from './ProfessorAnalytics';
import { 
  Mail, 
  Phone, 
  Globe, 
  Building, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Bot,
  Flag,
  X
} from 'lucide-react';


const DisplayTitle = ({ title }) => {
  if (!title) return null;
  
  const titles = title.split(';').map(t => t.trim()).filter(t => t);
  const firstTitle = titles[0];
  const hasMoreTitles = titles.length > 1;

  return (
    <div className="relative group">
      <p className="text-xl text-gray-600 mt-1">
        {firstTitle}
        {hasMoreTitles && (
          <span className="ml-2 text-sm text-gray-400 cursor-help">
            (+{titles.length - 1} more)
          </span>
        )}
      </p>
      {hasMoreTitles && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg p-4 hidden group-hover:block z-10 w-max max-w-lg">
          <ul className="space-y-2">
            {titles.map((title, index) => (
              <li key={index} className="text-gray-700">{title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ContactInfo = ({ info }) => {
  if (!info) return null;
  
  const { email, phone, office, website } = info;
  
  return (
    <div className="mt-4 space-y-2">
      {email && (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4" />
          <a href={`mailto:${email}`} className="hover:text-indigo-600">
            {email}
          </a>
        </div>
      )}
      {phone && (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4" />
          <span>{phone}</span>
        </div>
      )}
      {office && (
        <div className="flex items-center gap-2 text-gray-600">
          <Building className="w-4 h-4" />
          <span>{office}</span>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-gray-600">
          <Globe className="w-4 h-4" />
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-indigo-600"
          >
            Personal Website
          </a>
        </div>
      )}
    </div>
  );
};

const NoDataMessage = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg shadow-sm border">
    <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
    <p className="text-lg text-gray-600 text-center font-medium">{message}</p>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-full max-w-md text-center">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
      </div>
      <p className="text-center mt-6 text-gray-500">Loading professor details...</p>
    </div>
  </div>
);

const AISummary = ({ summary, courseId, professorId, professorName }) => {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
  
    return (
      <div className="mt-6">
        <div className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 relative group">
              <Sparkles className="w-5 h-5 text-indigo-600 cursor-help" />
              {/* Tooltip that appears on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-white rounded-lg shadow-lg text-xs text-gray-600 border">
                <div className="text-center">
                  AI-generated summary based on student reviews
                </div>
                {/* Arrow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">{summary}</p>
            </div>
            {!isSubmitted && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                title="Report inaccurate summary"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
  
        <ReportSummaryModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          courseId={courseId}
          professorId={professorId}
          professorName={professorName}
          onSubmit={() => {
            setIsSubmitted(true);
            setIsReportModalOpen(false);
          }}
        />
      </div>
    );
  };
  
  // Update the ReportSummaryModal to ensure it properly connects to Firebase
  const ReportSummaryModal = ({ isOpen, onClose, courseId, professorId, professorName, onSubmit }) => {
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
          status: 'pending'
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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
          
          <h3 className="text-lg font-semibold mb-4">Report Inaccurate Summary</h3>
          
          <form onSubmit={handleSubmit}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe what's inaccurate about this summary..."
              className="w-full p-3 border rounded-lg h-32 resize-none mb-4"
              required
            />
            
            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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
  
  const CourseCard = ({ course, professorId, professorName }) => {
    const hasReviews = (course.reviews?.length || 0) > 0;
    const [isExpanded, setIsExpanded] = useState(hasReviews);
  
    return (
      <div className="bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md">
        <div 
          className="p-6 cursor-pointer flex items-start justify-between"
          onClick={() => hasReviews && setIsExpanded(!isExpanded)}
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{course.courseId}</h3>
              <span className="text-sm text-gray-500">({course.deptName})</span>
            </div>
            <p className="text-gray-600">{course.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              hasReviews 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {course.reviews?.length || 0} {course.reviews?.length === 1 ? 'Review' : 'Reviews'}
            </span>
            {hasReviews && (
              <div className="text-gray-400 hover:text-gray-600">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            )}
          </div>
        </div>
        
        {!hasReviews && (
          <div className="px-6 pb-6 text-center">
            <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
              <Info className="w-4 h-4 mr-2" />
              No reviews available for this course yet
            </div>
          </div>
        )}
        
        {hasReviews && isExpanded && (
          <div className="px-6 pb-6">
            <div className="pt-4 border-t">
            <ProfessorAnalytics 
                analysis={course.analysis}
                courseId={course.courseId}  // Make sure this is the correct document ID from Firestore
                />
              {course.analysis?.summary && (
                <AISummary 
                  summary={course.analysis.summary}
                  courseId={course.courseId}
                  professorId={professorId}
                  professorName={professorName}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  

  const CoursesSection = ({ courses, professorId, professorName }) => {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [expandAll, setExpandAll] = useState(true);
    
    const sortedCourses = [...courses].sort((a, b) => {
      const aReviews = a.reviews?.length || 0;
      const bReviews = b.reviews?.length || 0;
      if (aReviews === bReviews) {
        return a.courseId.localeCompare(b.courseId);
      }
      return bReviews - aReviews;
    });
  
    const filteredCourses = sortedCourses.filter(course => {
      if (selectedFilter === 'reviewed') return course.reviews?.length > 0;
      if (selectedFilter === 'unreviewed') return !course.reviews?.length;
      return true;
    });
  
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Courses</h2>
          
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg border bg-white p-1">
              {[
                { id: 'all', label: 'All Courses' },
                { id: 'reviewed', label: 'With Reviews' },
                { id: 'unreviewed', label: 'Without Reviews' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>
  
        <div className="grid gap-4">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.courseId} 
              course={course} 
              professorId={professorId}
              professorName={professorName}
            />
          ))}
        </div>
      </div>
    );
  };

const ProfessorDetails = () => {
  const { professorId } = useParams();
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchProfessorData = async () => {
      try {
        const db = getFirestore();
        const docRef = doc(db, 'professors', professorId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError('Professor not found');
          return;
        }

        const professorData = docSnap.data();
        setProfessor({
          id: docSnap.id,
          ...professorData
        });

        // Process all courses, including those without reviews
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

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const hasAnalytics = professor?.overall_analysis?.metrics?.review_count > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
              {professor.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{professor.name}</h1>
              <DisplayTitle title={professor.contact_info?.title} />
              <ContactInfo info={professor.contact_info} />
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {hasAnalytics && (
          <div className="transition-all duration-200">
            <ProfessorAnalytics analysis={professor.overall_analysis} />
          </div>
        )}
  
        {/* Courses Section */}
        {courses.length > 0 && (
          <CoursesSection 
            courses={courses} 
            professorId={professor.id} 
            professorName={professor.name}
          />
        )}
      </div>
    </div>
  );
};
export default ProfessorDetails;