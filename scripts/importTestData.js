// scripts/importTestData.js
// This script imports sample data into a TEST Firebase environment
// Run with: node scripts/importTestData.js
//
// IMPORTANT: Make sure your .env file points to the TEST project, not production!

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PRODUCTION_PROJECT_ID = 'coursereview-98a89';

// Safety check - prevent running against production
const currentProjectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;

if (currentProjectId === PRODUCTION_PROJECT_ID) {
  console.error('🚨 ERROR: This script is attempting to run against PRODUCTION!');
  console.error('');
  console.error('Current project ID:', currentProjectId);
  console.error('');
  console.error('To use this script safely:');
  console.error('1. Create a .env.test file with your test Firebase credentials');
  console.error('2. Copy .env.test to .env (or use a different loading mechanism)');
  console.error('3. Make sure REACT_APP_FIREBASE_PROJECT_ID is NOT "coursereview-98a89"');
  console.error('');
  process.exit(1);
}

// Prompt for confirmation
const confirmImport = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('');
    console.log('⚠️  IMPORT CONFIRMATION');
    console.log('========================');
    console.log(`Target Project: ${currentProjectId}`);
    console.log('');
    console.log('This will import sample data into the above project.');
    console.log('Existing documents with the same IDs will be OVERWRITTEN.');
    console.log('');
    
    rl.question('Are you sure you want to continue? (type "yes" to confirm): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
};

// Initialize Firebase Admin for TEST environment
const initializeTestFirebase = () => {
  // Try to find a test service account key
  const possiblePaths = [
    path.join(__dirname, '../backend/courseme-test-firebase-admin.json'),
    path.join(__dirname, `../backend/${currentProjectId}-firebase-admin.json`),
    path.join(__dirname, '../backend/test-service-account.json'),
    path.join(__dirname, `../backend/${currentProjectId}-firebase-adminsdk.json`),
  ];
  
  let serviceAccount = null;
  let usedPath = null;
  
  for (const keyPath of possiblePaths) {
    try {
      serviceAccount = require(keyPath);
      usedPath = keyPath;
      break;
    } catch (e) {
      continue;
    }
  }
  
  if (!serviceAccount) {
    console.error('❌ Could not find test service account key.');
    console.error('');
    console.error('Looked in:');
    possiblePaths.forEach(p => console.error(`   • ${p}`));
    console.error('');
    console.error('Please place your test Firebase service account key in one of these locations.');
    process.exit(1);
  }
  
  console.log(`✅ Using service account from: ${usedPath}`);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: currentProjectId
  });
  
  return admin.firestore();
};

const importTestData = async (db) => {
  // Check for sample data file
  const dataPath = path.join(__dirname, '../data/sample_data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Sample data file not found at:', dataPath);
    console.error('');
    console.error('Run the export script first:');
    console.error('   node scripts/exportSampleData.js');
    process.exit(1);
  }
  
  const sampleData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log('');
  console.log(`📁 Loading data from: ${dataPath}`);
  console.log(`📅 Data exported at: ${sampleData.exportedAt}`);
  console.log(`📍 Source project: ${sampleData.sourceProject}`);
  console.log('');
  
  const batch = db.batch();
  let totalDocs = 0;
  
  // Helper function to import a collection
  const importCollection = async (collectionName, documents) => {
    if (!documents || documents.length === 0) {
      console.log(`   ⚠️ No documents for ${collectionName}`);
      return 0;
    }
    
    console.log(`📥 Importing ${collectionName}...`);
    const collectionRef = db.collection(collectionName);
    
    // Use batched writes for efficiency (max 500 per batch)
    let batchCount = 0;
    let currentBatch = db.batch();
    
    for (const doc of documents) {
      const docId = doc.id;
      const docData = { ...doc };
      delete docData.id; // Remove id from document data
      
      const docRef = collectionRef.doc(docId);
      currentBatch.set(docRef, docData);
      batchCount++;
      
      // Commit batch every 400 documents (leaving room for safety)
      if (batchCount >= 400) {
        await currentBatch.commit();
        console.log(`   ✓ Committed batch of ${batchCount} documents`);
        currentBatch = db.batch();
        batchCount = 0;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await currentBatch.commit();
      console.log(`   ✓ Committed final batch of ${batchCount} documents`);
    }
    
    console.log(`   ✅ Imported ${documents.length} documents to ${collectionName}`);
    return documents.length;
  };
  
  try {
    // Import each collection
    for (const [collectionName, documents] of Object.entries(sampleData.collections)) {
      const count = await importCollection(collectionName, documents);
      totalDocs += count;
    }
    
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`✅ IMPORT COMPLETE!`);
    console.log(`   Total documents imported: ${totalDocs}`);
    console.log(`   Target project: ${currentProjectId}`);
    console.log('═══════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  console.log('');
  console.log('🔄 CourseMe Test Data Import Tool');
  console.log('══════════════════════════════════');
  
  // Confirm before proceeding
  const confirmed = await confirmImport();
  
  if (!confirmed) {
    console.log('');
    console.log('Import cancelled.');
    process.exit(0);
  }
  
  console.log('');
  console.log('Initializing Firebase...');
  const db = initializeTestFirebase();
  
  await importTestData(db);
};

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });

