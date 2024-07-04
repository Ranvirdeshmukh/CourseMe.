const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../data/coursereview-98a89-firebase-adminsdk-2yc5i-6b25ddf051.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const sanitizeId = (id) => {
  return id.replace(/[^a-zA-Z0-9]/g, '_'); // Replace special characters with underscores
};

const importData = async () => {
  const classDataPath = path.join(__dirname, '../data/classData');
  const files = fs.readdirSync(classDataPath);

  for (const file of files) {
    const filePath = path.join(classDataPath, file);
    const reviewsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const courseId in reviewsData) {
      const sanitizedCourseId = sanitizeId(courseId); // Use full course ID without splitting
      const courseReviews = reviewsData[courseId];
      const docRef = db.collection('reviews').doc(sanitizedCourseId);
      await docRef.set(courseReviews);
    }
  }

  console.log('Review data imported successfully');
};

importData().catch(console.error);
