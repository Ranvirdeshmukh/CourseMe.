import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

const CourseDisplayCarousel = ({
  title,
  subtitle,
  children,
  expandable = true,
  darkMode // added darkMode prop
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = direction === 'left' ? 
      -(container.offsetWidth / 2) : (container.offsetWidth / 2);
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="w-full mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {expandable && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label={isExpanded ? "Collapse view" : "Expand view"}
          >
            {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        )}
      </div>

      {/* Course display area */}
      <div className="relative">
        {/* Navigation arrows - only show in carousel mode */}
        {!isExpanded && (
          <>
            <button
              onClick={() => scroll('left')}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 shadow-lg rounded-full p-2 z-10 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 shadow-lg rounded-full p-2 z-10 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
              aria-label="Scroll right"
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
              : 'flex overflow-x-auto hide-scrollbar space-x-4 px-4'
            }
            scroll-smooth
          `}
        >
          {React.Children.map(children, child => {
            if (!React.isValidElement(child)) return null;
            // Only pass viewMode prop to CourseCard components
            return React.cloneElement(child, {
              viewMode: isExpanded ? 'grid' : 'carousel'
            });
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseDisplayCarousel;
