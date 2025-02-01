import React from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { Box, Typography } from '@mui/material';

// Grade conversion and color functions remain unchanged
const gradeToNum = {
  'A': 11, 'A-': 10, 'A/A-': 10.5,
  'B+': 9, 'A-/B+': 9.5, 'B': 8, 'B+/B': 8.5, 'B-': 7, 'B/B-': 7.5,
  'C+': 6, 'B-/C+': 6.5, 'C': 5, 'C/C+': 5.5, 'C-': 4, 'C/C-': 4.5,
  'D+': 3, 'C-/D+': 3.5, 'D': 2, 'D+/D': 2.5, 'D-': 1, 'D/D-': 1.5,
  'F': 0
};

const gradeToColor = (grade) => {
  const colors = {
    'A': '#3cb371', 'A-': '#66cdaa', 'A/A-': '#4fac8d',
    'B+': '#ffd700', 'A-/B+': '#e6d355', 'B': '#ff8c00', 'B+/B': '#ffaa33', 'B-': '#ff4500', 'B/B-': '#ff6633',
    'C+': '#ff6347', 'B-/C+': '#ff5423', 'C': '#ff4500', 'C+/C': '#ff5733', 'C-': '#ff0000', 'C/C-': '#ff3333',
    'D+': '#d32f2f', 'C-/D+': '#e13f3f', 'D': '#b71c1c', 'D+/D': '#c72c2c', 'D-': '#a00', 'D/D-': '#b33',
    'F': '#8b0000'
  };
  return colors[grade] || '#ccc';
};

// Custom box shape for bars (unchanged)
const CustomBox = (props) => {
  const { x, y, width, height, fill } = props;
  const boxWidth = 90;
  const boxHeight = 35;
  const yOffset = boxHeight / 2;
  return (
    <rect
      x={x + (width - boxWidth) / 2}
      y={y - yOffset}
      width={boxWidth}
      height={boxHeight}
      fill={fill}
      rx={12}
      ry={12}
    />
  );
};

// Helper function to convert term string to number for sorting
const termToNumber = (term) => {
  const year = parseInt(term.slice(0, 2));
  const season = term.slice(2);
  const seasonValue = { 'W': 0, 'S': 1, 'X': 2, 'F': 3 }[season] || 0;
  return year * 10 + seasonValue;
};

// Custom Tooltip component now accepts darkMode prop
const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: darkMode ? '#333' : '#fff',
          padding: '10px',
          border: `1px solid ${darkMode ? '#666' : '#ccc'}`,
          borderRadius: '4px'
        }}
      >
        <Typography variant="body2" sx={{ color: darkMode ? '#fff' : '#000' }}>
          <strong>Term:</strong> {data.term}
        </Typography>
        <Typography variant="body2" sx={{ color: darkMode ? '#fff' : '#000' }}>
          <strong>Median Grade:</strong> {data.grade}
        </Typography>
        <Typography variant="body2" sx={{ color: darkMode ? '#fff' : '#000' }}>
          <strong>Professor(s):</strong> {data.professors.join(', ') || 'N/A'}
        </Typography>
        <Typography variant="body2" sx={{ color: darkMode ? '#fff' : '#000' }}>
          <strong>Verified:</strong> {data.verified ? 'Yes' : 'No'}
        </Typography>
      </Box>
    );
  }
  return null;
};

const FloatingGradeChart = ({ gradeData, darkMode }) => {
  // Format and sort grade data
  const formattedGradeData = gradeData
    .map((entry) => ({
      term: entry.Term,
      grade: entry.Grade,
      verified: entry.verified,
      gradeValue: gradeToNum[entry.Grade],
      fill: gradeToColor(entry.Grade),
      sortValue: termToNumber(entry.Term),
      professors: Array.isArray(entry.Professors)
        ? entry.Professors
        : [entry.Professors].filter(Boolean)
    }))
    .sort((a, b) => a.sortValue - b.sortValue);

  const lowestGradeValue = Math.min(...formattedGradeData.map(item => item.gradeValue));
  const minYAxisValue = Math.min(lowestGradeValue, gradeToNum['B-']) - 0.5;
  const maxYAxisValue = gradeToNum['A'] + 0.5;
  const referenceGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

  // Define color variables based on darkMode
  const axisTickColor = darkMode ? '#E0E0E0' : '#8e8e8e';
  const gridStroke = darkMode ? '#444' : '#ccc';

  return (
    <Box sx={{ width: '100%', mt: 4, position: 'relative' }}>
      <Box sx={{ width: '100%', height: 300, mt: 2, overflow: 'visible' }}>
        <ResponsiveContainer>
          <BarChart 
            data={formattedGradeData} 
            barCategoryGap={40} 
            barSize={20}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="term"
              tick={{ fill: axisTickColor }}
              fontSize={14}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              type="number"
              domain={[minYAxisValue, maxYAxisValue]}
              ticks={[
                gradeToNum['B-'],
                gradeToNum['B'],
                gradeToNum['B+'],
                gradeToNum['A-'],
                gradeToNum['A']
              ]}
              tickFormatter={(tick) => {
                const gradeLabels = {
                  [gradeToNum['B-']]: 'B-',
                  [gradeToNum['B']]: 'B',
                  [gradeToNum['B+']]: 'B+',
                  [gradeToNum['A-']]: 'A-',
                  [gradeToNum['A']]: 'A'
                };
                return gradeLabels[tick];
              }}
              tick={{ fill: axisTickColor }}
              fontSize={14}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
            {referenceGrades.map((grade) => (
              <ReferenceLine
                key={grade}
                y={gradeToNum[grade]}
                stroke={gridStroke}
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            ))}
            <Bar
              dataKey="gradeValue"
              fill="#82ca9d"
              shape={(props) => <CustomBox {...props} grade={props.payload.grade} />}
              fillOpacity={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default FloatingGradeChart;
