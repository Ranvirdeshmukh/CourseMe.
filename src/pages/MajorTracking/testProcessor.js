const fs = require('fs');
const readline = require('readline');

class RequirementsParser {
    constructor(jsonData) {
        this.programs = jsonData.programs;
        this.coursesTaken = new Map();
        this.pillars = new Map();
        this.generalOverflow = [];
    }

    parseRequirements(major) {
        const requirements = this.programs[major].types.major.requirements;
        const pillars = requirements.split('&').map(p => p.trim());
        
        // Initialize pillars map
        pillars.forEach(pillar => {
            const pillarInfo = this.analyzePillar(pillar);
            if (pillarInfo) {
                this.pillars.set(pillarInfo.name, {
                    type: pillarInfo.type,
                    count: pillarInfo.count,
                    courses: [],
                    overflow: [],
                    range: pillarInfo.range,
                    alternatives: pillarInfo.alternatives,
                    groups: pillarInfo.groups
                });
            }
        });

        this.sortPillarsBySpecificity();
        
        // Print the formed pillars
        console.log('\nParsed Pillars:');
        console.log('===============');
        for (const [name, pillar] of this.pillars) {
            console.log(`\nPillar: ${name}`);
            console.log(`Type: ${pillar.type}`);
            console.log(`Required Count: ${pillar.count}`);
            
            if (pillar.range) {
                console.log(`Range: ${pillar.range.start}-${pillar.range.end}`);
            }
            
            if (pillar.alternatives) {
                console.log(`Alternatives: ${pillar.alternatives.join(' | ')}`);
            }
            
            if (pillar.groups) {
                console.log('Prerequisite Groups:');
                pillar.groups.forEach((group, index) => {
                    console.log(`  Group ${index + 1} (${group.type}):`);
                    console.log(`    Courses: ${group.courses.join(' | ')}`);
                });
            }
        }
        console.log('\n' + '='.repeat(40) + '\n');
    }

    analyzePillar(pillar) {
        // Remove parentheses
        pillar = pillar.replace(/[()]/g, '').trim();
        console.log(`\nDebug: Analyzing pillar: ${pillar}`);
        
        // Prerequisites
        if (pillar.startsWith('@')) {
            console.log('Debug: Processing prerequisite pillar');
            // Parse groups of prerequisites
            const groups = [];
            let prereqStr = pillar.replace('@[', '').replace(']', '');
            
            // Split by comma to get separate requirement groups
            const reqGroups = prereqStr.split(',').map(g => g.trim());
            console.log('Debug: Prerequisite groups:', reqGroups);
            
            reqGroups.forEach((group, index) => {
                console.log(`Debug: Processing group ${index + 1}:`, group);
                if (group.includes('{')) {
                    // This is an OR group
                    const alternatives = group.match(/{([^}]+)}/)[1]
                        .split('|')
                        .map(alt => alt.trim());
                    console.log('Debug: OR group alternatives:', alternatives);
                    groups.push({
                        type: 'or',
                        courses: alternatives
                    });
                } else {
                    // This is a required course
                    console.log('Debug: Required course:', group);
                    groups.push({
                        type: 'required',
                        courses: [group]
                    });
                }
            });
            
            return {
                name: 'Prerequisites',
                type: 'prereq',
                count: groups.length,
                groups: groups,
                alternatives: null
            };
        }
        
        // Specific course requirements
        if (pillar.includes('{') && pillar.includes('}')) {
            console.log('Debug: Processing specific course requirement');
            const countMatch = pillar.match(/#(\d+)/);
            const count = countMatch ? parseInt(countMatch[1]) : 1;
            const alternativesStr = pillar.match(/{([^}]+)}/)[1];
            
            // Split alternatives and clean them
            const alternatives = alternativesStr.split('|').map(alt => alt.trim());
            console.log('Debug: Specific alternatives before processing:', alternatives);
            
            // Add department prefix to numbers-only alternatives
            const processedAlternatives = alternatives.map(alt => {
                if (alt.match(/^\d+$/)) {
                    let lastDept = alternatives.find(a => a.match(/[A-Z]+/))?.match(/([A-Z]+)/)[1];
                    console.log(`Debug: Adding department ${lastDept} to number ${alt}`);
                    if (lastDept) return lastDept + alt;
                }
                return alt;
            });
            
            console.log('Debug: Processed alternatives:', processedAlternatives);
            return {
                name: 'Specific',
                type: 'specific',
                count: count,
                range: null,
                alternatives: processedAlternatives,
                hasRangeOption: alternatives.some(alt => alt.startsWith('[') && alt.endsWith(']'))
            };
        }
        
        // Course count requirements with range
        const countMatch = pillar.match(/#(\d+)/);
        if (countMatch) {
            console.log('Debug: Processing range requirement');
            const count = parseInt(countMatch[1]);
            const rangeMatch = pillar.match(/\[([^\]]+)\]/);
            if (rangeMatch) {
                const range = this.parseRange(rangeMatch[1]);
                console.log('Debug: Parsed range:', range);
                if (range) {
                    return {
                        name: `${range.start}-${range.end}`,
                        type: 'range',
                        count: count,
                        range: range,
                        alternatives: null
                    };
                }
            }
        }

        console.log('Debug: No matching pillar type found');
        return null;
    }

    parseRange(rangeStr) {
        console.log('Debug: Parsing range string:', rangeStr);
        if (rangeStr.includes('-')) {
            const [start, end] = rangeStr.split('-').map(n => parseInt(n));
            console.log('Debug: Extracted range values:', start, end);
            if (!isNaN(start) && !isNaN(end)) {
                return { start, end };
            }
        }
        return null;
    }

    courseMatchesPillar(dept, num, pillar) {
        // Pad the number with leading zeros to ensure 3 digits
        const paddedNum = num.toString().padStart(3, '0');
        const courseStr = dept + paddedNum;
        console.log(`\nDebug: Checking ${courseStr} against pillar type: ${pillar.type}`);

        if (pillar.type === 'range') {
            const matches = num >= pillar.range.start && num <= pillar.range.end;
            console.log(`Debug: Range check ${pillar.range.start}-${pillar.range.end}: ${matches}`);
            return matches;
        }
        
        if (pillar.type === 'specific') {
            console.log('Debug: Checking specific alternatives:', pillar.alternatives);
            return pillar.alternatives.some(alt => {
                alt = alt.trim();
                if (alt.includes('≥')) {
                    // Handle MATH≥020 case
                    const [altDept, minNum] = alt.split('≥');
                    const matches = dept === altDept && num >= parseInt(minNum);
                    console.log(`Debug: Checking ${dept}≥${minNum}: ${matches}`);
                    return matches;
                }
                if (alt.startsWith('[') && alt.endsWith(']')) {
                    // Handle [030-089] case
                    const rangeStr = alt.slice(1, -1);
                    const [start, end] = rangeStr.split('-').map(n => parseInt(n));
                    const matches = num >= start && num <= end;
                    console.log(`Debug: Checking bracketed range ${start}-${end}: ${matches}`);
                    return matches;
                }
                // Regular course case (like 094)
                const matches = numStr === alt || courseStr === dept + alt;
                console.log(`Debug: Checking exact match against ${alt} or ${dept + alt}: ${matches}`);
                return matches;
            });
        }
        
        if (pillar.type === 'prereq') {
            if (!pillar.groups) {
                console.log('Debug: No prerequisite groups defined');
                return false;
            }
            
            console.log('Debug: Checking prerequisite groups:');
            // Check if course matches any of the prerequisite groups
            return pillar.groups.some((group, index) => {
                console.log(`Debug: Group ${index + 1} (${group.type}):`, group.courses);
                if (group.type === 'or') {
                    // For OR groups, match any of the alternatives
                    const matches = group.courses.some(course => {
                        const doesMatch = course === courseStr;
                        console.log(`Debug: Checking OR match ${course}: ${doesMatch}`);
                        return doesMatch;
                    });
                    return matches;
                } else {
                    // For required courses, match exactly
                    const matches = group.courses[0] === courseStr;
                    console.log(`Debug: Checking required match ${group.courses[0]}: ${matches}`);
                    return matches;
                }
            });
        }
        
        console.log('Debug: No matching pillar type found');
        return false;
    }

    addCourse(course) {
        console.log(`\nProcessing course: ${course}`);
        const match = course.match(/([A-Z]+)(\d+)/);
        if (!match) {
            console.log('Debug: Invalid course format');
            return false;
        }

        const dept = match[1];
        // Keep the original string representation of the number to preserve leading zeros
        const numStr = match[2];
        const num = parseInt(numStr);
        console.log(`Debug: Original number string: ${numStr}, Parsed number: ${num}`);
        console.log(`Debug: Parsed as department: ${dept}, number: ${num}`);
        let canFitSomewhere = false;
        let wasAssigned = false;

        // Check prerequisites first
        const prereqPillar = Array.from(this.pillars.values())
            .find(p => p.type === 'prereq');
        
        if (prereqPillar) {
            console.log('Debug: Checking prerequisites pillar first');
            const matches = this.courseMatchesPillar(dept, num, prereqPillar);
            console.log(`Debug: Prerequisite match result: ${matches}`);
            if (matches) {
                if (prereqPillar.courses.length < prereqPillar.count) {
                    prereqPillar.courses.push(course);
                    console.log(`Course ${course} assigned to Prerequisites`);
                    return true;
                } else {
                    console.log('Debug: Prerequisites pillar is full');
                }
            }
        }

        // Then check other pillars
        for (const [name, pillar] of this.pillars) {
            if (pillar.type === 'prereq') continue; // Skip prereqs as we handled them
            
            console.log(`\nDebug: Checking pillar: ${name}`);
            if (this.courseMatchesPillar(dept, num, pillar)) {
                canFitSomewhere = true;
                if (pillar.courses.length < pillar.count) {
                    pillar.courses.push(course);
                    wasAssigned = true;
                    console.log(`Course ${course} assigned to pillar ${name}`);
                    break;
                } else {
                    console.log(`Debug: Pillar ${name} is full`);
                }
            }
        }

        if (!canFitSomewhere) {
            this.generalOverflow.push(course);
            console.log(`Course ${course} added to general overflow (doesn't match any pillar requirements)`);
            return false;
        }

        if (!wasAssigned) {
            this.generalOverflow.push(course);
            console.log(`Course ${course} added to general overflow (all matching pillars full)`);
        }

        return wasAssigned;
    }

    sortPillarsBySpecificity() {
        const pillarArray = Array.from(this.pillars.entries());
        
        pillarArray.sort((a, b) => {
            const [aName, aPillar] = a;
            const [bName, bPillar] = b;
            
            // First priority: type order
            const typeOrder = { 'prereq': 1, 'range': 2, 'specific': 3 };
            const aTypeOrder = typeOrder[aPillar.type] || 999;
            const bTypeOrder = typeOrder[bPillar.type] || 999;
            
            if (aTypeOrder !== bTypeOrder) {
                return aTypeOrder - bTypeOrder;
            }
            
            // For range types, sort by range size
            if (aPillar.type === 'range' && bPillar.type === 'range') {
                const aSize = aPillar.range.end - aPillar.range.start;
                const bSize = bPillar.range.end - bPillar.range.start;
                return aSize - bSize;
            }
            
            // Move specific types with range options to the end
            if (aPillar.type === 'specific' && bPillar.type === 'specific') {
                if (aPillar.hasRangeOption !== bPillar.hasRangeOption) {
                    return aPillar.hasRangeOption ? 1 : -1;
                }
            }
            
            return 0;
        });

        this.pillars.clear();
        pillarArray.forEach(([key, value]) => {
            this.pillars.set(key, value);
        });
        
        // Debug the sort order
        console.log('\nDebug: Sorted Pillar Order:');
        pillarArray.forEach(([name, pillar], index) => {
            console.log(`${index + 1}. ${name} (${pillar.type}${pillar.hasRangeOption ? ', has range' : ''})`);
        });
    }

    printStatus() {
        console.log('\nCurrent Requirements Status:');
        console.log('===========================');
        
        for (const [name, pillar] of this.pillars) {
            console.log(`\n${name} Pillar (${pillar.courses.length}/${pillar.count}):`);
            if (pillar.courses.length > 0) {
                console.log(`Fulfilled: ${pillar.courses.join(', ')}`);
            } else {
                console.log('Fulfilled: None');
            }
        }

        console.log('\nGeneral Overflow:');
        if (this.generalOverflow.length > 0) {
            console.log(this.generalOverflow.join(', '));
        } else {
            console.log('None');
        }
    }
}

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Main execution
const jsonData = JSON.parse(fs.readFileSync('majors.json', 'utf8'));
const parser = new RequirementsParser(jsonData);

// Initialize with CS major
parser.parseRequirements('CS');

// Function to prompt for course input
function promptForCourse() {
    rl.question('\nEnter a course (e.g., COSC010) or "quit" to exit: ', (course) => {
        if (course.toLowerCase() === 'quit') {
            rl.close();
            return;
        }

        parser.addCourse(course);
        parser.printStatus();
        promptForCourse();
    });
}

console.log('Major Requirements Parser');
console.log('========================');
promptForCourse();