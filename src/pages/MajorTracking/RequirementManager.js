class RequirementManager {
    constructor(majorRequirements) {
        console.log('Initializing RequirementManager with:', majorRequirements);
        this.pillars = majorRequirements.pillars;
        this.courseAllocations = new Map();
        this.pillarFills = new Map();
        this.overflowCourses = new Set();
        
        // Debug log each pillar
        this.pillars.forEach((pillar, index) => {
            console.log(`Pillar ${index}:`, {
                type: pillar.type,
                count: pillar.count,
                courses: pillar.courses,
                options: pillar.options,
                range: pillar.range
            });
        });
        
        this.sortPillarsBySpecificity();
    }

    sortPillarsBySpecificity() {
        // Sort pillars by range size (smaller ranges first)
        this.pillars.sort((a, b) => {
            // Prerequisites always come first
            if (a.type === 'prerequisites') return -1;
            if (b.type === 'prerequisites') return 1;
            
            // Then handle ranges
            if (a.type === 'range' && b.type === 'range') {
                const aSize = a.end - a.start;
                const bSize = b.end - b.start;
                return aSize - bSize;
            }
            
            // Specific type goes last unless it includes a range option
            if (a.type === 'specific' && !a.options.some(opt => opt.includes('-') || opt.includes('≥'))) return 1;
            if (b.type === 'specific' && !b.options.some(opt => opt.includes('-') || opt.includes('≥'))) return -1;
            
            return 0;
        });
    }

    courseMatchesPillar(courseId, pillar) {
        console.log(`Checking if ${courseId} matches pillar:`, pillar);
        
        const match = courseId.match(/([A-Z]+)(\d+)/);
        if (!match) {
            console.log('Invalid course ID format');
            return false;
        }
        
        const [, dept, numStr] = match;
        const num = parseInt(numStr);
        const paddedNum = numStr.padStart(3, '0');
        console.log(`Parsed course: dept=${dept}, num=${num}, paddedNum=${paddedNum}`);
    
        switch (pillar.type) {
            case 'prerequisites':
                // Check each prerequisite group
                return pillar.courses.some(prereq => {
                    if (typeof prereq === 'string') {
                        // Direct course requirement
                        const matches = prereq === courseId;
                        console.log(`Checking direct prereq ${prereq}: ${matches}`);
                        return matches;
                    }
                    if (prereq.type === 'alternative') {
                        // OR group
                        const matches = prereq.options.includes(courseId);
                        console.log(`Checking OR group ${prereq.options}: ${matches}`);
                        return matches;
                    }
                    return false;
                });
    
            case 'specific':
                return pillar.options.some(option => {
                    console.log(`Checking specific option: ${option}`);
                    // Handle range notation [030-089]
                    if (option.startsWith('[') && option.endsWith(']')) {
                        const [start, end] = option.slice(1, -1).split('-').map(n => parseInt(n));
                        const matches = dept === (pillar.department || 'COSC') && 
                                     num >= start && num <= end;
                        console.log(`Checking range ${start}-${end}: ${matches}`);
                        return matches;
                    }
                    // Handle greater than or equal notation MATH≥020
                    if (option.includes('≥')) {
                        const [optDept, minNum] = option.split('≥');
                        const minPadded = minNum.padStart(3, '0');
                        const matches = dept === optDept && paddedNum >= minPadded;
                        console.log(`Checking GTE ${optDept}≥${minPadded}: ${matches}`);
                        return matches;
                    }
                    // Handle exact course numbers (like 094)
                    if (option.match(/^\d+$/)) {
                        const optionPadded = option.padStart(3, '0');
                        const matches = dept === (pillar.department || 'COSC') && 
                                     paddedNum === optionPadded;
                        console.log(`Checking exact number ${optionPadded}: ${matches}, dept=${dept}, pillarDept=${pillar.department || 'COSC'}`);
                        return matches;
                    }
                    // Handle full course codes
                    const matches = courseId === option;
                    console.log(`Checking exact match ${option}: ${matches}`);
                    return matches;
                });
    
            case 'range':
                const rangeMatch = dept === pillar.department && 
                                 num >= pillar.start && 
                                 num <= pillar.end;
                console.log(`Range match result: ${rangeMatch}`);
                return rangeMatch;
    
            default:
                console.log('Unknown pillar type');
                return false;
        }
    }

    getCourseStatus(courseId, pillarIndex) {
        const allocation = this.courseAllocations.get(courseId);
        if (!allocation) return 'none';

        // Check overflow first - if it's in overflow, always return overflow
        if (this.overflowCourses.has(courseId)) {
            return 'overflow';
        }

        // If course is used in this pillar
        if (allocation.pillarIndex === pillarIndex) {
            return 'primary';
        }

        // If course could be used in this pillar but is used elsewhere
        if (this.courseMatchesPillar(courseId, this.pillars[pillarIndex])) {
            return 'secondary';
        }

        return 'none';
    }

    allocateCourse(courseId) {
        // Remove any existing allocation
        this.deallocateCourse(courseId);

        let allocated = false;
        
        // Try to allocate to each pillar in order
        for (let i = 0; i < this.pillars.length; i++) {
            const pillar = this.pillars[i];
            if (!this.courseMatchesPillar(courseId, pillar)) continue;

            const pillarCourses = this.pillarFills.get(i) || [];
            
            // For prerequisites, check if we need this course
            if (pillar.type === 'prerequisites') {
                // Check if this prerequisite group is already satisfied
                const prereqGroup = pillar.courses.find(prereq => {
                    if (typeof prereq === 'string') {
                        return prereq === courseId;
                    }
                    if (prereq.type === 'alternative') {
                        return prereq.options.includes(courseId);
                    }
                    return false;
                });

                if (prereqGroup) {
                    const groupIndex = pillar.courses.indexOf(prereqGroup);
                    const groupSatisfied = pillarCourses.some(course => {
                        if (typeof prereqGroup === 'string') {
                            return course === prereqGroup;
                        }
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
            else if (pillarCourses.length < pillar.count) {
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

        // If course couldn't be allocated to any pillar, add to overflow
        if (!allocated) {
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