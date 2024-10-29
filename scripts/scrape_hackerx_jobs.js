const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to HackerX job listings page
  await page.goto("https://hackerx.org/jobs/");

  // Load all job listings by scrolling and clicking "Load more listings"
  while (true) {
    try {
      // Scroll to the bottom of the page before each click
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000); // Wait 2 seconds for content to load

      // Click "Load more listings" button
      await page.click(".load_more_jobs", { timeout: 5000 });
      console.log("Clicked 'Load more listings' button");

      // Additional wait to ensure all new jobs are loaded
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log("No more listings to load or button not found.");
      break;
    }
  }

  // Extract job listing details
  const jobListings = await page.$$eval(".job_listing", (jobs) =>
    jobs.map((job) => {
      const title = job.querySelector(".job_listing-title")?.innerText || "";
      const company =
        job.querySelector(".job_listing-company strong")?.innerText || "";
      const location =
        job.querySelector(".job_listing-location a")?.innerText || "";
      const jobType = job.querySelector(".job_listing-type")?.innerText || "";
      const postDate = job.querySelector(".job_listing-date")?.innerText || "";
      const link = job.querySelector(".job_listing-clickbox")?.href || "";
      const logo = job.querySelector(".company_logo")?.src || "";

      return { title, company, location, jobType, postDate, link, logo };
    })
  );

  // Log job listings and save to JSON file
  console.log(`Extracted ${jobListings.length} job listings.`);
  fs.writeFileSync(
    "./data/hackerx_jobs.json",
    JSON.stringify(jobListings, null, 2)
  );

  // Close browser
  await browser.close();
})();
