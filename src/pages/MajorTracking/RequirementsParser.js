// RequirementsParser.js
import _ from 'lodash';

class RequirementsParser {
  constructor(programData) {
    this.programData = programData;
  }

  // Parse a full requirements string into structured format
  parseRequirements(reqString) {
    if (!reqString) return null;
    
    // Remove outer parentheses and split by AND operator
    const components = reqString
      .slice(1, -1)  // Remove outer parentheses
      .split('&')
      .map(s => s.trim());
    
    return {
      prerequisites: this.parsePrerequisites(components),
      courseRanges: this.parseCourseRanges(components),
      specificRequirements: this.parseSpecificRequirements(components),
      culminatingExperience: components.includes('^')
    };
  }

  // Parse prerequisites section (@[...])
  parsePrerequisites(components) {
    const prereqComponent = components.find(c => c.startsWith('@['));
    if (!prereqComponent) return [];

    const prereqStr = prereqComponent.slice(2, -1);
    return this.parsePrereqList(prereqStr);
  }

  // Parse a prerequisite list, handling alternatives
  parsePrereqList(prereqStr) {
    const prereqs = [];
    let currentItem = '';
    let braceDepth = 0;
    
    for (const char of prereqStr) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      
      if (char === ',' && braceDepth === 0) {
        if (currentItem) prereqs.push(this.parsePrereqItem(currentItem.trim()));
        currentItem = '';
      } else {
        currentItem += char;
      }
    }
    
    if (currentItem) prereqs.push(this.parsePrereqItem(currentItem.trim()));
    return prereqs;
  }

  // Parse individual prerequisite item, handling alternatives
  parsePrereqItem(item) {
    if (item.startsWith('{')) {
      const alternatives = item
        .slice(1, -1)
        .split('|')
        .map(alt => this.parseCourseCode(alt.trim()));
      return {
        type: 'alternative',
        courses: alternatives
      };
    }
    return {
      type: 'single',
      course: this.parseCourseCode(item)
    };
  }

  // Parse course ranges (#N[...])
  parseCourseRanges(components) {
    return components
      .filter(c => c.startsWith('#'))
      .map(range => {
        const match = range.match(/#(\d+)\[(\d+)-(\d+)\]/);
        if (!match) {
          const gteMatch = range.match(/#(\d+)\[≥(\d+)\]/);
          if (gteMatch) {
            return {
              type: 'gte',
              count: parseInt(gteMatch[1]),
              minimum: parseInt(gteMatch[2])
            };
          }
          return null;
        }
        return {
          type: 'range',
          count: parseInt(match[1]),
          start: parseInt(match[2]),
          end: parseInt(match[3])
        };
      })
      .filter(Boolean);
  }

  // Parse specific course requirements (#{...})
  parseSpecificRequirements(components) {
    return components
      .filter(c => c.startsWith('#{'))
      .map(req => {
        const inner = req.slice(2, -1);
        if (inner.includes('|')) {
          return {
            type: 'alternative',
            courses: inner.split('|').map(c => this.parseCourseCode(c.trim()))
          };
        }
        return {
          type: 'single',
          course: this.parseCourseCode(inner)
        };
      });
  }

  // Parse a course code into department and number
  parseCourseCode(code) {
    // Handle greater than or equal with exclusions
    const gteMatch = code.match(/([A-Z]+)≥(\d+)(!MATH_PREREQS)?/);
    if (gteMatch) {
      return {
        type: 'gte',
        department: gteMatch[1],
        number: parseInt(gteMatch[2]),
        excludeMathPrereqs: !!gteMatch[3]
      };
    }

    // Standard course code
    const match = code.match(/([A-Z]+)(\d+)(\.?\d*)?/);
    if (!match) return null;
    
    return {
      type: 'exact',
      department: match[1],
      number: parseInt(match[2]),
      decimal: match[3] || ''
    };
  }

  // Check if a course satisfies a requirement
  courseMatchesRequirement(course, requirement) {
    const courseParsed = this.parseCourseCode(course);
    if (!courseParsed) return false;

    if (requirement.type === 'alternative') {
      return requirement.courses.some(reqCourse => 
        this.courseMatchesRequirement(course, { type: 'single', course: reqCourse }));
    }

    const reqCourse = requirement.course;
    if (reqCourse.type === 'gte') {
      if (reqCourse.excludeMathPrereqs && this.isMathPrereq(course)) {
        return false;
      }
      return courseParsed.department === reqCourse.department && 
             courseParsed.number >= reqCourse.number;
    }

    return courseParsed.department === reqCourse.department && 
           courseParsed.number === reqCourse.number;
  }

  // Check if a course is a math prerequisite
  isMathPrereq(course) {
    const mathPrereqs = this.parsePrereqList(
      this.programData.programs.MATH.types.major.prereqs.slice(2, -1)
    );
    return mathPrereqs.some(prereq => this.courseMatchesRequirement(course, prereq));
  }

  // Evaluate a list of courses against major requirements
  evaluateRequirements(majorCode, courses) {
    const major = this.programData.programs[majorCode];
    if (!major) return null;

    const requirements = this.parseRequirements(major.types.major.requirements);
    if (!requirements) return null;

    const progress = this.calculateProgress(requirements, courses);
    
    // Return the data structure expected by the UI
    return {
      hasMatchingCourses: courses.length > 0,
      prerequisites: {
        needed: requirements.prerequisites,
        completed: progress.prerequisites
          .filter(p => p.satisfied)
          .map(p => p.requirement),
        remaining: progress.prerequisites
          .filter(p => !p.satisfied)
          .map(p => p.requirement)
      },
      courseRanges: requirements.courseRanges,
      remainingRanges: progress.ranges
        .filter(r => r.remaining > 0)
        .map(r => {
          const rangeDescription = r.range.type === 'gte' 
            ? `≥${r.range.minimum}`
            : `[${r.range.start}-${r.range.end}]`;
          return {
            range: `${majorCode}${rangeDescription}`,
            required: r.remaining,
            description: `Need ${r.remaining} more from ${majorCode}${rangeDescription}`
          };
        }),
      specificRequirements: requirements.specificRequirements,
      culminatingExperience: requirements.culminatingExperience
    };
  }

  // Check if all requirements are satisfied
  checkRequirementsSatisfied(requirements, courses) {
    // Check prerequisites
    const prereqsSatisfied = requirements.prerequisites.every(prereq => {
      if (prereq.type === 'alternative') {
        return prereq.courses.some(course => 
          courses.some(c => this.courseMatchesRequirement(c, { type: 'single', course })));
      }
      return courses.some(c => this.courseMatchesRequirement(c, prereq));
    });

    // Check course ranges
    const rangesSatisfied = requirements.courseRanges.every(range => {
      const matchingCourses = courses.filter(course => {
        const parsed = this.parseCourseCode(course);
        if (range.type === 'gte') {
          return parsed.number >= range.minimum;
        }
        return parsed.number >= range.start && parsed.number <= range.end;
      });
      return matchingCourses.length >= range.count;
    });

    // Check specific requirements
    const specificsSatisfied = requirements.specificRequirements.every(req => {
      if (req.type === 'alternative') {
        return req.courses.some(course => 
          courses.some(c => this.courseMatchesRequirement(c, { type: 'single', course })));
      }
      return courses.some(c => this.courseMatchesRequirement(c, req));
    });

    return prereqsSatisfied && rangesSatisfied && specificsSatisfied;
  }

  // Calculate progress towards requirements
  calculateProgress(requirements, courses) {
    return {
      prerequisites: requirements.prerequisites.map(prereq => ({
        requirement: prereq,
        satisfied: prereq.type === 'alternative'
          ? prereq.courses.some(course => 
              courses.some(c => this.courseMatchesRequirement(c, { type: 'single', course })))
          : courses.some(c => this.courseMatchesRequirement(c, prereq))
      })),
      ranges: requirements.courseRanges.map(range => {
        const matchingCourses = courses.filter(course => {
          const parsed = this.parseCourseCode(course);
          if (range.type === 'gte') {
            return parsed.number >= range.minimum;
          }
          return parsed.number >= range.start && parsed.number <= range.end;
        });
        return {
          range,
          completed: matchingCourses.length,
          remaining: Math.max(0, range.count - matchingCourses.length)
        };
      }),
      specific: requirements.specificRequirements.map(req => ({
        requirement: req,
        satisfied: req.type === 'alternative'
          ? req.courses.some(course => 
              courses.some(c => this.courseMatchesRequirement(c, { type: 'single', course })))
          : courses.some(c => this.courseMatchesRequirement(c, req))
      }))
    };
  }
}

export default RequirementsParser;