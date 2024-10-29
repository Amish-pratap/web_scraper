const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to DevelopersIndia job board page
  await page.goto("https://developersindia.in/job-board/");

  // Load all job listings by scrolling and clicking "Load more listings"
  while (true) {
    try {
      // Scroll to the bottom of the page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000); // Wait 2 seconds for content to load

      // Click the "Load more listings" button
      await page.click(".load_more_jobs", { timeout: 5000 });
      console.log("Clicked 'Load more listings' button");

      // Additional wait to ensure all new jobs are loaded
      await page.waitForTimeout(3000);
    } catch (error) {
      console.log("No more listings to load or button not found.");
      break;
    }
  }

  // Extract job listing details
  const jobListings = await page.$$eval(
    ".job_listings li",
    (jobs) =>
      jobs
        .map((job) => {
          const title = job.querySelector(".position h3")?.innerText || "";
          const company = job.querySelector(".company strong")?.innerText || "";
          const location =
            job.querySelector(".location")?.innerText.trim() || "";
          const jobType = job.querySelector(".job-type")?.innerText || "";
          const postDate = job.querySelector(".date time")?.innerText || "";
          const postDateTime =
            job.querySelector(".date time")?.getAttribute("datetime") || "";
          const link = job.querySelector("a")?.href || "";
          const logo = job.querySelector(".company_logo")?.src || "";

          // Only add the job if title and link are not empty
          if (title && link) {
            return {
              title,
              company,
              location,
              jobType,
              postDate,
              postDateTime,
              link,
              logo,
            };
          } else {
            return null; // Return null for incomplete jobs
          }
        })
        .filter((job) => job !== null) // Filter out any null values
  );

  // Log job listings and save to JSON file
  console.log(`Extracted ${jobListings.length} job listings.`);
  fs.writeFileSync(
    "./data/developersindia_jobs.json",
    JSON.stringify(jobListings, null, 2)
  );

  // Close browser
  await browser.close();
})();
