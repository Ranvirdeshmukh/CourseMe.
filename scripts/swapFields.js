

const admin = require('firebase-admin');

// Replace this path with the path to your Firebase admin SDK JSON file
const serviceAccount = require('../data/coursereview-98a89-firebase-adminsdk-2yc5i-320058ff1a.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function swapFields() {
  const coursesRef = db.collection('courses');
  const snapshot = await coursesRef.get();

  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }

  snapshot.forEach(async (doc) => {
    const data = doc.data();
    const distribs = data.distribs;
    const quality = data.quality;

    // Check if the fields exist
    if (distribs !== undefined && quality !== undefined) {
      await doc.ref.update({
        distribs: quality,
        quality: distribs,
      });

      console.log(`Swapped fields for document ID: ${doc.id}`);
    } else {
      console.log(`Fields missing in document ID: ${doc.id}`);
    }
  });

  console.log('Field swap complete.');
}

swapFields().catch(console.error);
