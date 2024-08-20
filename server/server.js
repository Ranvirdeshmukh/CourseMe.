require('dotenv').config();
const path = require('path');
const express = require('express');
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');
const fs = require('fs');


// Initialize Firebase Admin SDK

const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1); // Exit the process with a failure code
}


const db = admin.firestore();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 500 // Change to a different port number




// Enable CORS
app.use(cors());

// Initialize Cache
const cache = new NodeCache({ stdTTL: 3600 }); // Cache TTL (time-to-live) set to 1 hour

app.get('/', (req, res) => {
  res.send('CourseMe API is running.');
});

// Function to send email notifications
const sendEmailNotification = async (email, course) => {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: '"CourseMe Notifications" <no-reply@example.com>',
      to: email,
      subject: 'Course Availability Alert',
      text: `A spot has opened up in the course: ${course.title} (${course.subj} ${course.num}). Enrollment: ${course.enrl}/${course.lim}`,
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to fetch the latest course data from the timetable
const fetchCourseData = async (courseName, courseNum) => {
  let browser;
  try {
    console.log("Launching Puppeteer...");
    console.log("CHROME_BIN:", process.env.CHROME_BIN);
    const fs = require('fs');
console.log("Chrome exists:", fs.existsSync(process.env.CHROME_BIN));
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
      ignoreHTTPSErrors: true,
      dumpio: true // This will pipe console messages from the browser
    });
    
    

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(120000);

    console.log("Navigating to timetable page...");
    await page.goto('https://oracle-www.dartmouth.edu/dart/groucho/timetable.main', { waitUntil: 'domcontentloaded' });

    console.log("Clicking 'Subject Area(s)' button...");
    await page.waitForSelector('input[value="Subject Area(s)"]', { visible: true, timeout: 30000 });
    await page.click('input[value="Subject Area(s)"]');

    console.log("Waiting for navigation...");
    await page.waitForSelector('input[value="202409"]', { visible: true, timeout: 60000 });

    console.log("Selecting 'Fall Term 2024'...");
    await page.click('input[value="202409"]');

    console.log("Selecting 'All Subjects'...");
    await page.evaluate(() => {
      const allSubjectsInput = document.querySelector('input[value="All"]');
      if (allSubjectsInput) {
        allSubjectsInput.click();
      }
    });

    console.log("Selecting 'All Periods'...");
    await page.evaluate(() => {
      const allPeriodsInput = document.querySelectorAll('input[value="All"]');
      if (allPeriodsInput[1]) {
        allPeriodsInput[1].click();
      }
    });

    console.log("Selecting 'Course, Term, Time' sort order...");
    await page.evaluate(() => {
      const sortOrderInput = document.querySelector('input[value="C"]');
      if (sortOrderInput) {
        sortOrderInput.click();
      }
    });

    console.log("Clicking 'Search for Courses' button...");
    await page.evaluate(() => {
      const searchButton = document.querySelector('input[type="submit"][value="Search for Courses"]');
      if (searchButton) {
        searchButton.click();
      }
    });

    console.log("Waiting for results...");
    await page.waitForSelector('table tbody tr', { visible: true, timeout: 120000 });

    console.log("Capturing page content...");
    const content = await page.content();
    const $ = cheerio.load(content);

    console.log("Extracting specific course data...");
    let courseData;
    $('table tbody tr').each((index, element) => {
      const courseDataColumns = $(element).find('td');

      if (courseDataColumns.eq(3).text().trim() === courseNum && courseDataColumns.eq(2).text().trim() === courseName.split(' ')[0]) {
        courseData = {
          term: courseDataColumns.eq(0).text().trim(),
          crn: courseDataColumns.eq(1).text().trim(),
          subj: courseDataColumns.eq(2).text().trim(),
          num: courseDataColumns.eq(3).text().trim(),
          sec: courseDataColumns.eq(4).text().trim(),
          title: courseDataColumns.eq(5).text().trim(),
          enrl: parseInt(courseDataColumns.eq(17).text().trim(), 10),
          lim: parseInt(courseDataColumns.eq(16).text().trim(), 10),
        };
      }
    });

    console.log("Closing browser...");
    await browser.close();

    return courseData;
  } catch (error) {
    console.error('Error fetching course data:', error);
    if (browser) {
      await browser.close();
    }
    return null;
  }
};

// Endpoint to fetch course data
app.get('/api/courses', async (req, res) => {
  const cacheKey = 'courses_data';
  const cachedCourses = cache.get(cacheKey);

  if (cachedCourses) {
    console.log("Serving data from cache...");
    console.log(cachedCourses);  // Check the structure here
    res.json(cachedCourses);  // Cached data is expected to be an array
    fetchCourseDataAndUpdateCache();  // Fetch fresh data in the background
  } else {
    console.log("Fetching data for the first time...");
    const courses = await fetchCourseDataAndUpdateCache();
    console.log(courses);  // Check the structure here
    res.json(courses);  // New data fetched should be an array
  }
});



// Function to fetch course data and update cache
const fetchCourseDataAndUpdateCache = async () => {
  try {
    let browser;
    console.log("Launching Puppeteer...");
    const chromePath = process.env.GOOGLE_CHROME_BIN || '/app/.apt/usr/bin/google-chrome';
    console.log("Chrome path:", chromePath);
    console.log("Chrome exists:", fs.existsSync(chromePath));
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: chromePath,
      ignoreHTTPSErrors: true,
      dumpio: true
    });
    
    

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(120000);

    console.log("Navigating to timetable main page...");
    await page.goto('https://oracle-www.dartmouth.edu/dart/groucho/timetable.main', { waitUntil: 'domcontentloaded' });

    console.log("Clicking 'Subject Area(s)' button...");
    await page.waitForSelector('input[value="Subject Area(s)"]', { visible: true, timeout: 30000 });
    await page.click('input[value="Subject Area(s)"]');

    console.log("Waiting for navigation to complete...");
    await page.waitForSelector('input[value="202409"]', { visible: true, timeout: 60000 });

    console.log("Selecting 'Fall Term 2024'...");
    await page.click('input[value="202409"]');

    console.log("Selecting 'All Subjects'...");
    await page.evaluate(() => {
      const allSubjectsInput = document.querySelector('input[value="All"]');
      if (allSubjectsInput) {
        allSubjectsInput.click();
      } else {
        console.error("All Subjects input not found.");
      }
    });

    console.log("Selecting 'All Periods'...");
    await page.evaluate(() => {
      const allPeriodsInput = document.querySelectorAll('input[value="All"]');
      if (allPeriodsInput[1]) {
        allPeriodsInput[1].click();
      } else {
        console.error("All Periods input not found.");
      }
    });

    console.log("Selecting 'Course, Term, Time' sort order...");
    await page.evaluate(() => {
      const sortOrderInput = document.querySelector('input[value="C"]');
      if (sortOrderInput) {
        sortOrderInput.click();
      } else {
        console.error("Sort Order input not found.");
      }
    });

    console.log("Clicking 'Search for Courses' button...");
    await page.evaluate(() => {
      const searchButton = document.querySelector('input[type="submit"][value="Search for Courses"]');
      if (searchButton) {
        searchButton.click();
      } else {
        console.error("Search for Courses button not found.");
      }
    });

    const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    console.log("Waiting an additional 5 seconds for page to load...");
    await waitForTimeout(5000);

    console.log("Waiting for results page...");
    await page.waitForSelector('table tbody tr', { visible: true, timeout: 120000 });

    console.log("Capturing page content...");
    const content = await page.content();
    const $ = cheerio.load(content);

    console.log("Checking for courses table...");
    const courses = [];
    let startExtracting = false;

    $('table tbody tr').each((index, element) => {
      const courseDataColumns = $(element).find('td');
      const firstColumnText = courseDataColumns.eq(0).text().trim().toLowerCase();
      
      if (firstColumnText.includes("periods: all")) {
        startExtracting = true;
        return;
      }
      
      if (startExtracting && courseDataColumns.length > 1) { 
        const course = {
          term: courseDataColumns.eq(0).text().trim(),
          crn: courseDataColumns.eq(1).text().trim(),
          subj: courseDataColumns.eq(2).text().trim(),
          num: courseDataColumns.eq(3).text().trim(),
          sec: courseDataColumns.eq(4).text().trim(),
          title: courseDataColumns.eq(5).text().trim(),
          text: courseDataColumns.eq(6).text().trim(),
          xlist: courseDataColumns.eq(7).text().trim(),
          periodCode: courseDataColumns.eq(8).text().trim(),
          period: courseDataColumns.eq(9).text().trim(),
          room: courseDataColumns.eq(10).text().trim(),
          building: courseDataColumns.eq(11).text().trim(),
          instructor: courseDataColumns.eq(12).text().trim(),
          wc: courseDataColumns.eq(13).text().trim(),
          dist: courseDataColumns.eq(14).text().trim(),
          langReq: courseDataColumns.eq(15).text().trim(),
          lim: courseDataColumns.eq(16).text().trim(),
          enrl: courseDataColumns.eq(17).text().trim(),
          status: courseDataColumns.eq(18).text().trim(),
        };
      
      if (course.crn && course.title) {
          courses.push(course);
      }
      
      }
    });

    console.log("Closing browser...");
    await browser.close();

    if (courses.length > 0) {
      console.log("Updating cache with fresh data...");
      cache.set('courses_data', courses);
    } else {
      console.warn('No courses found.');
    }

    return courses;
  } catch (error) {
    console.error('Error fetching course data:', error);
    return cache.get('courses_data'); // Fall back to cached data if error occurs
  }
};

// Endpoint to subscribe to notifications
app.post('/api/subscribe', async (req, res) => {
  const { userId, courseId, email, courseName, courseNum } = req.body;

  try {
    const notificationDoc = db.collection('notifications').doc(`${userId}_${courseId}`);
    await notificationDoc.set({ userId, courseId, email, courseName, courseNum });

    res.status(200).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Function to check course enrollment and send notifications
const checkCourseEnrollment = async () => {
  try {
    const subscriptionsSnapshot = await db.collection('notifications').get();

    subscriptionsSnapshot.forEach(async (doc) => {
      const { email, courseName, courseNum } = doc.data();

      // Fetch the latest course data
      const courseData = await fetchCourseData(courseName, courseNum);

      // Check if a spot has opened up
      if (courseData && courseData.enrl < courseData.lim) {
        // Send notification
        await sendEmailNotification(email, {
          title: courseName,
          subj: courseName.split(' ')[0],
          num: courseNum,
          enrl: courseData.enrl,
          lim: courseData.lim,
        });

        // Optionally, delete the subscription after notifying
        await db.collection('notifications').doc(doc.id).delete();
      }
    });
  } catch (error) {
    console.error('Error checking course enrollment:', error);
  }
};

// Schedule this function to run periodically (e.g., every 5 minutes)
setInterval(checkCourseEnrollment, 300000); // 300000ms = 5 minutes

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
