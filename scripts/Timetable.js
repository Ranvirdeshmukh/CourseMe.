const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../src/coursereview-98a89-firebase-adminsdk-2yc5i-f17bc2e8be.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Read the JSON file
const filePath = '../data/timetable.json';
const timetableData = JSON.parse(fs.readFileSync(filePath, 'utf8'));


async function uploadData() {
  for (const entry of timetableData) {
    const { Subj, Num, Section } = entry;

    // Create the document name
    let docName = `${Subj}${Num.replace('.', '')}`;
    if (Section && Section !== '01') {
      docName += `_${Section}`;
    }

    // Add the document to Firestore
    try {
      await db.collection('fallTimetable').doc(docName).set(entry);
      console.log(`Uploaded: ${docName}`);
    } catch (error) {
      console.error(`Error uploading ${docName}: `, error);
    }
  }
}

uploadData()
  .then(() => {
    console.log('Upload complete.');
  })
  .catch((error) => {
    console.error('Error in upload process:', error);
  });
