import React, { useState, useEffect } from 'react';
import { CheckSquare, Upload, Shield, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TranscriptParser = () => {
  const [transcriptText, setTranscriptText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [termInfo, setTermInfo] = useState(null);
  const [showPersonalData, setShowPersonalData] = useState(false);
  const [loading, setLoading] = useState(false);


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

  useEffect(() => {
    if (transcriptText) {
      const [parsed, termInfo] = parseTranscript(transcriptText);
      setParsedData(parsed);
      setTermInfo(termInfo);
    }
  }, [transcriptText]);

  const togglePersonalData = () => {
    setShowPersonalData(!showPersonalData);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    // Simulate processing time
    setTimeout(() => {
      const [parsed, termInfo] = parseTranscript(transcriptText);
      setParsedData(parsed);
      setTermInfo(termInfo);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 text-gray-800 font-sans p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Transcript Parser</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4 text-gray-600">
            <Shield className="mr-2" size={20} />
            <p>All processing happens on your device. Your data remains private and secure.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex justify-center items-center">
              <div className="relative w-full md:w-2/3">
                <textarea
                  value={transcriptText}
                  onChange={handleTextChange}
                  placeholder="Paste your transcript text here..."
                  className="w-full py-3 px-4 bg-gray-100 rounded-full pl-12 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
                  style={{height: '50px', resize: 'none', overflowY: 'hidden'}}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black text-white rounded-full px-4 py-1 text-sm font-bold hover:bg-gray-800 transition-colors duration-300"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Parse'}
                </button>
              </div>
            </div>
          </form>
          
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <div
              onClick={() => setShowPersonalData(!showPersonalData)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition-colors duration-300 cursor-pointer ${
                showPersonalData ? 'border-2 border-blue-500 text-blue-500' : 'border border-gray-300 text-gray-700'
              }`}
            >
              <CheckSquare className={`mr-2 h-4 w-4 ${showPersonalData ? 'text-blue-500' : 'text-gray-400'}`} />
              Only Process Median Information
            </div>
            
            {/* Add more feature boxes here, similar to the landing page */}
            <div className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-300 cursor-pointer">
              <Upload className="mr-2 h-4 w-4 text-gray-400" />
              Upload Transcript
            </div>
            
            {/* Add more boxes as needed */}
          </div>
        </div>
        
        {parsedData && termInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Parsed Transcript Data</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Courses</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  {/* ... [Keep the existing table structure] */}
                </table>
              </div>
            </div>

            {showPersonalData && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Term Information</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    {/* ... [Keep the existing table structure] */}
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-8 text-center">
        <p className="text-sm text-gray-500">© 2024 CourseMe. All Rights Reserved.</p>
        <p className="text-sm text-gray-500 mt-1">Built with 💚 in Dartmouth Dorms, just for you.</p>
      </footer>
    </div>
  );
};

export default TranscriptParser;