// scripts/setupFirebase.js
const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from .env file in the parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('=== Firebase Setup Helper ===\n');

// Check if we have the required environment variables
const requiredEnvVars = [
  'REACT_APP_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('\nTo fix this:');
  console.log('1. Ensure your .env file has REACT_APP_FIREBASE_PROJECT_ID');
  console.log('2. Verify REACT_APP_FIREBASE_PROJECT_ID is set to coursereview-98a89');
  process.exit(1);
}

// Helper function to generate document ID (same as in sync script)
const generateDocumentId = (department, courseNumber, courseTitle) => {
  // Normalize the course number
  const normalizeCourseNumber = (number) => {
    if (typeof number === 'string' && number.includes('.')) {
      const [integerPart, decimalPart] = number.split('.');
      return `${integerPart.padStart(3, '0')}.${decimalPart}`;
    }
    return typeof number === 'string' ? number.padStart(3, '0') : String(number).padStart(3, '0');
  };
  
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

// Main setup function
const setupFirebase = async () => {
  try {
    console.log('✅ Environment variables loaded');
    console.log(`Project ID: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
    
    // Show example of document ID generation
    console.log('\n📝 Document ID Generation Example:');
    const exampleId = generateDocumentId('AAAS', '009', 'Intro to Diaspora Studies');
    console.log(`  Course: AAAS 009 - Intro to Diaspora Studies`);
    console.log(`  Generated ID: ${exampleId}`);
    
    // Load the service account key
    const serviceAccountPath = path.join(__dirname, '../backend/coursereview-98a89-fde32db8dd96.json');
    const serviceAccount = require(serviceAccountPath);
    console.log('\n✅ Service account key loaded successfully');
    
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin initialized');
    }
    
    const db = admin.firestore();
    
    // Test the connection by trying to read from the courses collection
    console.log('\n🔍 Testing Firestore connection...');
    
    const coursesRef = db.collection('courses');
    const snapshot = await coursesRef.limit(1).get();
    
    if (snapshot.empty) {
      console.log('✅ Connected to Firestore successfully');
      console.log('ℹ️  Courses collection exists but is empty');
    } else {
      console.log('✅ Connected to Firestore successfully');
      console.log(`ℹ️  Found ${snapshot.size} document(s) in courses collection`);
      
      // Show a sample document structure
      const sampleDoc = snapshot.docs[0];
      const data = sampleDoc.data();
      console.log('\n📄 Sample course document structure:');
      console.log(JSON.stringify(data, null, 2));
      
      // Show the document ID format
      console.log(`\n📋 Document ID: ${sampleDoc.id}`);
    }
    
    console.log('\n🎉 Firebase setup completed successfully!');
    console.log('You can now run the sync script: npm run sync-gcs-dry');
    
  } catch (error) {
    console.error('\n❌ Error during Firebase setup:', error.message);
    
    if (error.code === 'SERVICE_DISABLED') {
      console.log('\n💡 This error usually means:');
      console.log('1. The Firestore API is not enabled in your project');
      console.log('2. Go to: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=coursereview-98a89');
      console.log('3. Click "Enable" to activate the Firestore API');
      console.log('4. Wait a few minutes and try again');
    } else if (error.code === 'PERMISSION_DENIED') {
      console.log('\n💡 This error usually means:');
      console.log('1. The service account key is invalid or expired');
      console.log('2. The service account lacks proper permissions');
      console.log('3. Generate a new service account key with "Firebase Admin" role');
    } else if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\n💡 This error usually means:');
      console.log('1. The service account key file path is incorrect');
      console.log('2. Check that the file exists at: backend/coursereview-98a89-fde32db8dd96.json');
      console.log('3. Ensure the file is readable');
    }
    
    process.exit(1);
  }
};

// Run the setup
setupFirebase().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
