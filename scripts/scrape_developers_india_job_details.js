const { chromium } = require("playwright");
const fs = require("fs");

// Load job URLs from the previous JSON file
const jobsData = require("../data/developersindia_jobs.json");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const detailedJobData = [];

  // Iterate over each job listing to extract details
  for (const job of jobsData) {
    console.log(`Navigating to job listing: ${job.link}`);
    await page.goto(job.link);
    await page.waitForTimeout(1000); // Wait for the page to load

    // Extract job and company details
    const jobDetails = await page.evaluate(() => {
      const jobType = document.querySelector(".job-type")?.innerText || "";
      const location = document.querySelector(".location")?.innerText || "";
      const postDate =
        document.querySelector(".date-posted time")?.innerText || "";
      const postDateTime =
        document.querySelector(".date-posted time")?.getAttribute("datetime") ||
        "";
      const salary = document.querySelector(".salary")?.innerText || "";
      const companyLogo = document.querySelector(".company_logo")?.src || "";
      const companyName =
        document.querySelector(".company_header .name strong")?.innerText || "";

      // Description content
      const description = Array.from(
        document.querySelectorAll(".job_description p")
      )
        .map((p) => p.innerText)
        .join("\n");

      // Contact email
      const rawEmail =
        document
          .querySelector(".job_application_email")
          ?.getAttribute("href") || "";
      const email = rawEmail.split("?")[0].replace("mailto:", "");

      return {
        jobType,
        location,
        postDate,
        postDateTime,
        salary,
        companyLogo,
        companyName,
        description,
        email,
      };
    });

    // Add job listing data to the detailed data array
    detailedJobData.push({
      ...job,
      ...jobDetails,
    });

    // Log the progress
    console.log(`Extracted details for job: ${job.title}`);
  }

  // Save detailed job data to a JSON file
  fs.writeFileSync(
    "./data/developersindia_detailed_jobs.json",
    JSON.stringify(detailedJobData, null, 2)
  );

  console.log(
    `Detailed scraping completed! Extracted details for ${detailedJobData.length} jobs.`
  );
  await browser.close();
})();
