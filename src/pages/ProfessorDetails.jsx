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

const ContactInfo = ({ info }) => {
  if (!info) return null;
  const { email, phone, office, website } = info;
  
  return (
    <div className="mt-4 space-y-3">
      {email && (
        <div className="flex items-center gap-2 text-[#1D1D1F] group">
          <Mail className="w-4 h-4 text-[#00693e]" />
          <a href={`mailto:${email}`} className="group-hover:text-[#0071E3] transition-colors">
            {email}
          </a>
        </div>
      )}
      {phone && (
        <div className="flex items-center gap-2 text-[#1D1D1F]">
          <Phone className="w-4 h-4 text-[#0071E3]" />
          <span>{phone}</span>
        </div>
      )}
      {office && (
        <div className="flex items-center gap-2 text-[#1D1D1F]">
          <Building className="w-4 h-4 text-[#0071E3]" />
          <span>{office}</span>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-[#1D1D1F] group">
          <Globe className="w-4 h-4 text-[#0071E3]" />
          <a href={website} target="_blank" rel="noopener noreferrer" className="group-hover:text-[#0071E3] transition-colors">
            Personal Website
          </a>
        </div>
      )}
    </div>
  );
};

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
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

const AISummary = ({ summary, courseId, professorId, professorName }) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <div className="mt-6">
      <div className="p-4 bg-gradient-to-r from-[#F5F5F7] to-white rounded-2xl border border-[#E8E8ED]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 relative group">
            <Sparkles className="w-5 h-5 text-[#0071E3]" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg text-xs text-[#1D1D1F] border border-[#E8E8ED]">
              <div className="text-center">
                AI-generated summary based on student reviews
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-[#E8E8ED]" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[#1D1D1F] leading-relaxed">{summary}</p>
          </div>
          {!isSubmitted && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex-shrink-0 text-[#98989D] hover:text-[#FF3B30] transition-colors"
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

const CourseCard = ({ course, professorId, professorName }) => {
  const hasReviews = course.metrics.review_count > 0;
  const [isExpanded, setIsExpanded] = useState(false);  // Changed to false

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#E8E8ED] transition-all duration-300 hover:scale-[1.01]">
      <div 
        className="p-6 cursor-pointer flex items-start justify-between"
        onClick={() => hasReviews && setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[#1D1D1F]">{course.courseId}</h3>
            <span className="text-sm text-[#86868B]">({course.deptName})</span>
          </div>
          <p className="text-[#1D1D1F] mt-1">{course.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            hasReviews 
              ? 'bg-[#0071E3]/10 text-[#0071E3]' 
              : 'bg-[#F5F5F7] text-[#86868B]'
          }`}>
            {course.metrics.review_count} {course.metrics.review_count === 1 ? 'Review' : 'Reviews'}
          </span>
          {hasReviews && (
            <div className="text-[#86868B] hover:text-[#1D1D1F] transition-colors">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </div>
      </div>
      
      {!hasReviews && (
        <div className="px-6 pb-6 text-center">
          <div className="flex items-center justify-center py-4 text-[#86868B] text-sm">
            <Info className="w-4 h-4 mr-2" />
            No reviews available for this course yet
          </div>
        </div>
      )}
      
      {hasReviews && isExpanded && (
        <div className="px-6 pb-6">
          <div className="pt-4 border-t border-[#E8E8ED]">
            <ProfessorAnalytics 
              analysis={course.metrics}
              courseId={course.courseId}
            />
            {course.summary && (
              <AISummary 
                summary={course.summary}
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
  const [expandAll, setExpandAll] = useState(false);  // Changed from true to false
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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-semibold text-[#1D1D1F]">Courses</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex rounded-full border border-[#E8E8ED] bg-white/80 backdrop-blur-xl p-1">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'reviewed', label: 'With Reviews' },
              { id: 'unreviewed', label: 'Without Reviews' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  selectedFilter === filter.id
                    ? 'bg-[#0071E3] text-white'
                    : 'text-[#1D1D1F] hover:text-[#0071E3]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors"
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
        const docRef = doc(db, 'professor', professorId);
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
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] p-4">
        <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] px-6 py-4 rounded-2xl font-medium">
          {error}
        </div>
      </div>
    );
  }

  const hasAnalytics = professor?.overall_metrics?.review_count > 0;

  return (
    <div className="min-h-screen bg-[#F9F9F9] py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#E8E8ED] p-8 transition-all duration-300">
          <div className="flex items-start gap-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00693e] to-[#00693e] flex items-center justify-center text-white text-3xl font-medium shadow-lg">
              {professor.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-semibold text-[#1D1D1F]">{professor.name}</h1>
              <DisplayTitle title={professor.contact_info?.title} />
              <ContactInfo info={professor.contact_info} />
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {hasAnalytics && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#E8E8ED] p-8 transition-all duration-300">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-[#1D1D1F]">Overall Analytics</h2>
              <h3 className="text-1xl font-semibold text-[#1D1D1F]">*Note metrics are AI generated and may not be entirely accurate</h3>
              <ProfessorAnalytics analysis={professor.overall_metrics} />
            </div>
          </div>
        )}
  
        {/* Courses Section */}
        {courses.length > 0 && (
          <div className="bg-transparent">
            <CoursesSection 
              courses={courses} 
              professorId={professor.id} 
              professorName={professor.name}
            />
          </div>
        )}

        {/* No Courses Message */}
        {courses.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#E8E8ED] p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Info className="w-12 h-12 text-[#98989D]" />
              <p className="text-[#1D1D1F] text-lg font-medium">No courses found for this professor</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Report Summary Modal with Apple styling
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 relative border border-[#E8E8ED] shadow-xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#98989D] hover:text-[#1D1D1F] transition-colors"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-semibold text-[#1D1D1F] mb-4">Report Inaccurate Summary</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe what's inaccurate about this summary..."
            className="w-full p-4 border border-[#E8E8ED] rounded-xl h-32 resize-none bg-white/50 backdrop-blur-sm 
                     focus:outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-transparent
                     placeholder:text-[#98989D]"
            required
          />
          
          {error && (
            <p className="text-[#FF3B30] text-sm font-medium px-1">{error}</p>
          )}
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-[#1D1D1F] hover:text-[#86868B] transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0071E3] text-white rounded-full hover:bg-[#0077ED] 
                       transition-colors disabled:opacity-50 font-medium"
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