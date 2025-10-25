// ========================================
// DEEP DEBUG SCRIPT FOR WINTER COURSES
// ========================================
// Run this in your browser console when on Winter 2026 timetable

console.log('%c=== WINTER TIMETABLE DEEP DEBUG ===', 'color: #00ff00; font-size: 20px; font-weight: bold');

// Step 1: Check Firestore Access
console.log('%c[1] Testing Firestore Access...', 'color: #ffaa00; font-weight: bold');

import { getFirestore, collection, getDocs } from 'firebase/firestore';

async function testFirestoreAccess() {
  try {
    const db = getFirestore();
    const winterCollectionRef = collection(db, 'winterTimetable26');
    const snapshot = await getDocs(winterCollectionRef);
    
    console.log('✅ Firestore Access: SUCCESS');
    console.log(`   Total documents: ${snapshot.docs.length}`);
    
    if (snapshot.docs.length === 0) {
      console.error('❌ ERROR: winterTimetable26 collection is EMPTY!');
      return false;
    }
    
    // Check first 3 documents
    console.log('\n%c[2] Checking Document Structure...', 'color: #ffaa00; font-weight: bold');
    snapshot.docs.slice(0, 3).forEach((doc, index) => {
      const data = doc.data();
      console.log(`\nDocument ${index + 1} (ID: ${doc.id}):`);
      console.log('   Fields:', Object.keys(data));
      console.log('   Subj:', data.Subj || data.subj || '❌ MISSING');
      console.log('   Num:', data.Num || data.num || '❌ MISSING');
      console.log('   Sec:', data.Sec || data.sec || '❌ MISSING');
      console.log('   Title:', data.Title || data.title || '❌ MISSING');
      console.log('   Period Code:', data['Period Code'] || data.period || '❌ MISSING');
      
      // Check for common issues
      if (!data.Subj && !data.subj) {
        console.error('   ❌ ERROR: Missing subject field!');
      }
      if (!data.Num && !data.num) {
        console.error('   ❌ ERROR: Missing number field!');
      }
      if (!data.Sec && !data.sec) {
        console.error('   ❌ ERROR: Missing section field!');
      }
      if (data.Subj === '' || data.subj === '') {
        console.error('   ❌ ERROR: Subject is empty string!');
      }
      if (data.Num === '' || data.num === '') {
        console.error('   ❌ ERROR: Number is empty string!');
      }
    });
    
    return snapshot.docs;
  } catch (error) {
    console.error('❌ Firestore Access FAILED:', error);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    
    if (error.code === 'permission-denied') {
      console.error('   ⚠️  PERMISSION DENIED - Check Firestore Security Rules!');
      console.error('   Need this rule:');
      console.log(`
match /winterTimetable26/{document} {
  allow read: if true;
  allow write: if request.auth != null;
}
      `);
    }
    return false;
  }
}

// Step 2: Test Course Transformation
console.log('\n%c[3] Testing Course Transformation...', 'color: #ffaa00; font-weight: bold');

function testTransformation(docs) {
  if (!docs || docs.length === 0) {
    console.error('❌ No documents to transform');
    return;
  }
  
  const doc = docs[0];
  const course = doc.data();
  
  console.log('\nRaw Firestore Document:');
  console.log(course);
  
  console.log('\nTransformed Course Object:');
  const transformed = {
    documentName: `${course.Subj}${course.Num}_${course.Sec}`,
    subj: course.Subj,
    num: course.Num,
    sec: course.Sec,
    title: course.Title,
    period: course['Period Code'],
    timing: 'Will be mapped...',
    room: course.Room,
    building: course.Building,
    instructor: course.Instructor,
  };
  
  console.log(transformed);
  
  // Validate transformation
  console.log('\nValidation:');
  console.log('   documentName:', transformed.documentName || '❌ INVALID');
  console.log('   subj:', transformed.subj || '❌ MISSING');
  console.log('   num:', transformed.num || '❌ MISSING');
  console.log('   sec:', transformed.sec || '❌ MISSING');
  
  if (!transformed.subj || !transformed.num || !transformed.sec) {
    console.error('❌ TRANSFORMATION FAILED - Missing required fields!');
    console.error('   Your Firestore documents MUST have these fields:');
    console.error('   - Subj (with capital S)');
    console.error('   - Num (with capital N)');
    console.error('   - Sec (with capital S)');
    return false;
  }
  
  console.log('✅ Transformation looks good!');
  return transformed;
}

// Step 3: Test Add Course Logic
console.log('\n%c[4] Testing Add Course Logic...', 'color: #ffaa00; font-weight: bold');

async function testAddCourse(transformedCourse) {
  if (!transformedCourse) {
    console.error('❌ No course to test with');
    return;
  }
  
  console.log('\nCourse to add:');
  console.log(transformedCourse);
  
  console.log('\nChecking required fields for addCourseToTimetable:');
  console.log('   subj:', transformedCourse.subj, transformedCourse.subj ? '✅' : '❌');
  console.log('   num:', transformedCourse.num, transformedCourse.num ? '✅' : '❌');
  console.log('   sec:', transformedCourse.sec, transformedCourse.sec ? '✅' : '❌');
  
  if (!transformedCourse.subj || !transformedCourse.num || !transformedCourse.sec) {
    console.error('❌ WOULD FAIL: Missing required fields!');
    return false;
  }
  
  console.log('✅ Course has all required fields');
  console.log('\nExpected Firestore path:');
  console.log('   users/{userId}/winterCoursestaken');
  
  return true;
}

// Step 4: Check Current User
console.log('\n%c[5] Checking Authentication...', 'color: #ffaa00; font-weight: bold');

import { getAuth } from 'firebase/auth';

function checkAuth() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No user logged in!');
    console.error('   You must be logged in to add courses');
    return false;
  }
  
  console.log('✅ User logged in');
  console.log('   UID:', user.uid);
  console.log('   Email:', user.email);
  return user;
}

// Run all tests
async function runAllTests() {
  console.log('\n%c=== RUNNING ALL TESTS ===', 'color: #00ff00; font-size: 16px; font-weight: bold');
  
  const user = checkAuth();
  if (!user) {
    console.error('\n❌ STOP: Please log in first');
    return;
  }
  
  const docs = await testFirestoreAccess();
  if (!docs) {
    console.error('\n❌ STOP: Cannot access Firestore');
    return;
  }
  
  const transformed = testTransformation(docs);
  if (!transformed) {
    console.error('\n❌ STOP: Transformation failed');
    return;
  }
  
  const canAdd = await testAddCourse(transformed);
  if (!canAdd) {
    console.error('\n❌ STOP: Cannot add course');
    return;
  }
  
  console.log('\n%c=== ALL TESTS PASSED ===', 'color: #00ff00; font-size: 16px; font-weight: bold');
  console.log('✅ Firestore access works');
  console.log('✅ Documents have correct structure');
  console.log('✅ Transformation works');
  console.log('✅ Course can be added');
  console.log('\nIf adding still doesn\'t work, check browser console for errors when clicking Add button');
}

// Auto-run
runAllTests().catch(error => {
  console.error('Test execution failed:', error);
});

