import { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = '833763834416-es1a98aknmala95q5p3msjq3i3n0l94t.apps.googleusercontent.com';
const API_KEY = 'AIzaSyALoZ40yWor01LjjDl5AH1QvmuU8T1JzV0';
const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/1i_NDdqpUhaEedLqN75XKdmpCjTHr3y0-/edit?usp=sharing&ouid=112444726770937492372&rtpof=true&sd=true';
const RANGE = 'WRIT!A1:E1'; // Adjust range based on your data

const useGoogleSheets = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        gapi.load('client', () => {
          gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
          }).then(() => {
            gapi.client.sheets.spreadsheets.values.get({
              spreadsheetId: SPREADSHEET_ID,
              range: RANGE,
            }).then(response => {
              const data = response.result.values.map(row => ({
                className: row[0],
                numClassesOffered: parseInt(row[1], 10),
                numReviews: parseInt(row[2], 10),
                distributives: row[3],
                quality: parseFloat(row[4]),
              }));
              setData(data);
            }, error => {
              console.error('Error fetching data: ', error);
              setError(error);
            });
          });
        });
      } catch (error) {
        console.error('Error: ', error);
        setError(error);
      }
    };
    fetchData();
  }, []);

  return { data, error };
};

export default useGoogleSheets;