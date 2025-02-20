class RequirementManager {
    constructor(majorRequirements) {
        this.pillars = majorRequirements.pillars.map((pillar, index) => ({
            ...pillar,
            index
        }));
        this.courseAllocations = new Map();
        this.pillarFills = new Map();
        this.overflowCourses = new Set();
        this.sortPillarsBySpecificity();
    }
  
    sortPillarsBySpecificity() {
        this.pillars.sort((a, b) => {
            if (a.type === 'prerequisites') return -1;
            if (b.type === 'prerequisites') return 1;
            return 0;
        });
    }
  
    parseComplexRequirement(reqStr) {
        if (!reqStr) return null;
  
        console.log('Parsing requirement string:', reqStr);
  
        const result = {
            departments: new Set(),
            minNumbers: new Map(),
            excludedCourses: new Set(),
            departmentLimits: new Map(),
            totalRequired: 1
        };
  
        // Split into main requirement and limit part
        const [mainPart, limitPart] = reqStr.split(':');
        console.log('Split into:', { mainPart, limitPart });
  
        // Get total required courses from main part
        const totalMatch = mainPart.match(/#(\d+)/);
        if (totalMatch) {
            result.totalRequired = parseInt(totalMatch[1]);
            console.log('Found total required:', result.totalRequired);
        }
  
        // Parse main requirements - need to handle both curly and square brackets
        const mainReqMatch = mainPart.match(/[{\[]([^}\]]+)[}\]]/);
        if (mainReqMatch) {
            const requirements = mainReqMatch[1];
            const conditions = requirements.split(',').map(cond => cond.trim());
            
            conditions.forEach(cond => {
                if (cond.includes('≥')) {
                    const [dept, num] = cond.split('≥');
                    const trimmedDept = dept.trim();
                    result.departments.add(trimmedDept);
                    result.minNumbers.set(trimmedDept, parseInt(num));
                    console.log(`Added department ${trimmedDept} with min ${num}`);
                } else if (cond.startsWith('!')) {
                    result.excludedCourses.add(cond.slice(1));
                    console.log(`Added excluded course ${cond.slice(1)}`);
                }
            });
        }
  
        // Parse department limits
        if (limitPart) {
            const limitMatch = limitPart.match(/#(\d+)\[([A-Z]+)\]/);
            if (limitMatch) {
                const [, limit, dept] = limitMatch;
                result.departmentLimits.set(dept, parseInt(limit));
                // Make sure the department is in the valid departments set
                result.departments.add(dept);
                console.log(`Added department limit: ${dept} max ${limit}`);
            }
        }
  
        console.log('Final parsed result:', JSON.stringify(result, (key, value) => {
            if (value instanceof Set) return [...value];
            if (value instanceof Map) return Object.fromEntries(value);
            return value;
        }, 2));
        
        return result;
    }
  
    getDepartmentCount(pillarIndex, department) {
        const pillarCourses = this.pillarFills.get(pillarIndex) || [];
        const count = pillarCourses.filter(courseId => courseId.startsWith(department)).length;
        console.log(`Department ${department} count in pillar ${pillarIndex}: ${count}`);
        return count;
    }
  
    courseMatchesComplexRequirement(courseId, requirement, pillarIndex) {
        const match = courseId.match(/([A-Z]+)(\d+)/);
        if (!match) return false;
  
        const [, dept, numStr] = match;
        const num = parseInt(numStr);
  
        // Check if course is in excluded list
        if (requirement.excludedCourses.has(courseId)) {
            console.log(`${courseId} is in excluded list`);
            return false;
        }
  
        // Check if this is a valid department and meets minimum number
        if (requirement.departments.has(dept)) {
            const minNum = requirement.minNumbers.get(dept);
            if (minNum && num < minNum) {
                console.log(`${courseId} does not meet minimum number requirement: ${num} < ${minNum}`);
                return false;
            }
  
            // Only check department limits for departments that have them
            if (requirement.departmentLimits.has(dept)) {
                const limit = requirement.departmentLimits.get(dept);
                const currentCount = this.getDepartmentCount(pillarIndex, dept);
                
                // If the course is already in the pillar, don't count it against the limit
                const pillarCourses = this.pillarFills.get(pillarIndex) || [];
                const isAlreadyInPillar = pillarCourses.includes(courseId);
                
                if (!isAlreadyInPillar && currentCount >= limit) {
                    console.log(`${courseId} would exceed ${dept} limit of ${limit}`);
                    return false;
                }
            }
  
            console.log(`${courseId} matches requirements`);
            return true;
        }
  
        console.log(`${courseId} is not from a valid department`);
        return false;
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
        // Handle range notation [COSC030-COSC089]
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
        
        // Handle minimum number notation MATH≥020
        if (option.includes('≥')) {
          const [optDept, minNum] = option.split('≥');
          return dept === optDept && num >= parseInt(minNum);
        }
        
        // Handle direct number match for department-specific courses
        if (option.match(/^\d+$/)) {
          return dept === (pillar.department || 'COSC') && paddedNum === option.padStart(3, '0');
        }
        
        // Handle direct course match (e.g., COSC094)
        return courseId === option;
      });
    }
  
    courseMatchesPillar(courseId, pillar) {
      const match = courseId.match(/([A-Z]+)(\d+)/);
      if (!match) return false;
      
      const [, dept, numStr] = match;
      const num = parseInt(numStr);
    
      switch (pillar.type) {
        case 'prerequisites':
          return this.matchPrerequisite(courseId, pillar);
    
        case 'specific':
          return this.matchSpecificRequirement(courseId, pillar);
    
        case 'range':
          // Check department match if specified
          if (pillar.department && dept !== pillar.department) {
            return false;
          }
          // Check if course number falls within range
          return num >= pillar.start && num <= pillar.end;
    
        case 'complex':
          const reqStr = pillar.options[0];
          const req = this.parseComplexRequirement(reqStr);
          if (!req) return false;
          return this.courseMatchesComplexRequirement(courseId, req, pillar.index);
    
        default:
          return false;
      }
    }
    allocateCourse(courseId) {
      console.log(`Attempting to allocate ${courseId}`);
      
      // Remove any existing allocation first
      this.deallocateCourse(courseId);
      let allocated = false;
    
      // Try to allocate to each pillar in order
      for (const pillar of this.pillars) {
        console.log(`Checking pillar ${pillar.index} (${pillar.type})`);
    
        // Check if course matches pillar requirements
        if (!this.courseMatchesPillar(courseId, pillar)) {
          console.log(`${courseId} does not match pillar ${pillar.index} requirements`);
          continue;
        }
    
        const pillarCourses = this.pillarFills.get(pillar.index) || [];
  
        // For prerequisites
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
              this.pillarFills.set(pillar.index, pillarCourses);
              this.courseAllocations.set(courseId, {
                pillarIndex: pillar.index,
                status: 'primary'
              });
              allocated = true;
              break;
            }
          }
        }
        // For other pillar types (including 'specific')
        else {
          const req = pillar.type === 'complex' ? 
            this.parseComplexRequirement(pillar.options[0]) : 
            { totalRequired: pillar.count || 1 };
    
          if (pillarCourses.length < req.totalRequired) {
            pillarCourses.push(courseId);
            this.pillarFills.set(pillar.index, pillarCourses);
            this.courseAllocations.set(courseId, {
              pillarIndex: pillar.index,
              status: 'primary'
            });
            allocated = true;
            console.log(`Successfully allocated ${courseId} to pillar ${pillar.index}`);
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
  
        if (this.overflowCourses.has(courseId)) {
            return 'overflow';
        }
  
        if (allocation.pillarIndex === pillarIndex) {
            return 'primary';
        }
  
        if (this.courseMatchesPillar(courseId, this.pillars[pillarIndex])) {
            return 'secondary';
        }
  
        return 'none';
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
  
        // Allocate each course in order
        courses.forEach(courseId => {
            this.allocateCourse(courseId);
        });
  
        return this.getFullStatus();
    }
  }
  
  export default RequirementManager;