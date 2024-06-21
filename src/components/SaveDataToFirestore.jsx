import { useEffect, useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useGoogleSheets from '../hooks/useGoogleSheets';

const SaveDataToFirestore = () => {
  const { data, error } = useGoogleSheets();
  const [status, setStatus] = useState('');

  useEffect(() => {
    const saveData = async () => {
      if (data.length > 0) {
        try {
          for (const row of data) {
            await addDoc(collection(db, 'courses'), row);
          }
          setStatus('Data saved successfully!');
        } catch (error) {
          setStatus(`Error: ${error.message}`);
        }
      }
    };
    if (data.length > 0) {
      saveData();
    }
  }, [data]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{status}</div>;
};

export default SaveDataToFirestore;
