import moment from 'moment-timezone';
import { periodCodeToTiming } from './googleCalendarLogic';

/**
 * Creates and downloads an iCalendar (.ics) file for Apple Calendar
 * @param {Object} course - The course object with period, title, instructor, building, room
 */
export const addToAppleCalendar = (course) => {
  console.log('Adding to Apple Calendar, course data:', course);
  console.log('Period code:', course.period);
  console.log('Available period mappings:', Object.keys(periodCodeToTiming));
  
  // Check if course.period exists and is a valid key
  if (!course.period) {
    alert('This course does not have a valid period code.');
    return;
  }
  
  // Determine the term from the course object
  const isSummer = course.term && course.term.toLowerCase().includes('summer');
  const events = getEventTiming(course.period, course.title, course.subj, course.num, isSummer);
  console.log('Generated events:', events);
  
  if (events.length === 0) {
    alert('No valid meeting times found for this course.');
    return;
  }

  // Generate iCalendar content
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CourseMe//Dartmouth Course Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n');

  // Add each event to the calendar
  events.forEach(event => {
    // Generate a UUID for this event
    const uuid = generateUUID();
    const now = moment().utc().format('YYYYMMDDTHHmmss') + 'Z';
    
    icsContent += [
      '\r\nBEGIN:VEVENT',
      `UID:${uuid}@courseme.dartmouth.edu`,
      `DTSTAMP:${now}`,
      `DTSTART:${event.startDateTime}`,
      `DTEND:${event.endDateTime}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(`Instructor: ${course.instructor || 'TBD'}`)}`,
      `LOCATION:${escapeIcsText(`${course.building || 'TBD'}, ${course.room || 'TBD'}`)}`
    ].join('\r\n');
    
    // Only add RRULE if it exists
    if (event.recurrence) {
      icsContent += `\r\n${event.recurrence}`;
    }
    
    icsContent += '\r\nEND:VEVENT';
  });

  // Close the calendar
  icsContent += '\r\nEND:VCALENDAR';

  console.log('Generated iCalendar content:', icsContent);

  // Create and download the file
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${course.subj}${course.num}_Section${course.sec}.ics`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 100);
};

/**
 * Escape special characters in text for iCalendar format
 * @param {string} text - The text to escape
 * @returns {string} - Escaped text
 */
const escapeIcsText = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Generate a UUID v4 for iCalendar events
 * @returns {string} - A UUID string
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Parse course period code and generate calendar events
 * @param {string} periodCode - The course period code (e.g., "11", "10A")
 * @param {string} courseTitle - The title of the course
 * @param {string} subj - The course subject code (e.g., "AAAS")
 * @param {string} num - The course number (e.g., "23")
 * @param {boolean} isSummer - Whether the course is in the summer term
 * @returns {Array} - Array of event objects ready for iCalendar
 */
const getEventTiming = (periodCode, courseTitle, subj, num, isSummer = true) => {
  console.log(`Getting timing for period ${periodCode}, title: ${courseTitle}, term: ${isSummer ? 'Summer' : 'Fall'}`);
  
  // Handle case when periodCode is not in the mapping
  const timing = periodCodeToTiming[periodCode];
  if (!timing) {
    console.error(`No timing found for period code: ${periodCode}`);
    return [];
  }
  
  console.log(`Found timing: ${timing}`);

  // Use different date ranges depending on the term
  // Summer 2025: June 26 - September 2
  // Fall 2025: September 15 - November 21
  const eventStartDate = isSummer ? '20250626' : '20250915'; // Summer or Fall start date
  const eventEndDate = isSummer ? '20250902' : '20251121'; // Summer or Fall end date
  
  const timezone = 'America/New_York';
  const baseStartDate = moment.tz(eventStartDate, 'YYYYMMDD', timezone);
  
  // Create full course name with subject and number
  const fullCourseName = `${subj}: ${num} ${courseTitle}`;
  
  // Special case handling for 'ARR' and 'FS'
  if (periodCode === 'ARR' || periodCode === 'FS') {
    console.log(`Special case handling for ${periodCode}`);
    // For arranged courses or foreign study, create a single all-day event
    const startDateTime = moment.tz(eventStartDate, 'YYYYMMDD', timezone).format('YYYYMMDD');
    const endDateTime = moment.tz(eventEndDate, 'YYYYMMDD', timezone).format('YYYYMMDD');
    
    return [{
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      title: `${fullCourseName} (${timing})`,
      recurrence: ''  // No recurrence for these special cases
    }];
  }
  
  // Split by comma to handle different meeting patterns (regular vs. X-hour)
  const timingParts = timing.split(', ');
  console.log(`Timing parts:`, timingParts);
  const events = [];

  // Process each meeting pattern separately (regular meeting vs. X-hour)
  timingParts.forEach((part, index) => {
    try {
      console.log(`Processing timing part: ${part}`);
      // Handle special format cases
      if (!part.includes(' ')) {
        console.error(`Invalid timing format: ${part}`);
        return;
      }
      
      const [days, times] = part.trim().split(' '); 
      if (!times || !times.includes('-')) {
        console.error(`Invalid time format: ${times}`);
        return;
      }
      
      const [startTime, endTime] = times.split('-');
      console.log(`Days: ${days}, Start time: ${startTime}, End time: ${endTime}`);
      
      // Check if this is an X-hour (typically the second part and contains "Tu" or "Th")
      const isXHour = index > 0;
      
      if (isXHour) {
        // Special handling for X-hours to ensure they're on the correct day
        // Extract day pattern for X-hour (typically Tu or Th)
        const dayPattern = /(Th|Tu|Su|M|W|F|S)/g;
        const matchedDays = days.match(dayPattern);
        
        if (!matchedDays) {
          console.error('Invalid day format for X-hour:', days);
          return;
        }
        
        // Map day codes to moment.js day numbers (0=Sunday, 1=Monday, etc.)
        const dayToMomentDay = {
          'M': 1, 'Tu': 2, 'W': 3, 'Th': 4, 'F': 5, 'S': 6, 'Su': 0
        };
        
        // For each day in the X-hour pattern, create a separate event
        matchedDays.forEach(day => {
          // Get the moment.js day number
          const targetDayNum = dayToMomentDay[day];
          
          if (targetDayNum === undefined) {
            console.error('Unknown day format:', day);
            return;
          }
          
          // Calculate the correct start date for this X-hour
          const correctStartDate = baseStartDate.clone();
          const baseDayNum = correctStartDate.day(); // 0-6, Sunday-Saturday
          
          // Calculate days to add to get from Monday to the target day
          const daysToAdd = (targetDayNum - baseDayNum + 7) % 7;
          correctStartDate.add(daysToAdd, 'days');
          
          // Format date for this specific day
          const xHourStartDate = correctStartDate.format('YYYYMMDD');
          
          // Parse times with the correct date
          const startMoment = parseTime(xHourStartDate, startTime, timezone);
          const endMoment = parseTime(xHourStartDate, endTime, timezone);
          
          const startDateTime = startMoment.format('YYYYMMDDTHHmmssZ');
          const endDateTime = endMoment.format('YYYYMMDDTHHmmssZ');
          
          // X-hour recurrence rule (just for this specific day)
          const recurrence = `RRULE:FREQ=WEEKLY;BYDAY=${dayToRruleDay(day)};UNTIL=${eventEndDate}T235959Z`;
          
          // Special title for X-hour with full course name
          const eventTitle = `${fullCourseName} (X-hour: ${day} ${startTime}-${endTime})`;
          
          events.push({
            startDateTime,
            endDateTime,
            recurrence,
            title: eventTitle,
          });
        });
      } else {
        // Original code for regular meeting patterns
        const startMoment = parseTime(eventStartDate, startTime, timezone);
        const endMoment = parseTime(eventStartDate, endTime, timezone);
        
        const startDateTime = startMoment.format('YYYYMMDDTHHmmssZ');
        const endDateTime = endMoment.format('YYYYMMDDTHHmmssZ');
        
        const recurrence = createRecurrenceRule(days, eventEndDate);
        
        const eventTitle = `${fullCourseName} (${days} ${startTime}-${endTime})`;
        
        events.push({
          startDateTime,
          endDateTime,
          recurrence,
          title: eventTitle,
        });
      }
    } catch (error) {
      console.error(`Error processing timing part ${part}:`, error);
    }
  });

  console.log(`Generated ${events.length} events`);
  return events;
};

/**
 * Convert day format (M, Tu, W, etc.) to RRULE format (MO, TU, WE, etc.)
 * @param {string} day - The day abbreviation
 * @returns {string} - The RRULE day format
 */
const dayToRruleDay = (day) => {
  const mapping = {
    'M': 'MO',
    'Tu': 'TU',
    'W': 'WE',
    'Th': 'TH',
    'F': 'FR',
    'S': 'SA',
    'Su': 'SU',
  };
  return mapping[day] || '';
};

/**
 * Parse time string into a moment object
 * @param {string} date - The date in YYYYMMDD format
 * @param {string} timeStr - The time string (e.g., "10:10", "1:05")
 * @param {string} timezone - The timezone to use
 * @returns {Object} - A moment object representing the date and time
 */
const parseTime = (date, timeStr, timezone) => {
  try {
    if (!timeStr || !timeStr.includes(':')) {
      console.error(`Invalid time string: ${timeStr}`);
      // Default to noon if time is invalid
      return moment.tz(`${date} 12:00`, 'YYYYMMDD HH:mm', timezone);
    }
    
    let [hour, minute] = timeStr.split(':').map(Number);
    
    // Handle PM times (1:00-6:59)
    if (hour >= 1 && hour <= 6) {
      hour += 12;
    }
    
    // Special case for 12 noon
    if (hour === 12 && timeStr.includes('12:')) {
      hour = 12;
    }
    
    console.log(`Parsed time: ${date} ${hour}:${minute}`);
    return moment.tz(`${date} ${hour}:${minute}`, 'YYYYMMDD HH:mm', timezone);
  } catch (error) {
    console.error(`Error parsing time ${timeStr}:`, error);
    // Return default time
    return moment.tz(`${date} 12:00`, 'YYYYMMDD HH:mm', timezone);
  }
};

/**
 * Create a recurrence rule for iCalendar
 * @param {string} days - String representing days of the week (e.g., "MWF", "TuTh")
 * @param {string} endDate - End date in YYYYMMDD format
 * @returns {string} - RRULE recurrence string for iCalendar
 */
const createRecurrenceRule = (days, endDate) => {
  const dayMap = {
    M: 'MO',
    Tu: 'TU',
    W: 'WE',
    Th: 'TH',
    F: 'FR',
    S: 'SA',
    Su: 'SU',
  };

  const dayPattern = /(Th|Tu|Su|M|W|F|S)/g;
  const matchedDays = days.match(dayPattern);

  if (!matchedDays) {
    console.error('Invalid day format:', days);
    return '';
  }

  const dayList = matchedDays.map((day) => dayMap[day]).join(',');

  return `RRULE:FREQ=WEEKLY;BYDAY=${dayList};UNTIL=${endDate}T235959Z`;
}; 