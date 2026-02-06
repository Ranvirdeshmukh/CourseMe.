// Resolve modules from parent node_modules
require('./resolveParentModules');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const serviceAccount = require('../data/coursereview-98a89-firebase-adminsdk-2yc5i-b115c9fc76.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const sanitizeId = (id) => {
  return id.replace(/[^a-zA-Z0-9]/g, '_'); // Replace special characters with underscores
};

const isValidDocument = (doc) => {
  // Ensure the document does not contain empty strings as keys
  return Object.keys(doc).every(key => key.trim() !== '');
};

const importCoursePriorities = async () => {
  try {
    const filePath = path.join(__dirname, '../data/priorities.json'); // Use the JSON file directly
    const fileContent = await fs.readFile(filePath, 'utf8');
    const coursePrioritiesData = JSON.parse(fileContent);

    for (const course of coursePrioritiesData) {
      const {
        Subject,
        'Course Number': courseNumber,
        Title,
        'Enrollment Limit': enrollmentLimit,
        Priorities
      } = course;

      const sanitizedId = sanitizeId(`${Subject}_${courseNumber}`);
      const docRef = db.collection('CoursePriorities').doc(sanitizedId);

      const courseDocument = {
        Department: Subject, // Change Subject to Department
        'Course Number': courseNumber,
        'Title of the Class': Title, // Change Title to Title of the Class
        'Enrollment Limit': enrollmentLimit,
        Priorities
      };

      if (!isValidDocument(courseDocument)) {
        console.error(`Invalid document for course ${sanitizedId}: contains empty keys`);
        continue;
      }

      console.log(`Adding course priorities for: ${sanitizedId}`);
      await docRef.set(courseDocument);
      console.log(`Successfully added course priorities for: ${sanitizedId}`);
    }

    console.log('Course priorities data imported successfully');
  } catch (error) {
    console.error('Error reading course priorities data file:', error);
  }
};

importCoursePriorities().catch(console.error);
