const admin = require('firebase-admin');
const serviceAccount = require('../data/coursereview-98a89-firebase-adminsdk-2yc5i-6b25ddf051.json');
const coursesData = require('../data/courses.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const sanitizeId = (id) => {
  return id.replace(/[^a-zA-Z0-9]/g, '_'); // Replace special characters with underscores
};

const importData = async () => {
  const batch = db.batch();
  coursesData.forEach(course => {
    const docRef = db.collection('courses').doc(sanitizeId(course.name)); // Use sanitized course name as document ID
    batch.set(docRef, course);
  });
  await batch.commit();
  console.log('Data imported successfully');
};

importData().catch(console.error);
