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

  for (const department in coursesData) {
    if (department !== "Template") {
      const departmentCourses = coursesData[department];
      departmentCourses.forEach(course => {
        const courseId = sanitizeId(`${department}_${course["class name"]}`);
        const docRef = db.collection('courses').doc(courseId);
        batch.set(docRef, {
          department: department,
          name: course["class name"],
          distribs: course["distribs"],
          numOfReviews: course["num of reviews"],
          quality: course["quality"],
          layup: course["layup"]
        });
      });
    }
  }

  await batch.commit();
  console.log('Data imported successfully');
};

importData().catch(console.error);
