const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Read the input JSON file
  const jobs = require("../data/devremote_jobs.json");

  for (let job of jobs) {
    if (job.applyLink) {
      try {
        // Navigate to the apply link page
        await page.goto(job.applyLink);

        // Wait for the "Visit Website" link to appear by its text content
        const visitWebsiteLinkElement = await page
          .locator("text=Visit Website")
          .first();

        // Capture the link if available
        const visitWebsiteLink = await visitWebsiteLinkElement.getAttribute(
          "href"
        );

        // Add the link to the job object
        job.visitWebsiteLink = visitWebsiteLink;
        console.log(`Captured "Visit Website" link for: ${job.jobTitle}`);
      } catch (error) {
        console.log(
          `Could not capture "Visit Website" for: ${job.jobTitle}`,
          error
        );
        job.visitWebsiteLink = null; // Set null if link not found
      }
    }
  }

  // Write the updated data to a new JSON file
  fs.writeFileSync(
    "./data/updated_jobs_with_websites.json",
    JSON.stringify(jobs, null, 2)
  );
  console.log(
    "Updated job data has been saved to updated_jobs_with_websites.json"
  );

  await browser.close();
})();
