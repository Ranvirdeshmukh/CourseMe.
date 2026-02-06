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

async function deleteDescriptionField() {
  const coursesRef = db.collection('courses');
  const snapshot = await coursesRef.get();

  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.hasOwnProperty('description')) {
      await doc.ref.update({
        description: admin.firestore.FieldValue.delete(), // This deletes the field
      });

      console.log(`Deleted 'description' field for document ID: ${doc.id}`);
    } else {
      console.log(`No 'description' field in document ID: ${doc.id}`);
    }
  }

  console.log('Description field deletion complete.');
}

deleteDescriptionField().catch(console.error);
