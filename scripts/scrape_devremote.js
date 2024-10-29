const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Array to store all job data
  let allJobs = [];
  let currentPage = 1; // Track current page

  // Navigate to the initial page
  await page.goto("https://devremote.io/");

  // Set "Show 50" in the job listings dropdown
  await page.selectOption(".JobTable_pageLengthDropdown__CmjUZ select", "10");
  await page.waitForTimeout(2000); // Wait for jobs to reload with "Show 50"

  // Flag to manage pagination
  let hasNextPage = true;

  while (hasNextPage && currentPage <= 3) {
    // Stop after 3 pages for testing
    // Wait for job listings to load
    await page.waitForSelector(".JobTable_wrap__YwZDD");

    // Get all job cards on the current page
    const jobCards = await page.$$(".JobTable_wrap__YwZDD tr[role='row']");

    for (const [index, jobCard] of jobCards.entries()) {
      // Click the job card to reveal job details
      await jobCard.click();
      await page.waitForTimeout(500); // Ensure .markdown is loaded

      // Extract data based on the nth `.markdown` element relative to card position
      const jobData = await jobCard.evaluate((card, markdownIndex) => {
        const companyLogo = card.querySelector("img")?.src || "";
        const companyName =
          card.querySelector(".text-sm.font-semibold")?.innerText || "";
        const jobTitle =
          card.querySelector(".text-lg.font-bold")?.innerText || "";
        const location =
          card.querySelector('a[aria-label*="Worldwide"]')?.innerText ||
          "Worldwide";
        const datePosted =
          card.querySelector(".text-sm.italic")?.innerText || "";

        // Capture unique job tags using a Set to avoid duplicates
        const jobTagsSet = new Set();
        card
          .querySelectorAll(".text-xs.text-gray-500")
          .forEach((tag) => jobTagsSet.add(tag.innerText));
        const jobTags = Array.from(jobTagsSet);

        // Capture the nth `.markdown` element based on `markdownIndex`
        const markdownElements = card.querySelectorAll(".markdown");
        const jobDescription = markdownElements[markdownIndex]?.innerText || "";
        const applyLink = card.querySelector(".btn-sm[href]")?.href || "";

        return {
          companyLogo,
          companyName,
          jobTitle,
          location,
          datePosted,
          jobTags,
          jobDescription,
          applyLink,
        };
      }, index); // Pass index as markdownIndex to select the nth .markdown element

      allJobs.push(jobData);

      // Close job card after capturing data
    }

    // Look for the next page button
    const nextPageButton = await page.$(
      `a[aria-label="Page ${currentPage + 1}"]`
    );
    if (nextPageButton) {
      currentPage++;
      await nextPageButton.click();
      await page.waitForTimeout(2000); // Adjust if necessary for loading time
    } else {
      hasNextPage = false; // Exit loop if no next page button is found
    }
  }

  // Save all job data to JSON file
  fs.writeFileSync(
    "./data/devremote_jobs.json",
    JSON.stringify(allJobs, null, 2)
  );
  console.log("All job data has been saved to devremote_jobs.json");

  await browser.close();
})();
