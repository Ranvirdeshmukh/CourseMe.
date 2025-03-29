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

### Extending
1. Department Code Mapping
Very Efficient: The majorToDepartmentMap object provides O(1) lookups for direct mappings.
Well-Structured: Comprehensive coverage of majors with a clean, maintainable organization.
2. Major to Department Code Function
Optimized Multi-Stage Approach: The getMajorDepartmentCode function uses a cascade of increasingly flexible matching strategies:
Direct lookup (fastest path) - O(1)
Word matching for partial matches - O(nm) where n is the number of words in the major and m is the number of known majors
Final fallback to first 4 letters (guarantees a result) - O(1)
Robustness: Handles edge cases well (null inputs, no matches found)
3. Sorting Implementation
Efficient Clone: The applySorting function clones the array first to avoid side effects - this is good practice.
Optimized Conditionals: Uses early returns to avoid unnecessary processing.
Performance: Standard JavaScript sort with custom comparators - O(n log n) time complexity.
Null-Safe: Properly handles missing metrics with fallback to zero.
4. Filtering Functions
Simple and Fast: The filterByMinReviews function uses a single O(n) filter operation.
Defensive Coding: The optional chaining (?.) handles potential undefined properties gracefully.
5. Department Validation
Short-Circuit Evaluation: The hasProfessorsFromDepartment function quickly returns false for invalid inputs.
Efficient: Uses Array.some() which stops iteration as soon as a match is found - O(n) in worst case, often much better.
6. UI Helper Functions
Caching Opportunity: Both getAllDepartmentOptions and getPopularDepartments return the same results every time, making them good candidates for memoization.
Sort Once: The sorting of departments is only done once per component mount.
Overall Quality Assessment
Code Organization: Excellent separation of concerns - all professor matching logic is encapsulated in a dedicated module.
Function Design: Each function has a single responsibility and follows the principle of least surprise.
Documentation: Good JSDoc comments for all functions explaining purpose, parameters, and return values.
Error Handling: Functions degrade gracefully when faced with unexpected inputs.
Maintainability: The code is easy to extend (e.g., adding more departments or customizing matching logic).
Performance: The algorithms are optimized for the expected use case - finding departments for a small number of majors from a moderately sized list of departments.
Optimization Opportunities
While the algorithm is already quite efficient, here are a few suggestions for further optimization if needed:
Memoization: For getMajorDepartmentCode, results could be cached to avoid repeated computation for the same major.
Precomputed Department Lists: The getAllDepartmentOptions and getPopularDepartments functions could be wrapped in useMemo in the component or made into proper memoized functions.
Lazy Loading: If the department list gets very large, consider implementing pagination or virtualization for the department selection UI.
Fuzzy Matching Upgrade: If needed, the word matching algorithm could be enhanced with a more sophisticated fuzzy matching library for better partial matches.
Parallelization: For very large professor datasets, the filtering and sorting could be offloaded to Web Workers to avoid blocking the main thread.
Summary
The algorithm is well-designed, efficient, and follows best practices. The modular structure makes it maintainable and the code is clean with good documentation.
Most importantly, the algorithm does what it needs to do - match users' majors to department codes and provide an efficient way to sort, filter, and display professors - in a way that's both performant and maintainable.
You're definitely ready to move forward with this implementation. It's robust enough to handle the current requirements and flexible enough to evolve as needed.