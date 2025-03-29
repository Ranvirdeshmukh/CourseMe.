/**
 * Professor Matching Algorithm
 * This file contains functions to match professors to user majors,
 * handle department code mappings, and optimize professor filtering.
 * code used in professordirectory.jdsx
 */

// More comprehensive mapping from majors to department codes
const majorToDepartmentMap = {
  'Computer Science': 'COSC',
  'Economics': 'ECON',
  'Mathematics': 'MATH',
  'Geography': 'GEOG',
  'Engineering': 'ENGS',
  'Government': 'GOVT',
  'Psychological and Brain Sciences': 'PSYC',
  'Environmental Studies': 'ENVS',
  'Biology': 'BIOL',
  'Chemistry': 'CHEM',
  'Physics': 'PHYS',
  'English': 'ENGL',
  'History': 'HIST',
  'Philosophy': 'PHIL',
  'Sociology': 'SOCY',
  'Anthropology': 'ANTH',
  'Art History': 'ARTH',
  'Classics': 'CLST',
  'Earth Sciences': 'EARS',
  'Religion': 'REL',
  'Film and Media Studies': 'FILM',
  'French': 'FREN',
  'German Studies': 'GERM',
  'Italian Studies': 'ITAL',
  'Japanese': 'JAPN',
  'Spanish': 'SPAN',
  'Music': 'MUS',
  'Theater': 'THEA',
  'Women\'s, Gender, and Sexuality Studies': 'WGSS'
};

/**
 * Converts a major to its corresponding department code
 * @param {string} major - The user's major
 * @returns {string|null} The department code or null if no mapping found
 */
const getMajorDepartmentCode = (major) => {
  if (!major) return null;
  
  // Try direct mapping first
  if (majorToDepartmentMap[major]) {
    return majorToDepartmentMap[major];
  }
  
  // Better fallback strategy:
  // 1. Try to match any part of the major with known department codes
  const majorWords = major.toLowerCase().split(/\s+/);
  for (const word of majorWords) {
    // Check if any word in the major matches the start of a department code
    for (const [knownMajor, deptCode] of Object.entries(majorToDepartmentMap)) {
      if (knownMajor.toLowerCase().includes(word) && word.length > 2) {
        return deptCode;
      }
    }
  }
  
  // 2. If still no match, try to extract first 4 characters and uppercase
  const deptCode = major.substring(0, 4).toUpperCase();
  return deptCode;
};

/**
 * Applies sorting to professor data based on selected sort option
 * @param {Array} data - Array of professor data
 * @param {Object} selectedSort - Sort option from SORT_OPTIONS
 * @returns {Array} Sorted array of professor data
 */
const applySorting = (data, selectedSort) => {
  // Clone the array to avoid modifying the original
  const sortedData = [...data];
  
  if (!selectedSort) return sortedData;
  
  // Handle random sorting - check if it's the RANDOM option (field is null)
  if (selectedSort.field === null) {
    return sortedData.sort(() => Math.random() - 0.5);
  }
  
  // Sort by review count (most reviews first)
  if (selectedSort.field === 'review_count') {
    return sortedData.sort((a, b) => {
      const countA = a.overall_metrics?.review_count || 0;
      const countB = b.overall_metrics?.review_count || 0;
      return countB - countA;
    });
  }
  
  // Sort by difficulty (easiest first)
  if (selectedSort.field === 'difficulty_score') {
    return sortedData.sort((a, b) => {
      const scoreA = a.overall_metrics?.difficulty_score || 0;
      const scoreB = b.overall_metrics?.difficulty_score || 0;
      return scoreA - scoreB; // Lower difficulty first (easier classes)
    });
  }
  
  // Sort by quality or sentiment (highest first)
  return sortedData.sort((a, b) => {
    const scoreA = a.overall_metrics?.[selectedSort.field] || 0;
    const scoreB = b.overall_metrics?.[selectedSort.field] || 0;
    return scoreB - scoreA;
  });
};

/**
 * Filters professors by minimum review threshold
 * @param {Array} professors - Array of professor data
 * @param {number} reviewThreshold - Minimum number of reviews required
 * @returns {Array} Filtered array of professor data
 */
const filterByMinReviews = (professors, reviewThreshold) => {
  return professors.filter(prof => 
    (prof.overall_metrics?.review_count || 0) >= reviewThreshold
  );
};

/**
 * Checks if a professor array contains any professors from a specific department
 * @param {Array} professors - Array of professor data
 * @param {string} departmentCode - The department code to check
 * @returns {boolean} True if at least one professor is from the department
 */
const hasProfessorsFromDepartment = (professors, departmentCode) => {
  if (!professors || !departmentCode) return false;
  
  return professors.some(prof => 
    prof.departments && prof.departments[departmentCode]
  );
};

export {
  getMajorDepartmentCode,
  applySorting,
  filterByMinReviews,
  hasProfessorsFromDepartment,
  majorToDepartmentMap
}