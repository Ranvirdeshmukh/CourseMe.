import { doc, getFirestore, collection, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class RequirementManager {
  constructor(majorRequirements) {
    this.pillars = majorRequirements.pillars.map((pillar, index) => ({
      ...pillar,
      index
    }));
    this.courseAllocations = new Map();
    this.pillarFills = new Map();
    this.overflowCourses = new Set();
    this.selectedSequences = new Map(); // Map to store selected sequence indices by major
  }

  setSelectedSequence(majorCode, sequenceIndex) {
    this.selectedSequences.set(majorCode, sequenceIndex);
    this.updateFirebaseSequences(majorCode, sequenceIndex);
  }

  getSelectedSequence(majorCode) {
    return this.selectedSequences.get(majorCode) || 0; // Default to first sequence
  }

  async updateFirebaseSequences(majorCode, sequenceIndex) {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const db = getFirestore();
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        selectedSequences: {
          [majorCode]: sequenceIndex
        }
      }, { merge: true });
      
      console.log(`Updated sequence selection for ${majorCode} to ${sequenceIndex}`);
    } catch (error) {
      console.error('Error updating sequence selection:', error);
    }
  }

  async loadSavedSequences() {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      
      if (userDoc.exists() && userDoc.data().selectedSequences) {
        const savedSequences = userDoc.data().selectedSequences;
        Object.entries(savedSequences).forEach(([major, index]) => {
          this.selectedSequences.set(major, index);
        });
        console.log('Loaded saved sequences:', this.selectedSequences);
      }
    } catch (error) {
      console.error('Error loading saved sequences:', error);
    }
  }

  static parseRequirementString(reqStr, majorDept) {
    if (!reqStr || typeof reqStr !== 'string') return [];

    try {
      // Remove outer parentheses and trim
      const cleanStr = reqStr.replace(/^\(|\)$/g, '').trim();
      if (!cleanStr) return [];

      // Split & to extract pillars first
      const groups = cleanStr.split('&')
        .map(r => r.trim())
        .filter(Boolean);

      return groups.map(group => {
        // Handle culminating experience syntax first
        if (group.startsWith('$[')) {
          const culminatingMatches = group.match(/\$\[(.*?)\]/);
          if (culminatingMatches) {
            const sequencesStr = culminatingMatches[1];
            const sequences = sequencesStr.split(';').map(sequence => {
              const [final, prereqsStr] = sequence.split(':');
              const prereqs = prereqsStr.split(',').map(p => {
                if (p.includes('{')) {
                  // Extract options from within curly braces
                  const options = p.match(/{([^}]+)}/);
                  if (options) {
                    return {
                      type: 'alternative',
                      options: options[1].split('|').map(o => o.trim())
                    };
                  }
                }
                return p.trim();
              });
              
              return {
                final: final.trim(),
                prereqs
              };
            });

            return {
              type: 'culminating',
              sequences,
              description: 'Culminating Experience',
              count: 10 // Set a high count to allow all courses in a sequence
            };
          }
        }

        // Prerequisites with alternatives
        if (group.startsWith('@[')) {
          const prereqStr = group.slice(2, -1);
          const prereqs = prereqStr.split(',').map(p => {
            if (p.includes('{')) {
              return {
                type: 'alternative',
                options: p.match(/{([^}]+)}/)[1].split('|').map(o => o.trim())
              };
            }
            return p.trim();
          });
          return {
            type: 'prerequisites',
            courses: prereqs,
            description: 'Required foundation courses'
          };
        }

        // Range requirements with count
        const rangeMatch = group.match(/#(\d+)\[([A-Z]+)(\d+)-([A-Z]+)(\d+)\]/);
        if (rangeMatch) {
          const [, count, startDept, startNum, endDept, endNum] = rangeMatch;
          if (startDept === endDept) {
            return {
              type: 'range',
              count: parseInt(count),
              department: startDept,
              start: parseInt(startNum),
              end: parseInt(endNum),
              description: `${count} course(s) from ${startDept}${startNum} to ${startDept}${endNum}`
            };
          }
        }

        // Complex requirements with alternatives
        if (group.match(/#(\d+){/)) {
          const [countStr, rest] = group.split('{');
          const count = parseInt(countStr.slice(1));
          const options = rest.slice(0, -1).split('|').map(opt => opt.trim());
          return {
            type: 'specific',
            count: count,
            department: majorDept,
            options: options,
            description: `${count} course(s) from advanced options`
          };
        }

        return null;
      }).filter(Boolean);
    } catch (error) {
      console.error('Error parsing requirements:', error);
      return [];
    }
  }

  // Get all courses in a culminating sequence (including alternatives)
  getAllSequenceCourses(sequence) {
    if (!sequence) return [];
    
    // For the simplified approach, treat all courses equally
    const courses = [sequence.final];
    
    // Add all prerequisites
    for (const prereq of sequence.prereqs) {
      if (typeof prereq === 'string') {
        courses.push(prereq);
      } else if (prereq.type === 'alternative') {
        // Add all options from alternative sets
        courses.push(...prereq.options);
      }
    }
    
    return courses;
  }

  // Check if a course is part of the sequence
  isCourseInSequence(courseId, sequence) {
    if (!sequence) return false;
    
    // Check if it's the final course
    if (courseId === sequence.final) return true;
    
    // Check if it's a prerequisite
    for (const prereq of sequence.prereqs) {
      if (typeof prereq === 'string') {
        if (courseId === prereq) return true;
      } else if (prereq.type === 'alternative') {
        if (prereq.options.includes(courseId)) return true;
      }
    }
    
    return false;
  }

  // Find the currently selected sequence
  getSelectedCulminatingSequence() {
    const culminatingPillar = this.pillars.find(p => p.type === 'culminating');
    if (!culminatingPillar || !culminatingPillar.sequences || culminatingPillar.sequences.length === 0) {
      return null;
    }
    
    // Get department from first sequence's final course
    const deptMatch = culminatingPillar.sequences[0].final.match(/([A-Z]+)/);
    const dept = deptMatch ? deptMatch[1] : null;
    
    if (!dept) return culminatingPillar.sequences[0];
    
    const sequenceIndex = this.getSelectedSequence(dept);
    const selectedSequence = culminatingPillar.sequences[sequenceIndex] || culminatingPillar.sequences[0];
    
    culminatingPillar.selectedSequence = selectedSequence;
    return selectedSequence;
  }

  // Main function to check if a course matches a pillar
  courseMatchesPillar(courseId, pillar) {
    if (!pillar) return false;
    
    const match = courseId.match(/([A-Z]+)(\d+)/);
    if (!match) return false;
    
    const [, dept, numStr] = match;
    const num = parseInt(numStr);
    
    switch (pillar.type) {
      case 'culminating': {
        // For culminating experience, check if the course is part of the selected sequence
        const selectedSequence = this.getSelectedCulminatingSequence();
        return this.isCourseInSequence(courseId, selectedSequence);
      }
      
      case 'prerequisites':
        return pillar.courses.some(prereq => {
          if (typeof prereq === 'string') return prereq === courseId;
          if (prereq.type === 'alternative') return prereq.options.includes(courseId);
          return false;
        });

      case 'specific': {
        // Match against exact course IDs or ranges
        return (pillar.options || []).some(option => {
          // Handle ranges like [ECON001-ECON099]
          if (option.startsWith('[') && option.endsWith(']')) {
            const rangeParts = option.slice(1, -1).split('-');
            if (rangeParts.length === 2) {
              const [startCourse, endCourse] = rangeParts;
              
              const startMatch = startCourse.match(/([A-Z]+)(\d+)/);
              const endMatch = endCourse.match(/([A-Z]+)(\d+)/);
              
              if (startMatch && endMatch) {
                const startDept = startMatch[1];
                const startNum = parseInt(startMatch[2]);
                const endDept = endMatch[1];
                const endNum = parseInt(endMatch[2]);
                
                return dept === startDept && dept === endDept && 
                       num >= startNum && num <= endNum;
              }
            }
          }
          
          // Handle minimum requirements like ECON≥002
          if (option.includes('≥')) {
            const [optDept, minNum] = option.split('≥');
            return dept === optDept && num >= parseInt(minNum);
          }
          
          // Handle exclusions like !ECON010
          if (option.startsWith('!')) {
            return courseId !== option.slice(1);
          }
          
          // Direct match
          return courseId === option;
        });
      }

      case 'range':
        if (pillar.department && dept !== pillar.department) {
          return false;
        }
        return num >= pillar.start && num <= pillar.end;

      default:
        return false;
    }
  }

  // Get a course's status for a specific pillar
  getCourseStatus(courseId, pillarIndex) {
    // Get the allocation for this course
    const allocation = this.courseAllocations.get(courseId);
    if (!allocation) return 'none';
    
    // If course is allocated to this pillar, it's primary
    if (allocation.pillarIndex === pillarIndex) {
      return 'primary';
    }
    
    // If course is in overflow, return overflow status
    if (allocation.status === 'overflow') {
      return 'overflow';
    }
    
    // If course matches this pillar but is allocated elsewhere, it's secondary
    const pillar = this.pillars[pillarIndex];
    if (this.courseMatchesPillar(courseId, pillar)) {
      return 'secondary';
    }
    
    // Otherwise, it's not related to this pillar
    return 'none';
  }

  // Reset all allocations
  resetAllocations() {
    this.courseAllocations.clear();
    this.pillarFills.clear();
    this.overflowCourses.clear();
  }

  // Process the complete list of completed courses
  processCourseList(courses) {
    console.log("Processing course list:", courses);
    // Reset all allocations first
    this.resetAllocations();
    
    // Find the culminating pillar and get the selected sequence
    const culminatingPillar = this.pillars.find(p => p.type === 'culminating');
    const selectedSequence = culminatingPillar ? this.getSelectedCulminatingSequence() : null;
    
    // Track all courses that are part of the selected sequence
    const sequenceCourses = selectedSequence ? this.getAllSequenceCourses(selectedSequence) : [];
    console.log("Sequence courses:", sequenceCourses);
    
    // Create a set to track courses we've already processed
    const processedCourses = new Set();
    
    // FIRST PASS: Process all culminating experience courses first
    if (culminatingPillar && selectedSequence) {
      const pillarCourses = [];
      
      // For each completed course, check if it's part of the selected sequence
      for (const courseId of courses) {
        if (sequenceCourses.includes(courseId)) {
          pillarCourses.push(courseId);
          processedCourses.add(courseId);
          
          // Mark as allocated to this pillar
          this.courseAllocations.set(courseId, {
            pillarIndex: culminatingPillar.index,
            status: 'primary'
          });
          
          console.log(`Allocated ${courseId} to culminating pillar as primary`);
        }
      }
      
      // Update the pillar fills
      if (pillarCourses.length > 0) {
        this.pillarFills.set(culminatingPillar.index, pillarCourses);
      }
    }
    
    // SECOND PASS: Process all remaining courses
    // Sort pillars to handle prerequisites first, then specific/range pillars
    const remainingPillars = this.pillars
      .filter(p => p.type !== 'culminating')
      .sort((a, b) => {
        if (a.type === 'prerequisites') return -1;
        if (b.type === 'prerequisites') return 1;
        return 0;
      });
    
    for (const courseId of courses) {
      // Skip courses already processed in first pass
      if (processedCourses.has(courseId)) continue;
      
      let allocated = false;
      
      // Try to allocate to each remaining pillar
      for (const pillar of remainingPillars) {
        if (this.courseMatchesPillar(courseId, pillar)) {
          const pillarCourses = this.pillarFills.get(pillar.index) || [];
          const maxCourses = pillar.count || 
                           (pillar.type === 'prerequisites' ? pillar.courses?.length : 1);
          
          // Only allocate if pillar isn't already full
          if (pillarCourses.length < maxCourses) {
            pillarCourses.push(courseId);
            this.pillarFills.set(pillar.index, pillarCourses);
            
            this.courseAllocations.set(courseId, {
              pillarIndex: pillar.index,
              status: 'primary'
            });
            
            allocated = true;
            processedCourses.add(courseId);
            console.log(`Allocated ${courseId} to ${pillar.type} pillar ${pillar.index} as primary`);
            break;
          }
        }
      }
      
      // If not allocated to any pillar, add to overflow
      if (!allocated) {
        this.overflowCourses.add(courseId);
        this.courseAllocations.set(courseId, {
          pillarIndex: -1,
          status: 'overflow'
        });
        console.log(`Added ${courseId} to overflow`);
      }
    }
    
    // Return the allocation status
    return {
      pillarFills: Object.fromEntries([...this.pillarFills.entries()]),
      courseStatuses: Object.fromEntries([...this.courseAllocations.entries()]),
      overflowCourses: Array.from(this.overflowCourses)
    };
  }
}

export default RequirementManager;