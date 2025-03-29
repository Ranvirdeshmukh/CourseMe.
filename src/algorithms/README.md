# Algorithms Directory

This directory contains reusable algorithm modules for various features in the application.

## Professor Matching Algorithm

The `professorMatching.js` module provides functions for:

1. **Major to Department Code Mapping**: Converting a user's major to the corresponding department code
2. **Professor Sorting**: Sorting professors by different criteria (quality, difficulty, review count, etc.)
3. **Professor Filtering**: Filtering professors based on minimum review thresholds
4. **Department Validation**: Checking if professors belong to a specific department

### Usage

```javascript
import { 
  getMajorDepartmentCode, 
  applySorting, 
  filterByMinReviews,
  hasProfessorsFromDepartment,
  majorToDepartmentMap 
} from '../algorithms/professorMatching';

// Convert a major to department code
const deptCode = getMajorDepartmentCode('Computer Science'); // Returns 'COSC'

// Sort professors by a criteria
const sortedProfessors = applySorting(professorData, SORT_OPTIONS.QUALITY);

// Filter professors by minimum review count
const filteredProfessors = filterByMinReviews(professorData, 10);

// Check if any professors are from a specific department
const hasCSProfessors = hasProfessorsFromDepartment(professorData, 'COSC');
```

### Extending

To add additional major-to-department mappings, update the `majorToDepartmentMap` object in `professorMatching.js`. 