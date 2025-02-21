import { doc, getFirestore, collection, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, } from 'firebase/auth';

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
    this.sortPillarsBySpecificity();
  }

  setSelectedSequence(majorCode, sequenceIndex) {
    this.selectedSequences.set(majorCode, sequenceIndex);
    // We'll add Firebase update logic here
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
              count: 1
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

  sortPillarsBySpecificity() {
    this.pillars.sort((a, b) => {
      // Culminating experience has highest priority
      if (a.type === 'culminating') return -1;
      if (b.type === 'culminating') return 1;
      // Prerequisites come second
      if (a.type === 'prerequisites') return -1;
      if (b.type === 'prerequisites') return 1;
      // Other types maintain their relative order
      return 0;
    });
  }

  isPartOfSelectedSequence(courseId, sequence) {
    if (!sequence) return false;

    // Check if the course is the final course
    if (courseId === sequence.final) {
      console.log(`${courseId} matches final course ${sequence.final}`);
      return true;
    }

    // Check if the course is a direct prerequisite or part of an alternative group
    for (const prereq of sequence.prereqs) {
      if (typeof prereq === 'string') {
        if (prereq === courseId) {
          console.log(`${courseId} matches direct prerequisite`);
          return true;
        }
      } else if (prereq.type === 'alternative') {
        // Handle prerequisites wrapped in curly braces
        const cleanedOptions = prereq.options.map(opt => {
          // Remove curly braces if present
          return opt.replace(/[{}]/g, '').trim();
        });
        
        if (cleanedOptions.includes(courseId)) {
          console.log(`${courseId} matches alternative prerequisite in ${cleanedOptions.join('|')}`);
          return true;
        }
      }
    }

    console.log(`${courseId} does not match any part of sequence ${sequence.final}`);
    return false;
  }

  getAlternativeGroupForCourse(courseId, sequence) {
    for (const prereq of sequence.prereqs) {
      if (prereq.type === 'alternative') {
        // Handle prerequisites wrapped in curly braces
        const cleanedOptions = prereq.options.map(opt => {
          // Remove curly braces if present
          return opt.replace(/[{}]/g, '').trim();
        });
        
        if (cleanedOptions.includes(courseId)) {
          // Return cleaned up version of alternative group
          return {
            ...prereq,
            options: cleanedOptions
          };
        }
      }
    }
    return undefined;
  }

  matchPrerequisite(courseId, pillar) {
    return pillar.courses.some(prereq => {
      if (typeof prereq === 'string') return prereq === courseId;
      if (prereq.type === 'alternative') return prereq.options.includes(courseId);
      return false;
    });
  }

  matchSpecificRequirement(courseId, pillar) {
    const match = courseId.match(/([A-Z]+)(\d+)/);
    if (!match) return false;

    const [, dept, numStr] = match;
    const num = parseInt(numStr);
    const paddedNum = numStr.padStart(3, '0');

    return pillar.options.some(option => {
      if (option.startsWith('[') && option.endsWith(']')) {
        const [start, end] = option.slice(1, -1).split('-').map(r => {
          const m = r.match(/([A-Z]+)(\d+)/);
          return {
            dept: m[1],
            num: parseInt(m[2])
          };
        });
        return dept === start.dept && num >= start.num && num <= end.num;
      }

      if (option.includes('≥')) {
        const [optDept, minNum] = option.split('≥');
        return dept === optDept && num >= parseInt(minNum);
      }

      if (option.match(/^\d+$/)) {
        return dept === (pillar.department || 'COSC') && paddedNum === option.padStart(3, '0');
      }

      return courseId === option;
    });
  }

  courseMatchesPillar(courseId, pillar) {
    if (!pillar) return false;
    
    const match = courseId.match(/([A-Z]+)(\d+)/);
    if (!match) return false;
    
    const [, dept, numStr] = match;
    const num = parseInt(numStr);
  
    switch (pillar.type) {
      case 'culminating': {
        if (!pillar.sequences) {
          console.log(`No sequences available for pillar`);
          return false;
        }
        
        // Get the selected sequence for this major
        const sequenceIndex = this.getSelectedSequence(dept);
        const selectedSequence = pillar.sequences[sequenceIndex];
        
        if (!selectedSequence) {
          console.log(`No selected sequence found for index ${sequenceIndex}`);
          return false;
        }

        pillar.selectedSequence = selectedSequence; // Set the selected sequence
        const isMatch = this.isPartOfSelectedSequence(courseId, selectedSequence);
        console.log(`Checking if ${courseId} matches culminating sequence: ${isMatch}`);
        return isMatch;
      }
      case 'prerequisites':
        return this.matchPrerequisite(courseId, pillar);

      case 'specific':
        return this.matchSpecificRequirement(courseId, pillar);

      case 'range':
        if (pillar.department && dept !== pillar.department) {
          return false;
        }
        return num >= pillar.start && num <= pillar.end;

      case 'complex': {
        const reqStr = pillar.options[0];
        const req = this.parseComplexRequirement(reqStr);
        if (!req) return false;
        return this.courseMatchesComplexRequirement(courseId, req, pillar.index);
      }

      default:
        return false;
    }
  }

  getCourseStatus(courseId, pillarIndex) {
    const allocation = this.courseAllocations.get(courseId);
    if (!allocation) return 'none';
    
    const pillar = this.pillars[pillarIndex];
    
    if (pillar?.type === 'culminating' && pillar.selectedSequence) {
      const sequence = pillar.selectedSequence;
      
      if (!this.isPartOfSelectedSequence(courseId, sequence)) {
        return 'none';
      }
      
      const altGroup = this.getAlternativeGroupForCourse(courseId, sequence);
      if (altGroup) {
        const pillarCourses = this.pillarFills.get(pillarIndex) || [];
        const alternativesInPillar = pillarCourses.filter(course => 
          altGroup.options.includes(course)
        );
        
        if (alternativesInPillar.length > 0) {
          // If this course is the first alternative selected, it's primary
          if (alternativesInPillar[0] === courseId) {
            return 'primary';
          }
          // Any subsequent alternatives should be overflow
          return 'overflow';
        }
      }
      
      return allocation.pillarIndex === pillarIndex ? 'primary' : 'secondary';
    }
    
    // For non-culminating pillars
    if (allocation.pillarIndex === pillarIndex) {
      return 'primary';
    }
    
    if (this.overflowCourses.has(courseId)) {
      return 'overflow';
    }
    
    return this.courseMatchesPillar(courseId, pillar) ? 'secondary' : 'none';
  }

  deallocateCourse(courseId) {
    const existing = this.courseAllocations.get(courseId);
    if (!existing) return;

    if (existing.pillarIndex >= 0) {
      const pillarCourses = this.pillarFills.get(existing.pillarIndex) || [];
      const index = pillarCourses.indexOf(courseId);
      if (index >= 0) {
        pillarCourses.splice(index, 1);
        this.pillarFills.set(existing.pillarIndex, pillarCourses);
      }
    }

    this.courseAllocations.delete(courseId);
    this.overflowCourses.delete(courseId);
  }

  allocateCourse(courseId) {
    console.log(`Attempting to allocate ${courseId}`);
    
    this.deallocateCourse(courseId);
    let allocated = false;

    // First, try to allocate to culminating experience if the course matches
    const culminatingPillar = this.pillars.find(p => p.type === 'culminating');
    if (culminatingPillar && this.courseMatchesPillar(courseId, culminatingPillar)) {
      console.log(`${courseId} matches culminating experience requirements`);
      const pillarCourses = this.pillarFills.get(culminatingPillar.index) || [];
      
      const altGroup = this.getAlternativeGroupForCourse(courseId, culminatingPillar.selectedSequence);
      if (altGroup) {
        const altCourses = pillarCourses.filter(course => altGroup.options.includes(course));
        if (altCourses.length === 0) {
          pillarCourses.push(courseId);
          this.pillarFills.set(culminatingPillar.index, pillarCourses);
          this.courseAllocations.set(courseId, {
            pillarIndex: culminatingPillar.index,
            status: 'primary'
          });
        } else {
          this.overflowCourses.add(courseId);
          this.courseAllocations.set(courseId, {
            pillarIndex: -1,
            status: 'overflow'
          });
        }
        return this.getFullStatus();
      } else {
        pillarCourses.push(courseId);
        this.pillarFills.set(culminatingPillar.index, pillarCourses);
        this.courseAllocations.set(courseId, {
          pillarIndex: culminatingPillar.index,
          status: 'primary'
        });
        return this.getFullStatus();
      }
    }
  
    // Then try other pillars
    for (let i = 0; i < this.pillars.length; i++) {
      const pillar = this.pillars[i];
      if (pillar.type === 'culminating') continue; // Skip culminating as we already checked it
      
      console.log(`Checking pillar ${i} (${pillar.type})`);
      
      if (!this.courseMatchesPillar(courseId, pillar)) {
        console.log(`${courseId} does not match pillar ${i} requirements`);
        continue;
      }
      
      console.log(`${courseId} matches pillar ${i} requirements`);
      const pillarCourses = this.pillarFills.get(i) || [];

      // Handle prerequisites
      if (pillar.type === 'prerequisites') {
        const prereqGroup = pillar.courses.find(prereq => {
          if (typeof prereq === 'string') return prereq === courseId;
          if (prereq.type === 'alternative') return prereq.options.includes(courseId);
          return false;
        });

        if (prereqGroup) {
          const groupSatisfied = pillarCourses.some(course => {
            if (typeof prereqGroup === 'string') return course === prereqGroup;
            return prereqGroup.options.includes(course);
          });

          if (!groupSatisfied) {
            pillarCourses.push(courseId);
            this.pillarFills.set(i, pillarCourses);
            this.courseAllocations.set(courseId, {
              pillarIndex: i,
              status: 'primary'
            });
            allocated = true;
            break;
          }
        }
      }
      // For other pillar types
      else {
        const requirement = pillar.type === 'complex' ? 
          this.parseComplexRequirement(pillar.options[0]) : 
          { totalRequired: pillar.count || 1 };

        if (pillarCourses.length < requirement.totalRequired) {
          pillarCourses.push(courseId);
          this.pillarFills.set(i, pillarCourses);
          this.courseAllocations.set(courseId, {
            pillarIndex: i,
            status: 'primary'
          });
          allocated = true;
          console.log(`Successfully allocated ${courseId} to pillar ${i}`);
          break;
        }
      }
    }
  
    // If course couldn't be allocated to any pillar, add to overflow
    if (!allocated) {
      console.log(`Adding ${courseId} to overflow`);
      this.overflowCourses.add(courseId);
      this.courseAllocations.set(courseId, {
        pillarIndex: -1,
        status: 'overflow'
      });
    }
  
    return this.getFullStatus();
  }
  
    deallocateCourse(courseId) {
      const existing = this.courseAllocations.get(courseId);
      if (!existing) return;
  
      if (existing.pillarIndex >= 0) {
        const pillarCourses = this.pillarFills.get(existing.pillarIndex) || [];
        const index = pillarCourses.indexOf(courseId);
        if (index >= 0) {
          pillarCourses.splice(index, 1);
          this.pillarFills.set(existing.pillarIndex, pillarCourses);
        }
      }
  
      this.courseAllocations.delete(courseId);
      this.overflowCourses.delete(courseId);
    }
    
      getCourseStatus(courseId, pillarIndex) {
        const allocation = this.courseAllocations.get(courseId);
        if (!allocation) return 'none';
        
        const pillar = this.pillars[pillarIndex];
        
        if (pillar?.type === 'culminating' && pillar.selectedSequence) {
          const sequence = pillar.selectedSequence;
          
          if (!this.isPartOfSelectedSequence(courseId, sequence)) {
            return 'none';
          }
          
          const altGroup = this.getAlternativeGroupForCourse(courseId, sequence);
          if (altGroup) {
            const pillarCourses = this.pillarFills.get(pillarIndex) || [];
            const alternativesInPillar = pillarCourses.filter(course => 
              altGroup.options.includes(course)
            );
            
            if (alternativesInPillar.length > 0) {
              // If this course is the first alternative selected, it's primary
              if (alternativesInPillar[0] === courseId) {
                return 'primary';
              }
              // Any subsequent alternatives should be overflow
              return 'overflow';
            }
          }
          
          return allocation.pillarIndex === pillarIndex ? 'primary' : 'secondary';
        }
        
        // For non-culminating pillars
        if (allocation.pillarIndex === pillarIndex) {
          return 'primary';
        }
        
        if (this.overflowCourses.has(courseId)) {
          return 'overflow';
        }
        
        return this.courseMatchesPillar(courseId, pillar) ? 'secondary' : 'none';
      }
  
      getFullStatus() {
        return {
          pillarFills: Object.fromEntries([...this.pillarFills.entries()]),
          courseStatuses: Object.fromEntries([...this.courseAllocations.entries()]),
          overflowCourses: Array.from(this.overflowCourses)
        };
      }
  
      processCourseList(courses) {
        // Clear existing allocations
        this.courseAllocations.clear();
        this.pillarFills.clear();
        this.overflowCourses.clear();
    
        // Ensure proper pillar indexing
        this.pillars = this.pillars.map((pillar, index) => ({
          ...pillar,
          index
        }));
        this.sortPillarsBySpecificity();
    
        // Process each course
        courses.forEach(courseId => {
          this.allocateCourse(courseId);
        });
    
        return this.getFullStatus();
      }
  }
  
  export default RequirementManager;