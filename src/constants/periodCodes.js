// src/constants/periodCodes.js
// Single source of truth for Dartmouth period code → timing mappings.
// Imported by: googleCalendarLogic, appleCalendarLogic, ScheduleVisualization, gcsTimetableService

export const periodCodeToTiming = {
  "11": "MWF 11:30-12:35, Tu 12:15-1:05",
  "10": "MWF 10:10-11:15, Th 12:15-1:05",
  "2": "MWF 2:10-3:15, Th 1:20-2:10",
  "3A": "MW 3:30-5:20, M 5:30-6:20",
  "12": "MWF 12:50-1:55, Tu 1:20-2:10",
  "2A": "TuTh 2:25-4:15, W 5:30-6:20",
  "10A": "TuTh 10:10-12, F 3:30-4:20",
  "FS": "FSP; Foreign Study Program",
  "ARR": "Arrange",
  "9L": "MWF 8:50-9:55, Th 9:05-9:55",
  "9S": "MTuWThF 9:05-9:55",
  "OT": "Th 2:00 PM-4:00 PM",
  "3B": "TuTh 4:30-6:20, F 4:35-5:25",
  "6A": "MTh 6:30-8:20, Tu 6:30-7:20",
  "6B": "W 6:30-9:30, Tu 7:30-8:20",
  "8S": "MTThF 7:45-8:35, Wed 7:45-8:35",
  "LSA": "Language Study Abroad",
};

// Helper: map termType to display name
export const formatTermName = (termType) => {
  switch (termType) {
    case 'summer': return 'Summer 2025';
    case 'winter': return 'Winter 2026';
    case 'spring': return 'Spring 2026';
    case 'fall': return 'Fall 2025';
    default: return 'Course';
  }
};

// Helper: map termType to Firestore courses collection/field name
export const getCoursesFieldName = (termType) => {
  switch (termType) {
    case 'summer': return 'summerCoursestaken';
    case 'winter': return 'winterCoursestaken';
    case 'fall': return 'fallCoursestaken';
    case 'spring':
    default: return 'springCoursestaken';
  }
};
