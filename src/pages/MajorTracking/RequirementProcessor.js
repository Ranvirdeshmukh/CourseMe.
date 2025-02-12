// RequirementProcessor.js
export class RequirementProcessor {
  constructor(requirements, completedCourses) {
    this.requirements = requirements;
    this.completedCourses = completedCourses;
    this.courseAllocations = new Map();
    this.courseColors = new Map();
    this.processRequirements();
  }

  getPossibleCoursesForPillar(pillar) {
    if (!pillar) return [];
    
    switch (pillar.type) {
      case 'prerequisites':
        return pillar.courses.flatMap(course => {
          if (typeof course === 'string') return [this.normalizeCourseId(course)];
          if (course.type === 'alternative') {
            return course.options.map(opt => this.normalizeCourseId(opt));
          }
          return [];
        });
      
      case 'range':
        const courses = [];
        for (let i = pillar.start; i <= pillar.end; i++) {
          courses.push(`${pillar.department}${i.toString().padStart(3, '0')}`);
        }
        return courses;
      
      case 'specific':
        return pillar.options.map(courseId => this.normalizeCourseId(courseId));
      
      default:
        return [];
    }
  }

  processRequirements() {
    const sortedPillars = this.sortPillarsByPriority();
    
    sortedPillars
      .filter(pillar => pillar.type === 'prerequisites')
      .forEach(pillar => this.allocatePrerequisites(pillar));

    sortedPillars
      .filter(pillar => pillar.type === 'specific')
      .forEach(pillar => this.allocateSpecificCourses(pillar));

    this.processRangeRequirements(sortedPillars.filter(pillar => pillar.type === 'range'));
  }

  sortPillarsByPriority() {
    return [...this.requirements.pillars].map((pillar, index) => ({
      ...pillar,
      originalIndex: index,
      priority: this.calculatePillarPriority(pillar)
    })).sort((a, b) => a.priority - b.priority);
  }

  calculatePillarPriority(pillar) {
    switch (pillar.type) {
      case 'prerequisites':
        return 0;
      case 'specific':
        return 1;
      case 'range':
        const rangeSize = pillar.end - pillar.start + 1;
        return 2 + (rangeSize / pillar.count);
      default:
        return 999;
    }
  }
  allocatePrerequisites(pillar) {
    pillar.courses.forEach(course => {
      if (typeof course === 'string') {
        const courseId = this.normalizeCourseId(course);
        if (this.completedCourses.includes(courseId)) {
          this.courseAllocations.set(courseId, {
            pillarIndex: pillar.originalIndex,
            pillarName: pillar.description,
            isLocked: true,
            type: 'prerequisite'
          });
        }
      } else if (course.type === 'alternative') {
        // Handle alternative prerequisites
        const matchedCourse = course.options.find(opt => 
          this.completedCourses.includes(this.normalizeCourseId(opt))
        );
        if (matchedCourse) {
          const courseId = this.normalizeCourseId(matchedCourse);
          this.courseAllocations.set(courseId, {
            pillarIndex: pillar.originalIndex,
            pillarName: pillar.description,
            isLocked: true,
            type: 'prerequisite'
          });
        }
      }
    });
  }

  allocateSpecificCourses(pillar) {
    pillar.options.forEach(courseId => {
      const normalizedId = this.normalizeCourseId(courseId);
      if (this.completedCourses.includes(normalizedId) && !this.courseAllocations.has(normalizedId)) {
        this.courseAllocations.set(normalizedId, {
          pillarIndex: pillar.originalIndex,
          pillarName: pillar.description,
          isLocked: true,
          type: 'specific'
        });
      }
    });
  }

  processRangeRequirements(rangePillars) {
    // Sort range pillars by strictness (smaller ranges first)
    const sortedRangePillars = rangePillars.sort((a, b) => {
      const flexibilityA = (a.end - a.start + 1) / a.count;
      const flexibilityB = (b.end - b.start + 1) / b.count;
      return flexibilityA - flexibilityB;
    });

    // Process each range pillar
    sortedRangePillars.forEach(pillar => {
      let remainingCount = pillar.count;
      const availableCourses = this.completedCourses
        .filter(courseId => {
          return this.isInRange(courseId, pillar.department, pillar.start, pillar.end) &&
                 !this.isOptimallyAllocated(courseId);
        })
        .sort((a, b) => this.compareCourseNumbers(a, b));

      // Allocate courses up to the required count
      availableCourses.slice(0, remainingCount).forEach(courseId => {
        this.courseAllocations.set(courseId, {
          pillarIndex: pillar.originalIndex,
          pillarName: pillar.description,
          isLocked: false,
          type: 'range',
          isOptimal: true
        });
        
        // Mark this as the primary allocation for color
        if (!this.courseColors.has(courseId)) {
          this.courseColors.set(courseId, pillar.originalIndex);
        }
      });

      // Track secondary allocations for overlapping ranges
      availableCourses.forEach(courseId => {
        if (!this.courseAllocations.has(courseId)) {
          this.courseAllocations.set(courseId, {
            pillarIndex: pillar.originalIndex,
            pillarName: pillar.description,
            isLocked: false,
            type: 'range',
            isOptimal: false
          });
        }
      });
    });
  }

  compareCourseNumbers(courseIdA, courseIdB) {
    const numA = parseInt(courseIdA.match(/\d+/)[0]);
    const numB = parseInt(courseIdB.match(/\d+/)[0]);
    return numA - numB;
  }

  isInRange(courseId, department, start, end) {
    const match = courseId.match(/([A-Z]+)(\d+)/);
    if (!match) return false;
    const [, dept, numStr] = match;
    const num = parseInt(numStr);
    return dept === department && num >= start && num <= end;
  }

  normalizeCourseId(courseId) {
    if (!courseId) return null;
    const match = courseId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return courseId;
    const [, dept, num] = match;
    return `${dept}${num.padStart(3, '0')}`;
  }
  isOptimallyAllocated(courseId) {
    const allocation = this.courseAllocations.get(courseId);
    return allocation?.isOptimal;
  }

  getCourseStatus(course, currentPillarIndex) {
    const courseId = `${course.department}${course.course_number}`;
    const allocation = this.courseAllocations.get(courseId);
    const isCompleted = this.completedCourses.includes(courseId);
    const primaryAllocation = this.courseColors.get(courseId);

    console.log(`[RequirementProcessor] Getting status for ${courseId}:`, {
      isCompleted,
      allocation,
      primaryAllocation,
      currentPillarIndex
    });

    // Determine color status based on allocation
    let colorStatus = 'none';
    if (primaryAllocation === currentPillarIndex) {
      colorStatus = 'primary'; // Will be colored green
    } else if (allocation && allocation.pillarIndex === currentPillarIndex) {
      colorStatus = 'secondary'; // Will be colored yellow
    }

    return {
      isCompleted,
      isUsedInOtherPillar: primaryAllocation !== currentPillarIndex,
      usedInPillar: allocation?.pillarName,
      isLocked: allocation?.isLocked || false,
      allocationInfo: allocation ? {
        ...allocation,
        isCurrentPillar: allocation.pillarIndex === currentPillarIndex
      } : null,
      colorStatus
    };
  }

  normalizeCourseId(courseId) {
    if (!courseId) return null;
    const match = courseId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return courseId;
    const [, dept, num] = match;
    return `${dept}${num.padStart(3, '0')}`;
  }

  evaluateRequirements() {
    const results = this.requirements.pillars.map((pillar, index) => {
      const matchingCourses = [...this.courseAllocations.entries()]
        .filter(([, allocation]) => allocation.pillarIndex === index)
        .map(([courseId]) => courseId);

      return {
        pillarIndex: index,
        isComplete: this.isPillarComplete(pillar, matchingCourses),
        matchingCourses,
        neededCount: this.getNeededCount(pillar, matchingCourses)
      };
    });

    return {
      results,
      courseAllocations: this.courseAllocations
    };
  }

  isPillarComplete(pillar, matchingCourses) {
    switch (pillar.type) {
      case 'prerequisites':
        return matchingCourses.length === pillar.courses.length;
      case 'specific':
        return matchingCourses.length > 0;
      case 'range':
        return matchingCourses.length >= pillar.count;
      default:
        return false;
    }
  }

  getNeededCount(pillar, matchingCourses) {
    switch (pillar.type) {
      case 'prerequisites':
        return pillar.courses.length - matchingCourses.length;
      case 'specific':
        return matchingCourses.length > 0 ? 0 : 1;
      case 'range':
        return Math.max(0, pillar.count - matchingCourses.length);
      default:
        return 0;
    }
  }

  getRequirementSummary() {
    return this.requirements.pillars.map((pillar, index) => {
      const matchingCourses = [...this.courseAllocations.entries()]
        .filter(([, allocation]) => allocation.pillarIndex === index)
        .map(([courseId]) => courseId);

      return {
        description: pillar.description,
        required: pillar.count || pillar.courses?.length || 1,
        completed: matchingCourses.length,
        courses: matchingCourses
      };
    });
  }
}

export default RequirementProcessor;