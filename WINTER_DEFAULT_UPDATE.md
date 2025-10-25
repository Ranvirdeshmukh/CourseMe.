# Winter 2026 - Default Term Update

## Summary
Updated the entire application to default to **Winter 2026** term instead of Fall 2025.

## Changes Made

### 1. **Default Term Changed to Winter**
All components and services now default to `'winter'` instead of `'fall'` or `'summer'`:

#### Files Updated:
1. ✅ **Timetable.jsx** - Line 138
   ```javascript
   const [termType, setTermType] = useState('winter'); // Default to 'winter'
   ```

2. ✅ **useCourses.js** - Line 65
   ```javascript
   const useCourses = (termType = 'winter') => {
   ```

3. ✅ **courseService.js** - Multiple functions
   ```javascript
   fetchFirestoreCourses(db, termType = 'winter')
   refreshEnrollmentData(db, termType = 'winter')
   addCourseToTimetable(db, currentUser, course, termType = 'winter')
   removeCourseFromTimetable(db, currentUser, course, termType = 'winter')
   ```

4. ✅ **gcsTimetableService.js** - Multiple functions
   ```javascript
   fetchGCSTimetableData(termType = 'winter')
   clearGCSCache(termType = 'winter')
   ```

5. ✅ **googleCalendarLogic.jsx**
   ```javascript
   addToGoogleCalendar(course, onMultipleEvents, onPopupBlocked, setTimeout, termType = 'winter')
   ```

6. ✅ **appleCalendarLogic.jsx**
   ```javascript
   addToAppleCalendar(course, termType = 'winter')
   ```

### 2. **Winter Enrollment Refresh Disabled**
Added protection to prevent enrollment data refresh for winter courses (since it's not yet available):

```javascript
if (termType === 'winter') {
  setPopupMessage({
    message: "Enrollment data refresh is not yet available for winter courses",
    type: 'info',
  });
  setOpenPopupMessage(true);
  return;
}
```

### 3. **User Profile Structure**
When users add winter courses, they are saved to:
```javascript
users/{userId}/winterCoursestaken: [
  {
    subj: "COSC",
    num: "1",
    sec: "01",
    title: "Introduction to Programming",
    period: "10",
    timing: "MWF 10:10-11:15, Th 12:15-1:05",
    building: "Sudikoff",
    room: "115",
    instructor: "Prof. Smith",
    addedAt: "2026-01-06T...",
    term: "Winter 2026",
    id: "COSC_1_01_1234567890"
  }
]
```

### 4. **Calendar Integration Dates**
Winter courses are added to calendars with correct dates:
- **Start Date:** January 6, 2026
- **End Date:** March 23, 2026 (updated from March 11)

## What This Means for Users

### On Page Load:
1. ✅ Timetable automatically shows **Winter 2026** courses
2. ✅ Winter toggle button is pre-selected
3. ✅ Courses are fetched from `winterTimetable26` Firestore collection
4. ✅ User's saved winter courses load automatically

### When Adding Courses:
1. ✅ Courses save to `winterCoursestaken` field
2. ✅ Marked with "Winter 2026" term
3. ✅ Separate from Fall and Summer courses

### When Using Calendar:
1. ✅ Google Calendar events use Winter 2026 dates
2. ✅ Apple Calendar events use Winter 2026 dates
3. ✅ All recurring events end on March 23, 2026

## Switching Between Terms
Users can still switch to other terms by clicking:
- "Fall 2025" button → Shows fall courses from GCS
- "Winter 2026" button → Shows winter courses from Firestore

Each term maintains its own:
- Course list
- User selections
- Cache
- Calendar dates

## Firestore Security Rules Required
Make sure you have this rule in your Firestore:
```javascript
match /winterTimetable26/{document} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

## Testing Checklist
- [x] Page loads with Winter 2026 by default
- [x] Winter courses display correctly
- [x] Can add winter courses to personal schedule
- [x] Courses save to `winterCoursestaken` field
- [x] Can remove winter courses
- [x] Google Calendar integration works
- [x] Apple Calendar integration works with March 23 end date
- [x] Can switch to Fall/Summer and back to Winter
- [x] Each term maintains separate course lists
- [x] Enrollment refresh blocked for winter (as expected)

## Future Updates
When winter enrollment data becomes available, remove the block in `handleForceRefreshEnrollments` function.

