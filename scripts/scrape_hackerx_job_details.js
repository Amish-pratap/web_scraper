const { chromium } = require("playwright");
const fs = require("fs");

// Load job URLs from previous JSON file
const jobsData = require("../data/hackerx_jobs.json");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const jobDetails = [];

  // Iterate over each job listing
  let count = 0;
  for (const job of jobsData) {
    if (count > 10) break;
    console.log(`Navigating to job listing: ${job.link}`);
    await page.goto(job.link);
    await page.waitForTimeout(1000); // Wait for the page to load

    // Extract job and company details
    const jobData = await page.evaluate(() => {
      const title = document.querySelector(".page-title")?.innerText || "";
      const company = document.querySelector(".job-company a")?.innerText || "";
      const companyLink = document.querySelector(".job-company a")?.href || "";
      const location = document.querySelector(".location a")?.innerText || "";
      const jobType = document.querySelector(".job-type")?.innerText || "";
      const postDate = document.querySelector(".date-posted")?.innerText || "";

      // Description content
      const description = Array.from(
        document.querySelectorAll(".job_listing-description p")
      )
        .map((p) => p.innerText)
        .join("\n");

      // Company social links
      const socialLinks = Array.from(
        document.querySelectorAll(".job_listing-company-social a")
      ).map((link) => ({
        platform: link.className.replace("job_listing-", ""),
        url: link.href,
      }));

      // Application link
      const applicationLink =
        document.querySelector(".application_button_link")?.href || "";

      return {
        title,
        company,
        companyLink,
        location,
        jobType,
        postDate,
        description,
        socialLinks,
        applicationLink,
      };
    });

    // Append the scraped data to job details array
    jobDetails.push({ ...job, ...jobData });

    // Logging the job title and company to track progress
    console.log(
      `Extracted job details: ${jobData.title} at ${jobData.company}`
    );
    count++;
  }

  // Save job details to JSON file
  fs.writeFileSync(
    "./data/hackerx_job_details.json",
    JSON.stringify(jobDetails, null, 2)
  );

  console.log(
    `Scraping completed! Extracted details for ${jobDetails.length} jobs.`
  );
  await browser.close();
})();
