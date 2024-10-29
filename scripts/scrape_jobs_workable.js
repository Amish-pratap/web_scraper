const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Go to the main job listings page
  await page.goto(
    "https://jobs.workable.com/search?query=software+engineer&workplace=remote&employment_type=contract&employment_type=temporary&employment_type=part_time&selectedJobId=7dab84a1-9188-4405-b9fa-1960b50e19a5"
  );

  // Accept Cookies if a banner is present
  try {
    const cookieBtn = await page.$("button[data-ui='cookie-consent-accept']");
    if (cookieBtn) await cookieBtn.click();
  } catch (error) {
    console.log("No cookie banner found.");
  }

  // Load more jobs if button is available
  let hasMoreJobs = true;
  while (hasMoreJobs) {
    try {
      await page.click("button[data-ui='load-more-button']");
      await page.waitForTimeout(2000); // Wait for jobs to load
    } catch {
      hasMoreJobs = false;
    }
  }

  // Select all job cards on the page
  const jobCards = await page.$$("li.jobsList__list-item--3HLIF");
  const jobsData = [];

  for (const jobCard of jobCards) {
    // Extract the title, company, and company link from the list view
    const jobTitle = await jobCard.getAttribute("data-job-title");
    const companyName = await jobCard.getAttribute("data-company-name");
    const companyLinkElement = await jobCard.$(
      "h3.companyName__container--cK3_i a"
    );
    const companyLink = companyLinkElement
      ? await companyLinkElement.getAttribute("href")
      : "";

    // Construct the full company link if necessary
    const completeCompanyLink = companyLink.startsWith("http")
      ? companyLink
      : `https://jobs.workable.com${companyLink}`;

    // Open the job detail overlay
    await jobCard.click();
    await page.waitForSelector(".desktopView__job-description--3Lh0x", {
      timeout: 5000,
    });

    // Extract detailed job information without re-capturing `companyLink`
    const jobDetails = await page.evaluate(() => {
      const title =
        document.querySelector("[data-ui='overview-title']")?.innerText || "";
      const company =
        document.querySelector("[data-ui='overview-company']")?.innerText || "";
      const location =
        document.querySelector("[data-ui='overview-location']")?.innerText ||
        "";
      const department =
        document.querySelector("[data-ui='overview-department']")?.innerText ||
        "";
      const employmentType =
        document.querySelector("[data-ui='overview-employment-type']")
          ?.innerText || "";
      const datePosted =
        document.querySelector("[data-ui='overview-date-posted']")?.innerText ||
        "";
      const description = Array.from(
        document.querySelectorAll(
          "[data-ui='job-breakdown-description-parsed-html'] *"
        )
      )
        .map((p) => p.innerText)
        .join("\n");
      const requirements = Array.from(
        document.querySelectorAll(
          "[data-ui='job-breakdown-requirements-parsed-html'] *"
        )
      )
        .map((p) => p.innerText)
        .join("\n");
      const benefits = Array.from(
        document.querySelectorAll(
          "[data-ui='job-breakdown-benefits-parsed-html'] *"
        )
      )
        .map((p) => p.innerText)
        .join("\n");

      return {
        title,
        company,
        location,
        department,
        employmentType,
        datePosted,
        description,
        requirements,
        benefits,
      };
    });

    // Push job data into array, explicitly using the `completeCompanyLink`
    jobsData.push({
      jobTitle,
      companyName,
      companyLink: completeCompanyLink, // Use the correct company link
      ...jobDetails,
    });

    // Close the job detail overlay
    await page.click(".jobDescription__dismiss-icon--1z2jx");

    // Pause for UI state to reset
    await page.waitForTimeout(500);
  }

  // Save data to JSON
  fs.writeFileSync(
    "./data/workable_jobs_data.json",
    JSON.stringify(jobsData, null, 2)
  );

  console.log("Job scraping completed! Data saved to workable_jobs_data.json");

  await browser.close();
})();
