## npm install in the root directory

## then run the scripts like node scripts/scrape_devremote_details.js

## inside the script there will be input file or output file mentioned so check the input and output there

## we might have 2 scripts one for job listing page and one for th

# input file

the input will be output of some file

```javascript
// Read the input JSON file
const jobs = require("../data/devremote_jobs.json");
```

# output file

```javascript
fs.writeFileSync(
  "./data/updated_jobs_with_websites.json",
  JSON.stringify(jobs, null, 2)
);
```
