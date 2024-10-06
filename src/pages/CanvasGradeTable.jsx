import React, { useRef, useEffect } from 'react';
import { ReactComponent as VerifiedIconSVG } from '../verified.svg'; // Ensure this path is correct
import { renderToStaticMarkup } from 'react-dom/server';
import { useTheme } from '@mui/material/styles';

const CanvasGradeTable = ({ gradeData }) => {
  const canvasRef = useRef(null);
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Disable context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Set canvas size
    const tableWidth = 800;
    const rowHeight = 40;
    const headerHeight = 50;
    canvas.width = tableWidth * dpr;
    canvas.height = (gradeData.length * rowHeight + headerHeight) * dpr;
    canvas.style.width = `${tableWidth}px`;
    canvas.style.height = `${gradeData.length * rowHeight + headerHeight}px`;

    ctx.scale(dpr, dpr);

    // Set styles
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';

    // Draw table header
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, tableWidth, headerHeight);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Term', 20, 30);
    ctx.fillText('Median Grade', 200, 30);
    ctx.fillText('Professors', 400, 30);
    ctx.fillText('Verified', 700, 30);

    // Convert VerifiedIconSVG to an image with primary color
    const svgMarkup = renderToStaticMarkup(
      <VerifiedIconSVG style={{ fill: primaryColor }} />
    );
    const svgDataUri = `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`;
    const verifiedImage = new Image();
    verifiedImage.src = svgDataUri;

    const drawTableRows = () => {
      // Draw table rows
      gradeData
        .sort((a, b) => {
          const aYear = parseInt(a.Term.slice(0, 2));
          const bYear = parseInt(b.Term.slice(0, 2));
          if (aYear !== bYear) return bYear - aYear;
          const termOrder = { 'F': 0, 'X': 1, 'S': 2, 'W': 3 };
          return termOrder[a.Term.slice(2)] - termOrder[b.Term.slice(2)];
        })
        .forEach((item, index) => {
          const y = index * rowHeight + headerHeight;

          // Alternating row colors
          ctx.fillStyle = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
          ctx.fillRect(0, y, tableWidth, rowHeight);

          ctx.fillStyle = '#000';
          ctx.font = '14px Arial';
          ctx.fillText(item.Term || 'N/A', 20, y + 25);
          ctx.fillText(item.verified ? item.Grade : calculateMedianGrade(item.submissions), 200, y + 25);

          // Handling Professors
          const professors = item.Professors && item.Professors.length > 0
            ? item.Professors.join(', ')
            : 'N/A';
          ctx.fillText(professors, 400, y + 25);

          // Verified icon
          if (item.verified) {
            try {
              ctx.drawImage(verifiedImage, 715, y + 10, 20, 20);
            } catch (error) {
              console.error("Failed to draw verified icon", error);
            }
          }
        });

      // Draw table borders
      ctx.strokeStyle = '#e0e0e0';
      ctx.beginPath();
      for (let i = 0; i <= gradeData.length; i++) {
        const y = i * rowHeight + headerHeight;
        ctx.moveTo(0, y);
        ctx.lineTo(tableWidth, y);
      }
      ctx.moveTo(0, 0);
      ctx.lineTo(0, canvas.height);
      ctx.moveTo(180, 0);
      ctx.lineTo(180, canvas.height);
      ctx.moveTo(380, 0);
      ctx.lineTo(380, canvas.height);
      ctx.moveTo(680, 0);
      ctx.lineTo(680, canvas.height);
      ctx.moveTo(tableWidth, 0);
      ctx.lineTo(tableWidth, canvas.height);
      ctx.stroke();
    };

    verifiedImage.onload = drawTableRows;
    verifiedImage.onerror = (error) => {
      console.error("Failed to load verified icon image", error);
      drawTableRows();
    };

  }, [gradeData, primaryColor]);

  // Helper function to calculate median grade
  const gradeToNum = {
    'A': 11, 'A-': 10, 'A/A-': 10.5,
    'B+': 9, 'A-/B+': 9.5, 'B': 8, 'B+/B': 8.5, 'B-': 7, 'B/B-': 7.5,
    'C+': 6, 'B-/C+': 6.5, 'C': 5, 'C/C+': 5.5, 'C-': 4, 'C/C-': 4.5,
    'D+': 3, 'C-/D+': 3.5, 'D': 2, 'D+/D': 2.5, 'D-': 1, 'D/D-': 1.5,
    'F': 0
  };

  const numToGrade = Object.entries(gradeToNum)
    .reduce((acc, [grade, num]) => {
      acc[num] = grade;
      return acc;
    }, {});

  const calculateMedianGrade = (submissions) => {
    if (!submissions || submissions.length === 0) return 'N/A';

    // Convert grades to points using gradeToNum mapping
    const numericGrades = submissions.map(s => gradeToNum[s.Grade]).filter(g => g !== undefined);

    if (numericGrades.length === 0) return 'N/A'; // No valid grades

    // Sort numeric grades
    const sortedGrades = numericGrades.sort((a, b) => a - b);
    const mid = Math.floor(sortedGrades.length / 2);

    // Calculate median
    let median;
    if (sortedGrades.length % 2 === 0) {
      median = (sortedGrades[mid - 1] + sortedGrades[mid]) / 2;
    } else {
      median = sortedGrades[mid];
    }

    // Round median to the nearest valid grade
    const roundedMedian = Math.round(median * 2) / 2; // Round to the nearest 0.5
    return numToGrade[roundedMedian] || 'N/A'; // Return the corresponding grade or 'N/A'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas 
        ref={canvasRef} 
        style={{ maxWidth: '100%' }}
        aria-label="Grade distribution table"
      />
      <p style={{ fontSize: '0.7rem', fontStyle: 'italic', color: '#666', marginTop: '10px' }}>
        *Note: Verified data is shown with a checkmark icon.
      </p>
    </div>
  );
};

export default CanvasGradeTable;
