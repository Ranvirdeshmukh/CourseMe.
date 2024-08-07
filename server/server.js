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
      headless: false, // Set to true for headless mode in production
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set navigation timeout to a higher value
    await page.setDefaultNavigationTimeout(90000);

    // Navigate to the timetable main page
    console.log("Navigating to timetable main page...");
    await page.goto('https://oracle-www.dartmouth.edu/dart/groucho/timetable.main', { waitUntil: 'domcontentloaded' });

    // Click the "Subject Area(s)" button
    console.log("Clicking 'Subject Area(s)' button...");
    await page.waitForSelector('input[value="Subject Area(s)"]', { visible: true, timeout: 15000 });
    await page.click('input[value="Subject Area(s)"]');

    // Wait for the page to load completely
    console.log("Waiting for navigation to complete...");
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 });

    // Select "Fall Term 2024"
    console.log("Selecting 'Fall Term 2024'...");
    await page.waitForSelector('input[value="202409"]', { visible: true, timeout: 15000 });
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
      const allPeriodsInput = document.querySelector('input[value="All"]');
      if (allPeriodsInput) {
        allPeriodsInput.click();
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

    // Capture content before waiting for the selector
    console.log("Capturing page content before waiting for results...");
    const contentBefore = await page.content();
    console.log(contentBefore); // Log the HTML content

    // Adjust the selector to match the HTML content more accurately
    console.log("Waiting for results page...");
    await page.waitForSelector('table tbody tr', { visible: true, timeout: 90000 });

    // Capture content after navigation
    console.log("Capturing page content...");
    const content = await page.content();
    const $ = cheerio.load(content);

    // Check for expected table structure
    console.log("Checking for courses table...");
    const courses = [];
    
    // Skip unnecessary paragraphs and headers
    $('table tbody tr').each((index, element) => {
      // Skip the first few rows that don't contain course data
      if (index < 2) return; // Adjust this number based on the number of non-course rows you have

      const course = {
        term: $(element).find('td').eq(0).text().trim(),
        crn: $(element).find('td').eq(1).text().trim(),
        subj: $(element).find('td').eq(2).text().trim(),
        num: $(element).find('td').eq(3).text().trim(),
        sec: $(element).find('td').eq(4).text().trim(),
        title: $(element).find('td').eq(5).text().trim(),
        text: $(element).find('td').eq(6).text().trim(),
        xlist: $(element).find('td').eq(7).text().trim(),
        periodCode: $(element).find('td').eq(8).text().trim(),
        period: $(element).find('td').eq(9).text().trim(),
        room: $(element).find('td').eq(10).text().trim(),
        building: $(element).find('td').eq(11).text().trim(),
        instructor: $(element).find('td').eq(12).text().trim(),
        wc: $(element).find('td').eq(13).text().trim(),
        dist: $(element).find('td').eq(14).text().trim(),
        langReq: $(element).find('td').eq(15).text().trim(),
        lim: $(element).find('td').eq(16).text().trim(),
        enrl: $(element).find('td').eq(17).text().trim(),
      };

      if (course.crn && course.title) {
        courses.push(course);
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
