import React, { useState } from 'react';
import { CheckSquare } from 'lucide-react';

const TranscriptParser = () => {
  const [transcriptText, setTranscriptText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [termInfo, setTermInfo] = useState(null);
  const [showPersonalData, setShowPersonalData] = useState(false);

  const parseTranscript = (transcript) => {
    const institutionCreditPattern = /INSTITUTION CREDIT.*?(?=TRANSCRIPT TOTALS|\Z)/s;
    const termPattern = /Term: ((?:Fall|Winter|Spring) Term \d{4})/g;
    const coursePattern = /(\w+)\s+([\d.]+(?:\.\d+)?)\s+UG\s+(.*?)\s+(\d+)\s+([A-Z][+-]?)\s+([A-Z][+-]?\*?)\s+/g;
    const termTotalsPattern = /Term Totals.*?Current Term:\s+[\d.]+\s+([\d.]+)\s+Cumulative:\s+[\d.]+\s+([\d.]+)/s;

    const institutionCreditSection = transcript.match(institutionCreditPattern);

    if (!institutionCreditSection) {
      return [[], {}];
    }

    const institutionCreditText = institutionCreditSection[0];
    const parsedData = [];
    const termInfo = {};

    const terms = institutionCreditText.split(termPattern).slice(1);

    for (let i = 0; i < terms.length; i += 2) {
      const currentTerm = terms[i];
      const termContent = terms[i + 1];

      let termCourseCount = 0;
      let courseMatch;
      while ((courseMatch = coursePattern.exec(termContent)) !== null) {
        const [, subject, number, title, enrollment, medianGrade, grade] = courseMatch;
        parsedData.push({
          term: currentTerm,
          course_code: `${subject} ${number.trim()}`,
          title: title.trim(),
          enrollment: parseInt(enrollment),
          median_grade: medianGrade,
          grade: grade.replace('*', '')
        });
        termCourseCount++;
      }

      const termTotalsMatch = termContent.match(termTotalsPattern);
      if (termTotalsMatch) {
        const [, termGPA, cumulativeGPA] = termTotalsMatch;
        termInfo[currentTerm] = {
          term_course_count: termCourseCount,
          term_gpa: parseFloat(termGPA),
          cumulative_course_count: Object.values(termInfo).reduce((sum, term) => sum + term.term_course_count, 0) + termCourseCount,
          cumulative_gpa: parseFloat(cumulativeGPA)
        };
      }
    }

    return [parsedData, termInfo];
  };
  const handleTextChange = (event) => {
    setTranscriptText(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const [parsed, termInfo] = parseTranscript(transcriptText);
    setParsedData(parsed);
    setTermInfo(termInfo);
  };

  const togglePersonalData = () => {
    setShowPersonalData(!showPersonalData);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Transcript Parser</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={transcriptText}
          onChange={handleTextChange}
          placeholder="Paste your transcript text here"
          className="w-full h-40 p-2 border rounded mb-2"
        />
        <div className="flex items-center mb-2">
          <button
            type="button"
            onClick={togglePersonalData}
            className="flex items-center mr-2 text-sm"
          >
            <CheckSquare
              className={`mr-1 ${showPersonalData ? 'text-blue-500' : 'text-gray-400'}`}
              size={20}
            />
            Only Process Median Information
          </button>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Parse Transcript
        </button>
      </form>
      {parsedData && termInfo && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Parsed Transcript Data</h2>
          <h3 className="text-lg font-semibold mb-2">Courses</h3>
          {parsedData.map((course, index) => (
            <div key={index} className="mb-2 p-2 border rounded">
              <p><strong>Term:</strong> {course.term}</p>
              <p><strong>Course:</strong> {course.course_code} - {course.title}</p>
              <p><strong>Enrollment:</strong> {course.enrollment}</p>
              <p><strong>Median Grade:</strong> {course.median_grade}</p>
              {showPersonalData && (
                <p><strong>Grade:</strong> {course.grade}</p>
              )}
            </div>
          ))}
          {showPersonalData && (
            <h3 className="text-lg font-semibold mt-4 mb-2">Term Information</h3>
          )}
          {showPersonalData && Object.entries(termInfo).map(([term, info], index) => (
            <div key={index} className="mb-2 p-2 border rounded">
              <p><strong>{term}</strong></p>
              <p>Term Course Count: {info.term_course_count}</p>
              <p>Term GPA: {info.term_gpa.toFixed(2)}</p>
              <p>Cumulative Course Count: {info.cumulative_course_count}</p>
              <p>Cumulative GPA: {info.cumulative_gpa.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptParser;