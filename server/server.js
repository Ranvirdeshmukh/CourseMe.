require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS
app.use(cors());

app.get('/api/courses', async (req, res) => {
  let browser;
  try {
    // Launch Puppeteer
    console.log("Launching Puppeteer...");
    browser = await puppeteer.launch({
      headless: true, // Set to true for headless mode in production
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set navigation timeout to a higher value
    await page.setDefaultNavigationTimeout(120000); // Increased to 120 seconds

    // Navigate to the timetable main page
    console.log("Navigating to timetable main page...");
    await page.goto('https://oracle-www.dartmouth.edu/dart/groucho/timetable.main', { waitUntil: 'domcontentloaded' });

    // Click the "Subject Area(s)" button
    console.log("Clicking 'Subject Area(s)' button...");
    await page.waitForSelector('input[value="Subject Area(s)"]', { visible: true, timeout: 30000 });
    await page.click('input[value="Subject Area(s)"]');

    // Wait for the page to load completely
    console.log("Waiting for navigation to complete...");
    await page.waitForSelector('input[value="202409"]', { visible: true, timeout: 60000 });

    // Select "Fall Term 2024"
    console.log("Selecting 'Fall Term 2024'...");
    await page.click('input[value="202409"]');

    // Select All Subjects
    console.log("Selecting 'All Subjects'...");
    await page.evaluate(() => {
      const allSubjectsInput = document.querySelector('input[value="All"]');
      if (allSubjectsInput) {
        allSubjectsInput.click();
      } else {
        console.error("All Subjects input not found.");
      }
    });

    // Select All Periods
    console.log("Selecting 'All Periods'...");
    await page.evaluate(() => {
      const allPeriodsInput = document.querySelectorAll('input[value="All"]');
      if (allPeriodsInput[1]) {
        allPeriodsInput[1].click(); // Ensure correct 'All' input for periods
      } else {
        console.error("All Periods input not found.");
      }
    });

    // Select Course, Term, Time
    console.log("Selecting 'Course, Term, Time' sort order...");
    await page.evaluate(() => {
      const sortOrderInput = document.querySelector('input[value="C"]');
      if (sortOrderInput) {
        sortOrderInput.click();
      } else {
        console.error("Sort Order input not found.");
      }
    });

    // Click Search for Courses
    console.log("Clicking 'Search for Courses' button...");
    await page.evaluate(() => {
      const searchButton = document.querySelector('input[type="submit"][value="Search for Courses"]');
      if (searchButton) {
        searchButton.click();
      } else {
        console.error("Search for Courses button not found.");
      }
    });

    // Custom wait function using setTimeout
    const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Wait an additional time after clicking the search button
    console.log("Waiting an additional 5 seconds for page to load...");
    await waitForTimeout(5000);

    // Adjust the selector to match the HTML content more accurately
    console.log("Waiting for results page...");
    await page.waitForSelector('table tbody tr', { visible: true, timeout: 120000 });

    // Capture content after navigation
    console.log("Capturing page content...");
    const content = await page.content();
    const $ = cheerio.load(content);

    // Check for expected table structure
    console.log("Checking for courses table...");
    const courses = [];
    let startExtracting = false;

    // Skip the rows containing paragraph guidelines and fetch only course data rows
    $('table tbody tr').each((index, element) => {
      const courseDataColumns = $(element).find('td');
      const firstColumnText = courseDataColumns.eq(0).text().trim().toLowerCase();
      
      if (firstColumnText.includes("periods: all")) {
        startExtracting = true;
        return; // Skip this row and start extracting from the next one
      }
      
      if (startExtracting && courseDataColumns.length > 1) { // Ensure it's a row with course data
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
        };

        if (course.crn && course.title) {
          courses.push(course);
        }
      }
    });

    console.log("Closing browser...");
    await browser.close();

    if (courses.length === 0) {
      console.warn('No courses found.');
    }

    console.log("Sending response...");
    res.json(courses);
  } catch (error) {
    console.error('Error fetching course data:', error);
    res.status(500).json({ error: 'Failed to fetch course data' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
