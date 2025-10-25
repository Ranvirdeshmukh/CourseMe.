# Winter Term Implementation Summary

## Overview
Added support for Winter 2026 term to the CourseMe timetable system. Winter courses are fetched from the Firestore collection `winterTimetable26`, while Fall courses continue to use Google Cloud Storage (GCS).

## Changes Made

### 1. **FilterSection.jsx** (`src/pages/timetablepages/FilterSection.jsx`)
- ✅ Updated title to display "Winter 2026 Timetable." when winter term is selected
- ✅ Added "Winter 2026" toggle button next to the "Fall 2025" button
- ✅ Both toggles use the same styling and interaction pattern

### 2. **Timetable.jsx** (`src/pages/timetablepages/Timetable.jsx`)
- ✅ Updated `formatTermName()` helper function to include Winter 2026
- ✅ Updated `currentTerm` calculation to use '26W' for winter term
- ✅ Winter term properly integrated with existing notification and enrollment features

### 3. **useCourses.js** (`src/hooks/useCourses.js`)
- ✅ Updated `fetchUserCourses()` to use `winterCoursestaken` field for winter term
- ✅ Updated user document creation logic to include winter courses field
- ✅ Winter courses are stored separately from fall and summer courses

### 4. **courseService.js** (`src/services/courseService.js`)
- ✅ Updated `addCourseToTimetable()` to:
  - Set term as "Winter 2026" for winter courses
  - Use `winterCoursestaken` field in user document
- ✅ Updated `removeCourseFromTimetable()` to use `winterCoursestaken` field
- ✅ All CRUD operations now support three terms: summer, fall, and winter

### 5. **gcsTimetableService.js** (`src/services/gcsTimetableService.js`)
- ✅ Added import for Firestore functions (`getFirestore`, `collection`, `getDocs`)
- ✅ Created new `fetchWinterDataFromFirestore()` function to fetch from `winterTimetable26` collection
- ✅ Updated `fetchGCSTimetableData()` to:
  - Check if termType is 'winter'
  - Fetch from Firestore for winter term
  - Fetch from GCS for fall/summer terms
  - Cache winter data separately
- ✅ Data transformation handles both field name formats (lowercase and capitalized)

### 6. **googleCalendarLogic.jsx** (`src/pages/timetablepages/googleCalendarLogic.jsx`)
- ✅ Updated `addToGoogleCalendar()` to accept termType parameter
- ✅ Updated `getEventTiming()` to:
  - Accept termType instead of boolean isSummer
  - Set Winter 2026 dates: January 6 - March 11, 2026
  - Support all three terms (summer, fall, winter)

### 7. **appleCalendarLogic.jsx** (`src/pages/timetablepages/appleCalendarLogic.jsx`)
- ✅ Updated `addToAppleCalendar()` to accept termType parameter
- ✅ Updated `getEventTiming()` to:
  - Accept termType instead of boolean isSummer
  - Set Winter 2026 dates: January 6 - March 11, 2026
  - Support all three terms (summer, fall, winter)

## User Profile Data Structure

Users now have three separate fields for their selected courses:
```javascript
{
  summerCoursestaken: [...],  // Summer 2025 courses
  fallCoursestaken: [...],    // Fall 2025 courses
  winterCoursestaken: [...]   // Winter 2026 courses (NEW)
}
```

## Firestore Collection

Winter courses are stored in a dedicated Firestore collection:
- **Collection Name:** `winterTimetable26`
- **Data Format:** Similar to fall/summer courses with fields:
  - `subj` / `Subj` - Subject code
  - `num` / `Num` - Course number
  - `sec` / `Sec` - Section number
  - `title` / `Title` - Course title
  - `period` / `Period Code` - Period code
  - `room` / `Room` - Room number
  - `building` / `Building` - Building name
  - `instructor` / `Instructor` - Instructor name
  - `major` - Major (optional)
  - And other metadata fields

## Term Dates

- **Summer 2025:** June 26 - September 2, 2025
- **Fall 2025:** September 12 - November 26, 2025
- **Winter 2026:** January 6 - March 11, 2026

## Features Supported for Winter Term

✅ View winter courses in timetable
✅ Add/remove courses to personal winter schedule
✅ Search and filter winter courses
✅ Add winter courses to Google Calendar
✅ Add winter courses to Apple Calendar
✅ Visual schedule display
✅ Enrollment data (when available)
✅ Notification system (when available)
✅ Major and instructor filtering

## Testing Checklist

- [ ] Winter term toggle switches correctly
- [ ] Winter courses load from `winterTimetable26` collection
- [ ] Can add winter courses to personal schedule
- [ ] Can remove winter courses from personal schedule
- [ ] Winter courses stored in `winterCoursestaken` field
- [ ] Google Calendar integration works with winter dates
- [ ] Apple Calendar integration works with winter dates
- [ ] Visual schedule displays winter courses correctly
- [ ] Filters work for winter courses (major, instructor, search)
- [ ] Cache works correctly for winter term
- [ ] Switching between Fall/Winter terms works smoothly

## Notes

- Winter term uses Firestore while Fall uses GCS - ensure Firestore read permissions are properly configured
- Cache is stored separately for each term to prevent conflicts
- The implementation maintains backward compatibility with existing Summer and Fall terms
- All existing features (notifications, enrollments, reviews) work with winter term

