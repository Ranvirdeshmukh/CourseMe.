// // CourseAllocation.js
// // Utility functions
// export const normalizeCourseId = (courseId) => {
//   const match = courseId.match(/^([A-Z]+)(\d+)$/);
//   if (!match) return courseId;
//   const [, dept, num] = match;
//   return `${dept}${num.padStart(3, '0')}`;
// };

// export const isInRange = (courseId, department, start, end) => {
//   const match = courseId.match(/([A-Z]+)(\d+)/);
//   if (!match) return false;
//   const [, dept, numStr] = match;
//   const num = parseInt(numStr);
//   return dept === department && num >= start && num <= end;
// };

// export const getRangeStrictness = (pillar) => {
//   if (!pillar) return Infinity;
//   if (pillar.type === 'prerequisites') return -1;
//   if (pillar.type === 'specific') return 0;
//   if (pillar.type === 'range') {
//     const rangeSize = pillar.end - pillar.start;
//     return (rangeSize * 100) / pillar.count;
//   }
//   return Infinity;
// };

// const sortPillarsByStrictness = (pillars) => {
//   return [...pillars].sort((a, b) => {
//     const strictnessA = getRangeStrictness(a);
//     const strictnessB = getRangeStrictness(b);
//     return strictnessA - strictnessB;
//   });
// };

// const findOverlappingRanges = (pillar, allPillars) => {
//   if (!pillar || pillar.type !== 'range') return [];
  
//   return allPillars.filter(other => {
//     if (!other || other.type !== 'range' || other === pillar) return false;
    
//     return (
//       other.department === pillar.department &&
//       ((other.start <= pillar.end && other.end >= pillar.start) ||
//        (pillar.start <= other.end && pillar.end >= other.start))
//     );
//   });
// };

// export const evaluateRequirements = (selectedCourses = [], allPillars = []) => {
//   const allocatedCourses = new Map();
//   const pillarCompletions = [];
  
//   const sortedPillars = sortPillarsByStrictness(allPillars);
  
//   // First pass: Prerequisites
//   sortedPillars.forEach((pillar, index) => {
//     if (pillar?.type === 'prerequisites') {
//       const matchingCourses = [];
      
//       pillar.courses.forEach(req => {
//         if (typeof req === 'string') {
//           const normalizedReq = normalizeCourseId(req);
//           if (selectedCourses.includes(normalizedReq)) {
//             matchingCourses.push(normalizedReq);
//             allocatedCourses.set(normalizedReq, { 
//               pillarIndex: index,
//               pillarName: pillar.description,
//               strictness: getRangeStrictness(pillar)
//             });
//           }
//         } else if (req?.type === 'alternative') {
//           const match = req.options.find(opt => 
//             selectedCourses.includes(normalizeCourseId(opt))
//           );
//           if (match) {
//             const normalizedMatch = normalizeCourseId(match);
//             matchingCourses.push(normalizedMatch);
//             allocatedCourses.set(normalizedMatch, {
//               pillarIndex: index,
//               pillarName: pillar.description,
//               strictness: getRangeStrictness(pillar)
//             });
//           }
//         }
//       });

//       pillarCompletions[index] = {
//         isComplete: matchingCourses.length === pillar.courses.length,
//         matchingCourses
//       };
//     }
//   });

//   // Second pass: Ranges
//   sortedPillars.forEach((pillar, index) => {
//     if (pillar?.type === 'range') {
//       const matchingCourses = [];
//       const strictness = getRangeStrictness(pillar);
      
//       const availableCourses = selectedCourses.filter(courseId => {
//         if (!isInRange(courseId, pillar.department, pillar.start, pillar.end)) {
//           return false;
//         }
        
//         const currentAllocation = allocatedCourses.get(courseId);
//         if (currentAllocation) {
//           const allocatedPillar = sortedPillars[currentAllocation.pillarIndex];
//           if (allocatedPillar?.type === 'range' && 
//               isInRange(courseId, allocatedPillar.department, allocatedPillar.start, allocatedPillar.end)) {
//             return currentAllocation.strictness > strictness;
//           }
//         }
        
//         return true;
//       });

//       const neededCourses = availableCourses.slice(0, pillar.count);
//       neededCourses.forEach(courseId => {
//         matchingCourses.push(courseId);
//         allocatedCourses.set(courseId, {
//           pillarIndex: index,
//           pillarName: pillar.description,
//           strictness,
//           isOptimalAllocation: true
//         });
//       });

//       pillarCompletions[index] = {
//         isComplete: matchingCourses.length >= pillar.count,
//         matchingCourses,
//         overlappingRanges: findOverlappingRanges(pillar, sortedPillars).map(range => ({
//           description: range.description,
//           strictness: getRangeStrictness(range)
//         }))
//       };
//     }
//   });

//   return {
//     pillarCompletions,
//     allocatedCourses,
//     isUsedInStricterRequirement: (courseId, currentPillarIndex) => {
//       const allocation = allocatedCourses.get(courseId);
//       if (!allocation) return false;
      
//       const currentPillar = sortedPillars[currentPillarIndex];
//       return getRangeStrictness(currentPillar) > allocation.strictness;
//     },
//     getCourseAllocation: (courseId) => allocatedCourses.get(courseId)
//   };
// };