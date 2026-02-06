// Resolve modules from parent node_modules
require('./resolveParentModules');
const path = require('path');
const admin = require('firebase-admin');

// Use the correct file name
const serviceAccountPath = path.resolve(__dirname, '../src/coursereview-98a89-firebase-adminsdk-2yc5i-d54c9de59a.json');
const serviceAccount = require(serviceAccountPath);

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

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const distribs = data.distribs;
    const quality = data.quality;

    if (distribs !== undefined && quality !== undefined) {
      await doc.ref.update({
        distribs: quality,
        quality: distribs,
      });

      console.log(`Swapped fields for document ID: ${doc.id}`);
    } else {
      console.log(`Fields missing in document ID: ${doc.id}`);
    }
  }

  console.log('Field swap complete.');
}

swapFields().catch(console.error);
