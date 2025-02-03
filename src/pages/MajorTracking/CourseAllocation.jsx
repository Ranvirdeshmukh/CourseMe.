// Converts a course number to a normalized form (e.g., "COSC1" -> "COSC001")
const normalizeCourseId = (courseId) => {
    const match = courseId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return courseId;
    const [, dept, num] = match;
    return `${dept}${num.padStart(3, '0')}`;
  };
  
  // Helper to check if a course is within a range
  const isInRange = (courseId, department, start, end) => {
    const match = courseId.match(/([A-Z]+)(\d+)/);
    if (!match) return false;
    const [, dept, numStr] = match;
    const num = parseInt(numStr);
    return dept === department && num >= start && num <= end;
  };
  
  // Calculate range size for sorting
  // Helper to check if a course is within a range
  export const getRangeSize = (pillar) => {
    if (pillar.type === 'prerequisites') return -1; // Prerequisites take top priority
    if (pillar.type === 'specific') return 0; // Specific requirements come next
    if (pillar.type === 'range') return pillar.end - pillar.start;
    return Infinity;
  };
  
  // Sort pillars by specificity (prerequisites first, then ranges by size)
  const sortPillarsBySpecificity = (pillars) => {
    return [...pillars].sort((a, b) => {
      // Prerequisites come first
      if (a.type === 'prerequisites' && b.type !== 'prerequisites') return -1;
      if (b.type === 'prerequisites' && a.type !== 'prerequisites') return 1;
  
      // Then specific course requirements
      if (a.type === 'specific' && b.type !== 'specific') return -1;
      if (b.type === 'specific' && a.type !== 'specific') return 1;
  
      // Then sort ranges by size (smaller ranges first)
      const rangeA = getRangeSize(a);
      const rangeB = getRangeSize(b);
      return rangeA - rangeB;
    });
  };
  
  // Find overlapping ranges for a pillar
  const findOverlappingRanges = (pillar, allPillars) => {
    if (pillar.type !== 'range') return [];
    
    return allPillars.filter(other => {
      if (other.type !== 'range' || other === pillar) return false;
      
      return (
        other.department === pillar.department &&
        ((other.start <= pillar.end && other.end >= pillar.start) ||
         (pillar.start <= other.end && pillar.end >= other.start))
      );
    });
  };
  
  export const evaluateRequirements = (selectedCourses, allPillars) => {
    const allocatedCourses = new Map(); // courseId -> { pillarIndex, pillarName }
    const pillarCompletions = [];
    
    // Sort pillars by specificity
    const sortedPillars = sortPillarsBySpecificity(allPillars);
    
    // First pass: Handle prerequisites
    sortedPillars.forEach((pillar, index) => {
      if (pillar.type === 'prerequisites') {
        const matchingCourses = [];
        
        pillar.courses.forEach(req => {
          if (typeof req === 'string') {
            const normalizedReq = normalizeCourseId(req);
            if (selectedCourses.includes(normalizedReq)) {
              matchingCourses.push(normalizedReq);
              allocatedCourses.set(normalizedReq, { 
                pillarIndex: index, 
                pillarName: pillar.description 
              });
            }
          } else if (req.type === 'alternative') {
            const match = req.options.find(opt => 
              selectedCourses.includes(normalizeCourseId(opt))
            );
            if (match) {
              const normalizedMatch = normalizeCourseId(match);
              matchingCourses.push(normalizedMatch);
              allocatedCourses.set(normalizedMatch, {
                pillarIndex: index,
                pillarName: pillar.description
              });
            }
          }
        });
  
        pillarCompletions[index] = {
          isComplete: matchingCourses.length === pillar.courses.length,
          matchingCourses
        };
      }
    });
  
    // Second pass: Handle ranges from most specific to least specific
    sortedPillars.forEach((pillar, index) => {
      if (pillar.type === 'range') {
        const matchingCourses = [];
        const overlappingRanges = findOverlappingRanges(pillar, sortedPillars);
        
        // Get all courses that fit this range
        const availableCourses = selectedCourses.filter(courseId => {
          // Must be in range
          if (!isInRange(courseId, pillar.department, pillar.start, pillar.end)) {
            return false;
          }
          
          // If course is already allocated to a more specific range, don't reallocate
          const currentAllocation = allocatedCourses.get(courseId);
          if (currentAllocation) {
            const currentPillar = sortedPillars[currentAllocation.pillarIndex];
            const currentRangeSize = getRangeSize(currentPillar);
            const thisRangeSize = getRangeSize(pillar);
            return currentRangeSize > thisRangeSize;
          }
          
          return true;
        });
  
        // Take needed courses
        const neededCourses = availableCourses.slice(0, pillar.count);
        neededCourses.forEach(courseId => {
          matchingCourses.push(courseId);
          allocatedCourses.set(courseId, {
            pillarIndex: index,
            pillarName: pillar.description,
            isOptimalAllocation: true
          });
        });
  
        pillarCompletions[index] = {
          isComplete: matchingCourses.length >= pillar.count,
          matchingCourses,
          overlappingRanges: overlappingRanges.map(range => ({
            description: range.description,
            rangeSize: getRangeSize(range)
          }))
        };
      }
    });
  
    return {
      pillarCompletions,
      allocatedCourses,
      // Helper function to check if a course is used in a more specific range
      isUsedInMoreSpecificRange: (courseId, currentPillarIndex) => {
        const allocation = allocatedCourses.get(courseId);
        if (!allocation) return false;
        
        const currentPillar = sortedPillars[currentPillarIndex];
        const allocatedPillar = sortedPillars[allocation.pillarIndex];
        
        return getRangeSize(allocatedPillar) < getRangeSize(currentPillar);
      }
    };
  };