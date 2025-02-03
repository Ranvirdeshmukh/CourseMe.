import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

const CourseDisplayCarousel = ({
  pillar,
  children,
  title,
  isComplete,
  matchingCourses = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = direction === 'left' ? 
      -(container.offsetWidth / 3) : (container.offsetWidth / 3);
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const childArray = React.Children.toArray(children);

  return (
    <div className="w-full mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">{title}</h3>
          {isComplete && matchingCourses.length > 0 && (
            <span className="text-sm text-green-600">
              Using: {matchingCourses.join(', ')}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      {/* Course display area */}
      <div className="relative">
        {/* Navigation arrows - only show in carousel mode */}
        {!isExpanded && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4
                       bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4
                       bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 z-10"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Course container */}
        <div 
          ref={scrollContainerRef}
          className={`
            ${isExpanded 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'flex overflow-x-auto hide-scrollbar pr-16'
            }
            scroll-smooth
          `}
        >
          {React.Children.map(childArray, child => 
            React.cloneElement(child, { isExpanded })
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDisplayCarousel;