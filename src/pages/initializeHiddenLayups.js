import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const hiddenLayupsCourses = [
  {
    id: 'COLT_COLT040_07__Video_Games_and_the_Meaning_of_Life',
    name: 'Video Games and the Meaning of Life',
    department: 'COLT'
  },
  {
    id: 'SOCY_SOCY001__Introduction_to_Sociology',
    name: 'Introduction to Sociology',
    department: 'SOCY'
  },
  {
    id: 'CRWT_CRWT010__Introduction_to_Creative_Writing',
    name: 'Introduction to Creative Writing',
    department: 'CRWT'
  }
];

export const initializeHiddenLayups = async () => {
  for (const course of hiddenLayupsCourses) {
    const courseRef = doc(db, 'hidden_layups', course.id);
    const courseDoc = await getDoc(courseRef);

    if (!courseDoc.exists()) {
      await setDoc(courseRef, {
        name: course.name,
        department: course.department,
        yes_count: 0,
        no_count: 0
      });
      console.log(`Added ${course.name} to hidden layups`);
    } else {
      console.log(`${course.name} already exists in hidden layups`);
    }
  }
};