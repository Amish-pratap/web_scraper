const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Load job data from JSON file
  const jobsDataPath = "./data/workable_jobs_data.json";
  const jobsData = JSON.parse(fs.readFileSync(jobsDataPath, "utf-8"));

  for (let job of jobsData) {
    if (job.companyLink) {
      // Navigate to the company's page
      await page.goto(job.companyLink, {
        waitUntil: "domcontentloaded",
      });

      // Accept Cookies if a banner is present
      try {
        const cookieBtn = await page.$(
          "button[data-ui='cookie-consent-accept']"
        );
        if (cookieBtn) await cookieBtn.click();
      } catch (error) {
        console.log("No cookie banner found or unable to click it.");
      }

      // Extract the main company website link
      const companyWebsiteLink = await page.evaluate(() => {
        const websiteLinkElement = document.querySelector(
          ".companyDescription__company-link--1tQTo"
        );
        return websiteLinkElement
          ? websiteLinkElement.getAttribute("href")
          : null;
      });

      // Add the company website link to the job entry
      job.companyWebsite = companyWebsiteLink || "No website link available";
    }
  }

  // Save updated data to a new JSON file
  const outputPath = "./data/updated_workable_jobs_data.json";
  fs.writeFileSync(outputPath, JSON.stringify(jobsData, null, 2));

  console.log(
    "Company website links extracted and saved to updated_workable_jobs_data.json"
  );

  await browser.close();
})();
