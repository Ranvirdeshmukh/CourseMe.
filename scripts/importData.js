const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const serviceAccount = require('../data/coursereview-98a89-firebase-adminsdk-2yc5i-320058ff1a.json');

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

const importData = async () => {
  try {
    const classDataPath = path.join(__dirname, '../data/classData');
    const files = await fs.readdir(classDataPath);

    for (const file of files) {
      try {
        const filePath = path.join(classDataPath, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const reviewsData = JSON.parse(fileContent);

        for (const courseId in reviewsData) {
          const courseReviews = reviewsData[courseId];
          if (!isValidDocument(courseReviews)) {
            console.error(`Invalid document for course ${courseId}: contains empty keys`);
            continue;
          }
          const sanitizedId = sanitizeId(courseId);
          const docRef = db.collection('reviews').doc(sanitizedId);
          console.log(`Adding reviews for course: ${courseId} with sanitized ID: ${sanitizedId}`);
          await docRef.set(courseReviews);
          console.log(`Successfully added reviews for course: ${courseId}`);
        }
      } catch (error) {
        console.error(`Failed to process file ${file}:`, error);
      }
    }

    console.log('Review data imported successfully');
  } catch (error) {
    console.error('Error reading class data directory:', error);
  }
};

importData().catch(console.error);
