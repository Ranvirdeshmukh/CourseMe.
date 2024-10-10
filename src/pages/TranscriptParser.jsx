import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust this import based on your Firebase setup
import { useAuth } from '../contexts/AuthContext'; // Adjust this import based on your auth setup

const TranscriptParser = () => {
  const [transcriptText, setTranscriptText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [verifiedCourses, setVerifiedCourses] = useState([]);

  const formatTerm = (term) => {
    const termMap = {
      'Fall Term': 'F',
      'Winter Term': 'W',
      'Spring Term': 'S',
      'Summer Term': 'X'
    };
    const [, season, year] = term.match(/(\w+) Term (\d{4})/);
    return `${year.slice(-2)}${termMap[season + ' Term']}`;
  };

  const parseTranscript = (transcript) => {
    const institutionCreditPattern = /INSTITUTION CREDIT.*?(?=TRANSCRIPT TOTALS|\Z)/s;
    const termPattern = /Term: ((?:Fall|Winter|Spring) Term \d{4})/g;
    const coursePattern = /(\w+)\s+([\d.]+(?:\.\d+)?)\s+UG\s+(.*?)\s+(\d+)\s+([A-Z][+-]?)\s+([A-Z][+-]?\*?)?\s+/g;
  
    const institutionCreditSection = transcript.match(institutionCreditPattern);
  
    if (!institutionCreditSection) {
      return [];
    }
  
    const institutionCreditText = institutionCreditSection[0];
    const parsedCourses = [];
    
    const terms = institutionCreditText.split(termPattern).slice(1);

    for (let i = 0; i < terms.length; i += 2) {
      const currentTerm = formatTerm(terms[i]);
      const termContent = terms[i + 1];

      let courseMatch;
      while ((courseMatch = coursePattern.exec(termContent)) !== null) {
        const [, subject, number, title, enrollment, medianGrade, userGrade] = courseMatch;
        parsedCourses.push({
          term: currentTerm,
          department: subject,
          number: formatCourseNumber(number),
          title: title.trim(),
          enrollment: parseInt(enrollment),
          median_grade: medianGrade,
          user_grade: userGrade ? userGrade.replace('*', '').trim() : null
        });
      }
    }

    return parsedCourses;
  };

  

  const formatCourseNumber = (number) => {
    const [integerPart, decimalPart] = number.split('.');
    const paddedIntegerPart = integerPart.padStart(3, '0');
    return decimalPart ? `${paddedIntegerPart}.${decimalPart}` : paddedIntegerPart;
  };


  const handleTextChange = async (event) => {
    const text = event.target.value;
    setTranscriptText(text);
    if (text) {
      const parsed = parseTranscript(text);
      await checkCoursesStatus(parsed);
    }
  };

  useEffect(() => {
    if (transcriptText) {
      const parsed = parseTranscript(transcriptText);
      setParsedData(parsed);
    }
  }, [transcriptText]);

  const checkCoursesStatus = async (courses) => {
    if (!currentUser) {
      setError('You must be logged in to submit grade data.');
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.exists() ? userDocSnap.data() : {};
    const userSubmissions = userData.gradeSubmissions || [];
    setUserSubmissions(userSubmissions);

    const checkedCourses = await Promise.all(courses.map(async (course) => {
      const coursesRef = collection(db, 'courses');
      const q = query(
        coursesRef, 
        where("department", "==", course.department),
        where("course_number", "==", course.number)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const courseDoc = querySnapshot.docs[0];
        const courseData = courseDoc.data();
        const existingMedian = courseData.medians?.find(m => m.Term === course.term);

        const isSubmitted = userSubmissions.some(
          sub => sub.courseId === courseDoc.id && sub.Term === course.term
        );

        const isVerified = existingMedian && existingMedian.verified;

        return {
          ...course,
          status: isVerified ? 'verified' : (isSubmitted ? 'submitted' : 'new'),
          courseId: courseDoc.id
        };
      }

      return { ...course, status: 'not_found' };
    }));

    setParsedData(checkedCourses);
    setLoading(false);
  };

  const uploadToFirebase = async () => {
    setLoading(true);
    setUploadStatus('Uploading data...');
    let successCount = 0;
    let failCount = 0;

    const coursesToUpload = parsedData.filter(course => course.status === 'new');

    for (const course of coursesToUpload) {
      try {
        const courseDocRef = doc(db, 'courses', course.courseId);
        const courseDocSnap = await getDoc(courseDocRef);
        const courseData = courseDocSnap.data();

        const newSubmission = {
          Grade: course.median_grade,
          timestamp: new Date().toISOString(),
          userId: currentUser.uid
        };

        const existingMedian = courseData.medians?.find(m => m.Term === course.term);

        if (existingMedian) {
          // Update existing unverified median
          const updatedMedians = courseData.medians.map(m => 
            m.Term === course.term 
              ? { 
                  ...m, 
                  submissions: [...m.submissions, newSubmission],
                  Professors: [...new Set([...m.Professors])] // No professors in transcript data
                }
              : m
          );

          await updateDoc(courseDocRef, { medians: updatedMedians });
        } else {
          // Add new unverified median
          await updateDoc(courseDocRef, {
            medians: arrayUnion({
              Term: course.term,
              Professors: [],
              verified: false,
              submissions: [newSubmission]
            })
          });
        }

        // Add user submission
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          gradeSubmissions: arrayUnion({
            courseId: course.courseId,
            Term: course.term,
            Professors: [],
            Grade: course.median_grade,
            timestamp: new Date().toISOString()
          })
        });

        successCount++;
      } catch (error) {
        failCount++;
        console.error('Error uploading course data:', error);
      }
    }

    setLoading(false);
    setUploadStatus(`Upload complete. Success: ${successCount}, Failed: ${failCount}`);
    
    // Update the status of successfully uploaded courses
    setParsedData(prevData => 
      prevData.map(course => 
        coursesToUpload.some(uploadedCourse => 
          uploadedCourse.courseId === course.courseId && uploadedCourse.term === course.term
        ) 
          ? { ...course, status: 'uploaded' } 
          : course
      )
    );

    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await uploadToFirebase();
  };
  const getCourseRowStyle = (status) => {
    switch (status) {
      case 'verified':
        return { backgroundColor: '#e0f2f1', color: '#00695c' };
      case 'submitted':
        return { backgroundColor: '#f0f4c3', color: '#827717' };
      case 'uploaded':
        return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case 'not_found':
        return { backgroundColor: '#ffcdd2', color: '#b71c1c' };
      default:
        return {};
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: '"Poppins", sans-serif',
      padding: '20px',
      width: '95%', // Take up most of the screen width
      maxWidth: '1400px', // Set a max width to prevent excessive stretching on very wide screens
      margin: '0 auto', // Center the container
    },
    textBox: {
      width: '100%', // Take full width of the container
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e0e0e0',
      backgroundColor: '#ffffff',
      transition: 'box-shadow 0.3s ease',
      overflow: 'hidden', // Prevent content from spilling out
    },
    input: {
      width: '100%',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      padding: '15px',
      fontSize: '16px',
      outline: 'none',
      transition: 'border 0.3s ease',
      height: '100px',
      resize: 'none',
      fontFamily: '"Poppins", sans-serif',
      boxSizing: 'border-box', // Include padding in width calculation
    },
    inputFocus: {
      border: '1px solid #6200ea',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      marginTop: '10px',
    },
    button: {
      backgroundColor: '#6200ea',
      color: 'white',
      borderRadius: '8px',
      padding: '10px 20px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
      fontWeight: 'bold',
      width: 'auto', // Allow button to shrink
      minWidth: '120px', // Set a minimum width
    },
    buttonDisabled: {
      backgroundColor: '#9e9e9e',
    },
    footer: {
      marginTop: '20px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#6b7280',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px',
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      fontWeight: '600',
      textTransform: 'uppercase',
      fontSize: '0.75rem',
      letterSpacing: '0.05em',
      borderBottom: '2px solid #e5e7eb',
    },
    td: {
      padding: '12px 16px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
    },
    tr: {
      transition: 'all 0.2s',
    },
    trHover: {
      backgroundColor: '#f9fafb',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.textBox} className="p-6 mb-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Transcript Parser</h1>
        <p className="text-gray-600 mb-4">
          To get online transcript, go to DartHub, go under Unofficial Transcript - Web, select all, copy and paste here. 
          (or start from INSTITUTION CREDIT to TRANSCRIPT TOTALS).
        </p>
        <p className="text-gray-600 mb-4">
          All processing happens on your device. The only data that is uploaded is what is displayed in the table.
        </p>
        
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex flex-col">
            <textarea
              value={transcriptText}
              onChange={handleTextChange}
              placeholder="Paste your transcript text here..."
              style={styles.input}
              onFocus={(e) => (e.target.style.border = styles.inputFocus.border)}
              onBlur={(e) => (e.target.style.border = '1px solid #e0e0e0')}
            />
            <div style={styles.buttonContainer}>
              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </form>

        {uploadStatus && (
          <div className="text-center mt-4">
            <p className="text-green-600 font-semibold">{uploadStatus}</p>
          </div>
        )}

        {parsedData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Parsed Transcript Data</h2>
            <h8 className="text-2xl font-semibold mb-6 text-gray-800">This is the data that will be uploaded</h8>
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Courses</h3>
              <div className="overflow-x-auto">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Term</th>
                      <th style={styles.th}>Department</th>
                      <th style={styles.th}>Number</th>
                      <th style={styles.th}>Title</th>
                      <th style={styles.th}>Enrollment</th>
                      <th style={styles.th}>Median Grade</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((course, index) => (
                      <tr
                        key={index}
                        style={{...styles.tr, ...getCourseRowStyle(course.status)}}
                      >
                        <td style={styles.td}>{course.term}</td>
                        <td style={styles.td}>{course.department}</td>
                        <td style={styles.td}>{course.number}</td>
                        <td style={styles.td}>{course.title}</td>
                        <td style={styles.td}>{course.enrollment}</td>
                        <td style={styles.td}>{course.median_grade}</td>
                        <td style={styles.td}>{course.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Legend:</h4>
              <ul>
                <li><span style={{color: '#00695c'}}>■</span> Verified: Course data is already verified</li>
                <li><span style={{color: '#827717'}}>■</span> Submitted: You have already submitted data for this course</li>
                <li><span style={{color: '#2e7d32'}}>■</span> Uploaded: Successfully uploaded in this session</li>
                <li><span style={{color: '#b71c1c'}}>■</span> Not Found: Course not found in the database</li>
                <li>White: New course data ready to be submitted</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptParser;