# Winter Timetable Firestore Structure

## ✅ FIXED - Now Using Same Logic as Fall

The Winter course transformation now uses **EXACTLY** the same logic as Fall courses. The only difference is the data source:

- **Fall**: Fetches from Google Cloud Storage JSON file
- **Winter**: Fetches from Firestore `winterTimetable26` collection

## Required Firestore Document Structure

Your documents in the `winterTimetable26` collection **MUST** have these **exact field names** (with capital letters):

```json
{
  "Subj": "COSC",
  "Num": "1",
  "Sec": "01",
  "Title": "Introduction to Programming and Computation",
  "Period Code": "10",
  "Room": "115",
  "Building": "Sudikoff",
  "Instructor": "Smith, John",
  "XList": "",
  "WC": "TAS",
  "Dist": "TLA"
}
```

## ⚠️ Critical Field Name Requirements

The field names MUST match these **exactly** (case-sensitive):

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `Subj` | string | ✅ YES | `"COSC"` |
| `Num` | string | ✅ YES | `"1"` |
| `Sec` | string | ✅ YES | `"01"` |
| `Title` | string | ✅ YES | `"Introduction to Programming"` |
| `Period Code` | string | ✅ YES | `"10"` |
| `Room` | string | Optional | `"115"` |
| `Building` | string | Optional | `"Sudikoff"` |
| `Instructor` | string | Optional | `"Smith, John"` |
| `XList` | string | Optional | `""` |
| `WC` | string | Optional | `"TAS"` |
| `Dist` | string | Optional | `"TLA"` |

## ❌ WRONG Field Names (will NOT work)

```json
{
  "subj": "COSC",        ❌ Lowercase - won't work
  "num": "1",            ❌ Lowercase - won't work  
  "sec": "01",           ❌ Lowercase - won't work
  "title": "...",        ❌ Lowercase - won't work
  "period": "10",        ❌ Wrong field name - should be "Period Code"
  "subject": "COSC",     ❌ Wrong field name - should be "Subj"
  "number": "1",         ❌ Wrong field name - should be "Num"
  "section": "01"        ❌ Wrong field name - should be "Sec"
}
```

## How to Update Your Firestore Documents

### Option 1: Using Firebase Console

1. Go to Firebase Console → Firestore Database
2. Navigate to `winterTimetable26` collection
3. For each document, click to edit
4. Make sure field names match **exactly** (case-sensitive)

### Option 2: Batch Update Script

If you have many documents, you can use this script:

```javascript
// This is a Firebase Admin SDK script
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function updateFieldNames() {
  const snapshot = await db.collection('winterTimetable26').get();
  
  const batch = db.batch();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    
    // Create new document with correct field names
    const updatedData = {
      'Subj': data.subj || data.Subj,
      'Num': data.num || data.Num,
      'Sec': data.sec || data.Sec,
      'Title': data.title || data.Title,
      'Period Code': data.period || data['Period Code'],
      'Room': data.room || data.Room || '',
      'Building': data.building || data.Building || '',
      'Instructor': data.instructor || data.Instructor || '',
      'XList': data.xlist || data.XList || '',
      'WC': data.wc || data.WC || '',
      'Dist': data.dist || data.Dist || ''
    };
    
    batch.update(doc.ref, updatedData);
  });
  
  await batch.commit();
  console.log('Updated all documents!');
}

updateFieldNames();
```

## Example Complete Document

Here's what a complete, correct document should look like:

```json
{
  "Subj": "COSC",
  "Num": "50",
  "Sec": "02",
  "Title": "Software Design and Implementation",
  "Period Code": "10",
  "Room": "007",
  "Building": "Sudikoff",
  "Instructor": "Palmer, Devin",
  "XList": "COSC 050.02",
  "WC": "TAS",
  "Dist": "TLA"
}
```

## Transformation Result

With correct field names, this Firestore document will transform to:

```javascript
{
  documentName: "COSC50_02",
  subj: "COSC",
  num: "50", 
  sec: "02",
  title: "Software Design and Implementation",
  period: "10",
  timing: "MWF 10:10-11:15, Th 12:15-1:05",
  room: "007",
  building: "Sudikoff",
  instructor: "Palmer, Devin",
  xlist: "COSC 050.02",
  wc: "TAS",
  dist: "TLA",
  isNotified: false
}
```

## Verification Steps

1. ✅ Check one document in Firestore
2. ✅ Verify field names are capitalized: `Subj`, `Num`, `Sec`, `Title`
3. ✅ Verify "Period Code" (not "period" or "Period")
4. ✅ Clear browser cache
5. ✅ Refresh Winter 2026 timetable
6. ✅ Check console for: "Fetched X winter courses from Firestore"
7. ✅ Try adding a course

## Common Period Codes

Make sure your "Period Code" values are valid:

- `"10"` → MWF 10:10-11:15, Th 12:15-1:05
- `"11"` → MWF 11:30-12:35, Tu 12:15-1:05
- `"12"` → MWF 12:50-1:55, Tu 1:20-2:10
- `"2"` → MWF 2:10-3:15, Th 1:20-2:10
- `"2A"` → TuTh 2:25-4:15, W 5:30-6:20
- `"3A"` → MW 3:30-5:20, M 5:30-6:20
- `"10A"` → TuTh 10:10-12, F 3:30-4:20
- `"ARR"` → Arrange
- `"FS"` → FSP; Foreign Study Program

## Summary

✅ **Winter now uses IDENTICAL logic to Fall**
✅ **Just needs correct Firestore field names**
✅ **Field names must be capitalized**
✅ **"Period Code" not "period"**

Update your Firestore documents and it will work exactly like Fall! 🎉

