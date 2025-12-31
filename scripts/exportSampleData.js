// scripts/exportSampleData.js
// This script exports ANONYMIZED sample data from production for use in test environments
// Run with: node scripts/exportSampleData.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize with PRODUCTION credentials (read-only operation)
// Try multiple possible filenames for the service account key
const possiblePaths = [
  path.join(__dirname, '../backend/coursereview-98a89-firebase-adminsdk-2yc5i-45d53591e3.json'),
  path.join(__dirname, '../backend/coursereview-98a89-firebase-admin.json'),
  path.join(__dirname, '../backend/coursereview-98a89-fde32db8dd96.json'),
];

let serviceAccount = null;
let usedPath = null;

for (const keyPath of possiblePaths) {
  try {
    serviceAccount = require(keyPath);
    usedPath = keyPath;
    console.log(`✅ Using service account from: ${keyPath}`);
    break;
  } catch (e) {
    continue;
  }
}

if (!serviceAccount) {
  console.error('❌ Could not find production service account key.');
  console.error('Looked in:');
  possiblePaths.forEach(p => console.error(`   • ${p}`));
  console.error('\nPlease place your production Firebase service account key in the backend folder.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Configuration for export
const EXPORT_CONFIG = {
  courses: { limit: 200, includeAll: false },        // Sample of courses
  professors: { limit: 100, includeAll: false },     // Sample of professors
  winterTimetable: { limit: null, includeAll: true }, // All timetable data
  hiddenLayups: { limit: null, includeAll: true },    // All hidden layups
  // These are EXCLUDED for privacy:
  // users, reviews, search_analytics, chatConversations
};

const exportSampleData = async () => {
  console.log('🔄 Starting sample data export from production...\n');
  console.log(`📍 Project: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}\n`);
  
  const sampleData = {
    exportedAt: new Date().toISOString(),
    sourceProject: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    collections: {}
  };
  
  try {
    // 1. Export courses (anonymized - no user-specific data)
    console.log('📚 Exporting courses...');
    const coursesQuery = EXPORT_CONFIG.courses.includeAll 
      ? db.collection('courses')
      : db.collection('courses').limit(EXPORT_CONFIG.courses.limit);
    
    const coursesSnapshot = await coursesQuery.get();
    sampleData.collections.courses = coursesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        department: data.department,
        course_number: data.course_number,
        name: data.name,
        layup: data.layup || 0,
        numOfReviews: data.numOfReviews || 0,
        distribs: data.distribs || [],
        // Exclude any user-specific or sensitive fields
      };
    });
    console.log(`   ✓ Exported ${sampleData.collections.courses.length} courses`);
    
    // 2. Export professors
    console.log('👨‍🏫 Exporting professors...');
    const professorsQuery = EXPORT_CONFIG.professors.includeAll
      ? db.collection('professor')
      : db.collection('professor').limit(EXPORT_CONFIG.professors.limit);
    
    const professorsSnapshot = await professorsQuery.get();
    sampleData.collections.professors = professorsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || doc.id.replace('_', ' ')
    }));
    console.log(`   ✓ Exported ${sampleData.collections.professors.length} professors`);
    
    // 3. Export winter timetable (public data)
    console.log('📅 Exporting winter timetable (winterTimetable26)...');
    const winterSnapshot = await db.collection('winterTimetable26').get();
    sampleData.collections.winterTimetable26 = winterSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`   ✓ Exported ${sampleData.collections.winterTimetable26.length} timetable entries`);
    
    // 4. Export hidden layups (without user votes)
    console.log('🎯 Exporting hidden layups...');
    const hiddenLayupsSnapshot = await db.collection('hidden_layups').get();
    sampleData.collections.hidden_layups = hiddenLayupsSnapshot.docs.map(doc => ({
      id: doc.id,
      yes_count: 0,  // Reset to 0 for test environment
      no_count: 0    // Reset to 0 for test environment
    }));
    console.log(`   ✓ Exported ${sampleData.collections.hidden_layups.length} hidden layups`);
    
    // 5. Export course priorities (if exists)
    console.log('📊 Exporting course priorities...');
    try {
      const prioritiesSnapshot = await db.collection('CoursePriorities').get();
      sampleData.collections.CoursePriorities = prioritiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`   ✓ Exported ${sampleData.collections.CoursePriorities.length} course priorities`);
    } catch (e) {
      console.log('   ⚠️ CoursePriorities collection not found or empty');
      sampleData.collections.CoursePriorities = [];
    }
    
    // 6. Export spring timetable
    console.log('📅 Exporting spring timetable...');
    try {
      const springSnapshot = await db.collection('springTimetable').get();
      sampleData.collections.springTimetable = springSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`   ✓ Exported ${sampleData.collections.springTimetable.length} spring timetable entries`);
    } catch (e) {
      console.log('   ⚠️ springTimetable collection not found or empty');
      sampleData.collections.springTimetable = [];
    }
    
    // 7. Export summer timetable
    console.log('📅 Exporting summer timetable...');
    try {
      const summerSnapshot = await db.collection('summerTimetable').get();
      sampleData.collections.summerTimetable = summerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`   ✓ Exported ${sampleData.collections.summerTimetable.length} summer timetable entries`);
    } catch (e) {
      console.log('   ⚠️ summerTimetable collection not found or empty');
      sampleData.collections.summerTimetable = [];
    }
    
    // 8. Export fall timetable
    console.log('📅 Exporting fall timetable...');
    try {
      const fallSnapshot = await db.collection('fallTimetable2').get();
      sampleData.collections.fallTimetable2 = fallSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`   ✓ Exported ${sampleData.collections.fallTimetable2.length} fall timetable entries`);
    } catch (e) {
      console.log('   ⚠️ fallTimetable2 collection not found or empty');
      sampleData.collections.fallTimetable2 = [];
    }
    
    // 9. Export suggested hidden layups
    console.log('💡 Exporting suggested hidden layups...');
    try {
      const suggestedSnapshot = await db.collection('suggested_hidden_layups').get();
      sampleData.collections.suggested_hidden_layups = suggestedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`   ✓ Exported ${sampleData.collections.suggested_hidden_layups.length} suggested hidden layups`);
    } catch (e) {
      console.log('   ⚠️ suggested_hidden_layups collection not found or empty');
      sampleData.collections.suggested_hidden_layups = [];
    }
    
    // 10. Export course descriptions
    console.log('📝 Exporting course descriptions...');
    try {
      const descSnapshot = await db.collection('courseDescriptions').limit(200).get();
      sampleData.collections.courseDescriptions = descSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`   ✓ Exported ${sampleData.collections.courseDescriptions.length} course descriptions`);
    } catch (e) {
      console.log('   ⚠️ courseDescriptions collection not found or empty');
      sampleData.collections.courseDescriptions = [];
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to file
    const outputPath = path.join(outputDir, 'sample_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(sampleData, null, 2));
    
    console.log('\n✅ Export complete!');
    console.log(`📁 Data saved to: ${outputPath}`);
    console.log('\n📊 Summary:');
    Object.entries(sampleData.collections).forEach(([name, data]) => {
      console.log(`   • ${name}: ${data.length} documents`);
    });
    
    console.log('\n⚠️  IMPORTANT: The following collections were NOT exported for privacy:');
    console.log('   • users (contains personal user data)');
    console.log('   • reviews (may contain personal opinions)');
    console.log('   • search_analytics (user search history)');
    console.log('   • chatConversations (private chat history)');
    console.log('   • timetable-requests (user notifications)');
    
  } catch (error) {
    console.error('❌ Error during export:', error);
    throw error;
  }
};

// Run the export
exportSampleData()
  .then(() => {
    console.log('\n🎉 Sample data export completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Export failed:', err);
    process.exit(1);
  });

