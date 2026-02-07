import moment from 'moment-timezone';

// Period code to timing mapping - Summer term might have different formats for some periods
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
  // Add any Summer-specific period codes here if needed
};

/**
 * Add a course to Google Calendar with proper handling of regular and X-hour meetings
 * @param {Object} course - The course object with period, title, instructor, building, room
 * @param {Function} onMultipleEvents - Callback when multiple events are detected
 * @param {Function} onPopupBlocked - Callback when popup is blocked
 * @param {Function} setTimeout - The setTimeout function (passed to make testing easier)
 * @param {string} termType - The current term type ('summer', 'fall', or 'winter')
 */
export const addToGoogleCalendar = (course, onMultipleEvents, onPopupBlocked, setTimeout, termType = 'winter') => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const details = `&details=${encodeURIComponent(`Instructor: ${course.instructor}`)}`;
  const location = `&location=${encodeURIComponent(`${course.building}, ${course.room}`)}`;

  // Determine the term from the termType parameter (more reliable than course.term)
  const events = getEventTiming(course.period, course.title, course.subj, course.num, termType);
  
  if (events.length === 0) {
    alert('No valid meeting times found for this course.');
    return;
  }

  // Display a message to the user about allowing popups
  if (events.length > 1) {
    // Show a message that we're adding multiple events
    onMultipleEvents();
    setTimeout(() => onMultipleEvents(false), 7000);
  }
  
  // Function to open window with delay
  const openCalendarWindow = (index) => {
    if (index >= events.length) return;
    
    const event = events[index];
    const text = `&text=${encodeURIComponent(event.title)}`;
    const startDateTime = `&dates=${event.startDateTime}/${event.endDateTime}`;
    const recur = event.recurrence ? `&recur=${encodeURIComponent(event.recurrence)}` : ''; 

    const url = `${baseUrl}${text}${details}${location}${startDateTime}${recur}&sf=true&output=xml`;
    
    // Use a user interaction (setTimeout) to help bypass popup blockers
    setTimeout(() => {
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        onPopupBlocked();
        // Stop trying if blocked
        return;
      }
      
      // Continue with next event after a delay
      setTimeout(() => openCalendarWindow(index + 1), 1500);
    }, 100);
  };
  
  // Start the sequential opening process
  openCalendarWindow(0);
};

/**
 * Parse course period code and generate Google Calendar events
 * @param {string} periodCode - The course period code (e.g., "11", "10A")
 * @param {string} courseTitle - The title of the course
 * @param {string} subj - The course subject code (e.g., "AAAS")
 * @param {string} num - The course number (e.g., "23")
 * @param {string} termType - The term type ('summer', 'fall', or 'winter')
 * @returns {Array} - Array of event objects ready for Google Calendar
 */
const getEventTiming = (periodCode, courseTitle, subj, num, termType = 'fall') => {
  const timing = periodCodeToTiming[periodCode];
  if (!timing) return [];

  // Use different date ranges depending on the term
  // Summer 2025: June 26 - September 2
  // Fall 2025: September 12 - November 26
  // Winter 2026: January 6 - March 11
  let eventStartDate, eventEndDate;
  
  if (termType === 'summer') {
    eventStartDate = '20250626';
    eventEndDate = '20250902';
  } else if (termType === 'winter') {
    eventStartDate = '20260106';
    eventEndDate = '20260311';
  } else if (termType === 'spring') {
    eventStartDate = '20260325';
    eventEndDate = '20260603';
  } else { // fall
    eventStartDate = '20250912';
    eventEndDate = '20251126';
  }
  
  const timezone = 'America/New_York';
  const baseStartDate = moment.tz(eventStartDate, 'YYYYMMDD', timezone);
  
  // Create full course name with subject and number
  const fullCourseName = `${subj}: ${num} ${courseTitle}`;
  
  // Split by comma to handle different meeting patterns (regular vs. X-hour)
  const timingParts = timing.split(', ');
  const events = [];

  // Process each meeting pattern separately (regular meeting vs. X-hour)
  timingParts.forEach((part, index) => {
    const [days, times] = part.trim().split(' '); 
    const [startTime, endTime] = times.split('-');
    
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
  });

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
  let [hour, minute] = timeStr.split(':').map(Number);

  if (hour >= 1 && hour <= 6) {
    hour += 12;
  }

  if (hour === 12 && timeStr.includes('12:')) {
    hour = 12;
  }

  return moment.tz(`${date} ${hour}:${minute}`, 'YYYYMMDD HH:mm', timezone);
};

/**
 * Create a recurrence rule for Google Calendar
 * @param {string} days - String representing days of the week (e.g., "MWF", "TuTh")
 * @param {string} endDate - End date in YYYYMMDD format
 * @returns {string} - RRULE recurrence string for Google Calendar
 */
const createRecurrenceRule = (days, endDate) => {
  const dayMap = {
    M: 'MO',
    T: 'TU',
    W: 'WE',
    Th: 'TH',
    F: 'FR',
    S: 'SA',
    Su: 'SU',
  };

  const dayPattern = /(Th|Su|M|T|W|F|S)/g;
  const matchedDays = days.match(dayPattern);

  if (!matchedDays) {
    console.error('Invalid day format:', days);
    return '';
  }

  const dayList = matchedDays.map((day) => dayMap[day]).join(',');

  return `RRULE:FREQ=WEEKLY;BYDAY=${dayList};UNTIL=${endDate}T235959Z`;
}; 