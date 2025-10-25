# Winter Course "Add" Button Debug Guide

## Issue
Winter courses are not being added to user's timetable when clicking the "Add" button, but Fall courses work fine.

## Debugging Added

I've added comprehensive console logging to help identify the issue. Check your browser console for these logs:

### 1. **Winter Data Fetching Logs**
When winter courses load, you should see:
```
Fetching winter data from Firestore collection: winterTimetable26
Winter course 0 transformed: { subj: "...", num: "...", sec: "...", ... }
Winter course 1 transformed: { subj: "...", num: "...", sec: "...", ... }
Winter course 2 transformed: { subj: "...", num: "...", sec: "...", ... }
Fetched X winter courses from Firestore
First winter course sample: { ... }
```

**Check for:**
- Are courses being fetched? (If not, check Firestore permissions)
- Do courses have `subj`, `num`, and `sec` fields populated?
- Are they empty strings or actual values?

### 2. **Add Course Logs**
When you click "Add" on a winter course, you should see:
```
addCourseToTimetable called with: { course: {...}, termType: "winter", userId: "..." }
Course validation passed, courseToAdd: { ... }
Adding to field: winterCoursestaken, current courses: X
Updating user document with data: { winterCoursestaken: [...] }
User document updated successfully
Course added successfully: { ... }
```

**Check for:**
- Is the function being called at all?
- Does the course have all required fields (subj, num, sec)?
- Which field is it trying to update? (should be "winterCoursestaken")
- Does the Firestore update succeed?

### 3. **Common Issues and Solutions**

#### Issue 1: Missing Required Fields
**Symptom:**
```
Missing required fields: { subj: "", num: "", sec: "" }
```

**Solution:**
Your Firestore `winterTimetable26` documents need proper field names. Check:
- Field names should be one of: `subj`, `Subj`, `subject`, or `Subject`
- Field names should be one of: `num`, `Num`, `number`, or `Number`
- Field names should be one of: `sec`, `Sec`, `section`, or `Section`

**Fix in Firestore:**
Go to Firebase Console → Firestore → winterTimetable26 collection
Make sure each document has these fields with actual values (not empty strings).

Example document structure:
```json
{
  "subj": "COSC",
  "num": "1",
  "sec": "01",
  "title": "Introduction to Programming",
  "period": "10",
  "instructor": "Prof. Smith",
  "building": "Sudikoff",
  "room": "115"
}
```

#### Issue 2: Firestore Permission Denied
**Symptom:**
```
Error fetching winter data from Firestore: [FirebaseError: Missing or insufficient permissions]
```

**Solution:**
Add this rule to your Firestore Security Rules:
```javascript
match /winterTimetable26/{document} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

#### Issue 3: Courses Not Appearing in "My Courses"
**Symptom:**
- Add button seems to work (success message)
- But courses don't appear in "My Courses"

**Check:**
1. Open Firebase Console → Firestore
2. Navigate to: `users/{your-uid}/`
3. Look for `winterCoursestaken` field
4. Should be an array with your added courses

If the field is there but UI doesn't update:
- Try refreshing the page
- Check if `fetchUserCourses` is being called after adding

#### Issue 4: Wrong Field Being Updated
**Symptom:**
```
Adding to field: fallCoursestaken, current courses: X
```
(When termType should be "winter")

**Check:**
- Verify the page is showing "Winter 2026" in the title
- Check the toggle button - Winter should be highlighted
- Look at the browser URL - might have old state

#### Issue 5: Empty String Values
**Symptom:**
Course has fields but they're empty strings:
```
Winter course 0 transformed: { subj: "", num: "", sec: "", ... }
```

**Solution:**
Your Firestore documents have the fields but values are empty. Update them:
```javascript
// Example: Update a document in winterTimetable26
{
  "Subj": "COSC",    // NOT ""
  "Num": "1",        // NOT ""
  "Sec": "01"        // NOT ""
}
```

## Step-by-Step Debugging

### Step 1: Check Winter Data Loads
1. Open browser console (F12)
2. Navigate to Winter 2026 timetable
3. Look for: `Fetched X winter courses from Firestore`
4. If you see 0 courses → Firestore collection is empty
5. If you see error → Check permissions

### Step 2: Inspect First Course
Look at the log: `First winter course sample: { ... }`

Verify it has:
```javascript
{
  subj: "COSC",      // ✅ NOT empty
  num: "1",          // ✅ NOT empty
  sec: "01",         // ✅ NOT empty
  title: "...",
  period: "10",
  // ... etc
}
```

### Step 3: Try Adding a Course
1. Click "Add" button on any winter course
2. Watch console for logs
3. Should see the sequence described in "Add Course Logs" above

### Step 4: Check Firestore
1. Go to Firebase Console
2. Navigate to: Firestore → users → {your-user-id}
3. Look for `winterCoursestaken` field
4. Should be an array with your course

### Step 5: Verify in UI
1. Click "My Courses" button
2. Should show your added winter courses
3. If not, refresh page and check again

## What I Fixed

1. **Enhanced Field Name Fallbacks**
   - Now checks: `subj`, `Subj`, `subject`, `Subject`
   - Now checks: `num`, `Num`, `number`, `Number`
   - Now checks: `sec`, `Sec`, `section`, `Section`

2. **Fixed documentName Generation**
   - Creates consistent format: `${subj}${num}_${sec}`
   - Falls back to Firestore doc.id if fields missing

3. **Added Comprehensive Logging**
   - Logs at every step of the process
   - Shows exactly what data is being used
   - Identifies where failures occur

4. **Better Error Messages**
   - Shows which required fields are missing
   - Logs the actual field values (or lack thereof)

## Quick Fix Checklist

✅ Firestore collection `winterTimetable26` exists
✅ Collection has documents
✅ Documents have required fields: `subj`, `num`, `sec`
✅ Field values are NOT empty strings
✅ Firestore security rules allow read
✅ User is logged in
✅ Winter 2026 term is selected
✅ Browser console shows no errors

## Next Steps

1. Clear your browser cache
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. Open browser console
4. Try adding a winter course
5. Copy ALL console logs
6. Share them if issue persists

The detailed logs will show exactly where the process is failing!

