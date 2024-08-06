import React, { useState } from 'react';

const TranscriptProcessor = () => {
  const [transcript, setTranscript] = useState('');
  const [processedData, setProcessedData] = useState(null);

  const parseTranscript = (transcript) => {
    const institutionCreditPattern = /INSTITUTION CREDIT[\s\S]*?(?=TRANSCRIPT TOTALS|\Z)/;
    const termPattern = /Term: ((?:Fall|Winter|Spring) Term \d{4})/;
    const coursePattern = /(\w+)\s+([\d.]+(?:\.\d+)?)\s+UG\s+(.*?)\s+(\d+)\s+([A-Z][+-]?)\s+([A-Z][+-]?\*?)\s+/g;

    const institutionCreditSection = transcript.match(institutionCreditPattern);

    if (!institutionCreditSection) {
      return [];
    }

    const institutionCreditText = institutionCreditSection[0];
    const parsedData = [];
    const terms = institutionCreditText.split(termPattern).slice(1);

    for (let i = 0; i < terms.length; i += 2) {
      const currentTerm = terms[i];
      const termContent = terms[i + 1];
      let match;

      while ((match = coursePattern.exec(termContent)) !== null) {
        const [, subject, number, title, enrollment, medianGrade, grade] = match;
        parsedData.push({
          term: currentTerm,
          course_code: `${subject} ${number.trim()}`,
          title: title.trim(),
          enrollment: parseInt(enrollment),
          median_grade: medianGrade,
          grade: grade.replace('*', '')
        });
      }
    }

    return parsedData;
  };

  const handleTranscriptChange = (event) => {
    setTranscript(event.target.value);
  };

  const processTranscript = () => {
    if (!transcript.trim()) {
      alert('Please enter a transcript first.');
      return;
    }

    const parsed = parseTranscript(transcript);
    setProcessedData(parsed);
    uploadToWebsite(parsed);
  };

  const uploadToWebsite = (data) => {
    console.log('Uploading data to website:', data);
    // Work on adding storing data here
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Transcript Processor</h1>
      <textarea
        value={transcript}
        onChange={handleTranscriptChange}
        placeholder="Paste your transcript here..."
        className="w-full h-64 p-2 border rounded mb-4 font-mono text-sm"
      />
      <button
        onClick={processTranscript}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Process Transcript
      </button>
      {processedData && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Processed Data:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
            {JSON.stringify(processedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TranscriptProcessor;