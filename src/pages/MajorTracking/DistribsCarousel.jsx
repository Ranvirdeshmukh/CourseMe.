import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DistribsCarousel = ({ 
  selectedCourses, 
  courseData,
  darkMode,
  onDistribFilter,
  activeDistrib,
  availableDistribs = [],
}) => {
  const requirements = {
    distribs: {
      ART: { required: 1, completed: 0, type: "distrib" },
      LIT: { required: 1, completed: 0, type: "distrib" },
      TMV: { required: 1, completed: 0, type: "distrib" },
      INT: { required: 1, completed: 0, type: "distrib" },
      SOC: { required: 2, completed: 0, type: "distrib" },
      QDS: { required: 1, completed: 0, type: "distrib" },
      SCI: { required: 2, completed: 0, type: "distrib" },
      TAS: { required: 1, completed: 0, type: "distrib" }
    },
    worldCulture: {
      W: { required: 1, completed: 0, type: "culture" },
      NW: { required: 1, completed: 0, type: "culture" },
      CI: { required: 1, completed: 0, type: "culture" }
    },
    lab: {
      LAB: { required: 1, completed: 0, type: "lab" }
    }
  };

  // Calculate completed requirements
  if (selectedCourses && courseData) {
    selectedCourses.forEach(courseId => {
      const course = courseData[courseId];
      if (!course) return;

      if (course.distribs) {
        const distribs = course.distribs.split(/[/-]/).map(d => d.trim());
        distribs.forEach(distrib => {
          const baseDistrib = distrib.replace('SLA', 'SCI').replace('TLA', 'TAS');
          if (requirements.distribs[baseDistrib]) {
            requirements.distribs[baseDistrib].completed = Math.min(
              requirements.distribs[baseDistrib].completed + 1,
              requirements.distribs[baseDistrib].required
            );
          }
          
          if (distrib === 'SLA' || distrib === 'TLA') {
            requirements.lab.LAB.completed = Math.min(
              requirements.lab.LAB.completed + 1,
              requirements.lab.LAB.required
            );
          }
        });
      }

      if (course.world_culture) {
        course.world_culture.forEach(culture => {
          if (requirements.worldCulture[culture]) {
            requirements.worldCulture[culture].completed = Math.min(
              requirements.worldCulture[culture].completed + 1,
              requirements.worldCulture[culture].required
            );
          }
        });
      }
    });
  }

  const allRequirements = {
    ...requirements.distribs,
    ...requirements.worldCulture,
    ...requirements.lab
  };

  const handleDistribClick = useCallback((code) => {
    onDistribFilter(activeDistrib === code ? null : code);
  }, [activeDistrib, onDistribFilter]);

  const handleScroll = useCallback((direction) => {
    const container = document.getElementById('distribs-carousel');
    if (!container) return;
    
    const scrollAmount = direction === 'left' ? -200 : 200;    
    container.scrollTo({
      left: container.scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  return (
    <div className="relative w-full bg-opacity-50 py-4">
      <div className={`text-xs mb-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Click a requirement to filter courses
      </div>
      
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
        <button
          onClick={() => handleScroll('left')}
          className={`p-1 rounded-full ${
            darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-white hover:bg-gray-50 text-gray-800'
          } shadow-lg`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
      
      <div 
        id="distribs-carousel"
        className="flex space-x-2 overflow-x-auto hide-scrollbar px-8"
      >
        {Object.entries(allRequirements).map(([code, req]) => {
          const isSelected = activeDistrib === code;
          const isAvailable = availableDistribs.includes(code);
          const isCompleted = req.completed >= req.required;
          
          const getStatusColor = () => {
            if (darkMode) {
              if (isSelected) return 'bg-blue-900';
              if (isCompleted) return 'bg-green-900/30';
              return 'bg-gray-800';
            } else {
              if (isSelected) return 'bg-blue-50';
              if (isCompleted) return 'bg-green-50';
              return 'bg-white';
            }
          };
          
          return (
            <button
              key={code}
              onClick={() => handleDistribClick(code)}
              disabled={!isAvailable}
              className={`
                flex-none w-20 h-20 rounded-lg relative overflow-hidden
                transition-all duration-200 transform
                ${isSelected 
                  ? darkMode
                    ? 'ring-2 ring-white shadow-lg scale-110' 
                    : 'ring-2 ring-gray-900 shadow-lg scale-110'
                  : isAvailable ? 'hover:scale-105' : 'opacity-40 cursor-not-allowed'
                }
                ${getStatusColor()}
                ${isAvailable 
                  ? darkMode 
                    ? 'border-2 border-gray-600' 
                    : 'border-2 border-gray-300'
                  : ''
                }
                ${isCompleted && isAvailable
                  ? darkMode
                    ? 'border-green-500'
                    : 'border-green-500'
                  : ''
                }
                shadow-md
              `}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-bold ${
                  darkMode 
                    ? isCompleted ? 'text-green-400' : 'text-white'
                    : isCompleted ? 'text-green-700' : 'text-gray-900'
                } ${!isAvailable ? 'opacity-50' : ''}`}>
                  {code}
                </span>
                <span className={`text-xs ${
                  darkMode 
                    ? isCompleted ? 'text-green-400/80' : 'text-gray-400'
                    : isCompleted ? 'text-green-600' : 'text-gray-500'
                } ${!isAvailable ? 'opacity-50' : ''}`}>
                  {req.completed}/{req.required}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
        <button
          onClick={() => handleScroll('right')}
          className={`p-1 rounded-full ${
            darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-white hover:bg-gray-50 text-gray-800'
          } shadow-lg`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DistribsCarousel;