// scripts/syncGCSClasses.js
// Resolve modules from parent node_modules
require('./resolveParentModules');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const path = require('path');

// Load environment variables from .env file in the parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Check if we have the required environment variables
const requiredEnvVars = [
  'REACT_APP_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nTo fix this:');
  console.error('1. Ensure your .env file has REACT_APP_FIREBASE_PROJECT_ID');
  console.error('2. Verify REACT_APP_FIREBASE_PROJECT_ID is set to coursereview-98a89');
  process.exit(1);
}

// Initialize Firebase Admin with the service account key file
try {
  const serviceAccountPath = path.join(__dirname, '../backend/coursereview-98a89-fde32db8dd96.json');
  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
    });
    console.log('✅ Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.error('\nTo fix this:');
  console.error('1. Check that the service account key file exists at: backend/coursereview-98a89-fde32db8dd96.json');
  console.error('2. Ensure the service account has the "Firebase Admin" role');
  console.error('3. Verify the service account key file is readable');
  process.exit(1);
}

const db = admin.firestore();
const GCS_URL = 'https://storage.googleapis.com/timetable-info/courses_detailed.json';

// Period code to timing mapping (copied from the existing service)
const periodCodeToTiming = {
  "11": "MWF 11:30-12:35, Tu 12:15-1:05",
  "10": "MWF 10:10-11:15, Th 12:15-1:05",
  "2": "MWF 2:10-3:15, Th 1:20-2:10",
  "3A": "MW 3:30-5:20, M 5:30-6:20",
  "12": "MWF 12:50-1:55, Tu 1:20-2:10",
  "2A": "TuTh 2:25-4:15, W 5:30-6:20",
  "10A": "TuTh 10:10-12, F 3:30-4:20",
  "FS": "FSP; Foreign Study Program",
  "ARR": "Arrange",
  "9L": "MWF 8:50-9:55, Th 9:05-9:55",
  "9S": "MTuWThF 9:05-9:55",
  "OT": "Th 2:00 PM-4:00 PM",
  "3B": "TuTh 4:30-6:20, F 4:35-5:25",
  "6A": "MTh 6:30-8:20, Tu 6:30-7:20",
  "6B": "W 6:30-9:30, Tu 7:30-8:20",
  "8S": "MTThF 7:45-8:35, Wed 7:45-8:35",
  "LSA": "Language Study Abroad",
};

// Helper function to normalize course numbers (copied from existing service)
const normalizeCourseNumber = (number) => {
  if (typeof number === 'string' && number.includes('.')) {
    const [integerPart, decimalPart] = number.split('.');
    return `${integerPart.padStart(3, '0')}.${decimalPart}`;
  }
  return typeof number === 'string' ? number.padStart(3, '0') : String(number).padStart(3, '0');
};

// Helper function to generate document ID in the format DEPARTMENT_DEPARTMENT_NUMBER_OPTIONALDECIMAL_NAME
const generateDocumentId = (department, courseNumber, courseTitle) => {
  // Normalize the course number
  const normalizedNumber = normalizeCourseNumber(courseNumber);
  
  // Clean the title: remove special characters, replace spaces with underscores, limit length
  const cleanTitle = courseTitle
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length to avoid extremely long IDs
  
  // Create the ID: DEPARTMENT_DEPARTMENT_NUMBER_OPTIONALDECIMAL_NAME
  const docId = `${department}_${normalizedNumber}_${cleanTitle}`;
  
  return docId;
};

// Helper function to check if a course already exists in the courses collection
const courseExists = async (department, courseNumber) => {
  try {
    const normalizedNumber = normalizeCourseNumber(courseNumber);
    const q = db.collection('courses')
      .where('department', '==', department)
      .where('course_number', '==', normalizedNumber);
    
    const querySnapshot = await q.get();
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`Error checking if course exists: ${department} ${courseNumber}`, error);
    return false;
  }
};

// Helper function to create a course document for the courses collection
const createCourseDocument = (courseData) => {
  const periodCode = courseData['Period Code'];
  const timing = periodCodeToTiming[periodCode] || 'Unknown Timing';
  
  return {
    department: courseData.Subj,
    course_number: normalizeCourseNumber(courseData.Num),
    name: courseData.Title,
    // Add additional fields that might be useful
    period_code: periodCode,
    timing: timing,
    room: courseData.Room || '',
    building: courseData.Building || '',
    instructor: courseData.Instructor || '',
    xlist: courseData.XList || '',
    wc: courseData.WC || '',
    dist: courseData.Dist || '',
    // Initialize with default values
    layup: 0,
    numOfReviews: 0,
    distribs: courseData.Dist ? [courseData.Dist.trim()] : [],
    // Add timestamp
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    // Add source information
    source: 'GCS_Timetable_Sync',
    syncDate: admin.firestore.FieldValue.serverTimestamp()
  };
};

// Main function to sync classes
const syncGCSCourses = async (dryRun = true) => {
  try {
    console.log(`Starting GCS course sync... ${dryRun ? '(DRY RUN)' : '(ACTUAL SYNC)'}`);
    console.log(`Using Firebase project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
    
    // Fetch data from GCS
    console.log('Fetching data from GCS...');
    const response = await fetch(GCS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch timetable data: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    if (!Array.isArray(rawData)) {
      throw new Error('Invalid data format: expected array');
    }
    
    console.log(`Fetched ${rawData.length} courses from GCS`);
    
    // Process each course
    let newCourses = 0;
    let existingCourses = 0;
    let skippedCourses = 0;
    let errors = 0;
    
    for (const course of rawData) {
      try {
        // Skip courses without required fields
        if (!course.Subj || !course.Num) {
          console.log(`Skipping course with missing required fields:`, course);
          skippedCourses++;
          continue;
        }
        
        const department = course.Subj;
        const courseNumber = course.Num;
        
        // Check if course already exists
        const exists = await courseExists(department, courseNumber);
        
        if (exists) {
          existingCourses++;
          if (existingCourses <= 5) { // Log first few existing courses
            console.log(`✓ Course already exists: ${department} ${courseNumber} - ${course.Title}`);
          }
        } else {
          newCourses++;
          const courseDoc = createCourseDocument(course);
          const documentId = generateDocumentId(department, courseNumber, course.Title);
          
          if (dryRun) {
            console.log(`+ Would add new course: ${department} ${courseNumber} - ${course.Title}`);
            console.log(`  Document ID: ${documentId}`);
            console.log(`  Document:`, JSON.stringify(courseDoc, null, 2));
          } else {
            // Actually add the course to Firestore with the custom document ID
            const docRef = db.collection('courses').doc(documentId);
            await docRef.set(courseDoc);
            console.log(`+ Added new course: ${department} ${courseNumber} - ${course.Title} (ID: ${documentId})`);
          }
        }
        
        // Log progress every 100 courses
        if ((newCourses + existingCourses) % 100 === 0) {
          console.log(`Progress: ${newCourses + existingCourses}/${rawData.length} courses processed`);
        }
        
      } catch (error) {
        console.error(`Error processing course ${course.Subj} ${course.Num}:`, error);
        errors++;
      }
    }
    
    // Summary
    console.log('\n=== SYNC SUMMARY ===');
    console.log(`Total courses in GCS: ${rawData.length}`);
    console.log(`Existing courses: ${existingCourses}`);
    console.log(`New courses: ${newCourses}`);
    console.log(`Skipped courses: ${skippedCourses}`);
    console.log(`Errors: ${errors}`);
    
    if (dryRun) {
      console.log('\nThis was a DRY RUN. No courses were actually added to the database.');
      console.log('To perform the actual sync, run with dryRun = false');
    } else {
      console.log('\nSync completed successfully!');
    }
    
  } catch (error) {
    console.error('Error during GCS course sync:', error);
    throw error;
  }
};

// Function to get existing courses count for comparison
const getExistingCoursesCount = async () => {
  try {
    const snapshot = await db.collection('courses').get();
    console.log(`Current courses in database: ${snapshot.size}`);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting existing courses count:', error);
    return 0;
  }
};

// Main execution
const main = async () => {
  try {
    // First, get current count
    await getExistingCoursesCount();
    
    // Run dry run first
    console.log('\n=== RUNNING DRY RUN ===');
    await syncGCSCourses(true);
    
    // Ask user if they want to proceed with actual sync
    console.log('\n=== DRY RUN COMPLETED ===');
    console.log('Review the logs above to ensure everything looks correct.');
    console.log('To proceed with the actual sync, modify this script and set dryRun = false');
    
    // Uncomment the line below to run the actual sync
    // await syncGCSCourses(false);
    
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  syncGCSCourses,
  courseExists,
  createCourseDocument,
  getExistingCoursesCount,
  generateDocumentId
};
