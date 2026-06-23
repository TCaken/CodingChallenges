# Chrome Web Store Listing Details

Copy-paste these when filling out the store listing form.

---

## Name
Coding Challenges New Tab

## Summary (132 chars max)
Replace your new tab with a clean dashboard showing the time, date, and latest open PRs from the Coding Challenges community.

## Description
Transform your new tab into a developer-friendly dashboard.

Features:
• Current time displayed in large, easy-to-read format
• Today's date in a friendly format
• Latest open pull requests from the CodingChallengesFYI/SharedSolutions GitHub repo
• Clean, minimal design with Coding Challenges branding
• No sign-up required, no data collected

Built as part of the Coding Challenges series (codingchallenges.fyi).

## Category
Productivity

## Language
English

---

## Privacy Policy URL
After pushing to GitHub, use this URL:
https://github.com/TCaken/CodingChallenges/blob/main/chrome-extension/PRIVACY_POLICY.md

---

## Screenshots

You need at least 1 screenshot (1280x800 or 640x400).

How to take one:
1. Install the extension locally (Load unpacked)
2. Open a new tab
3. Take a screenshot (Cmd+Shift+4 on Mac, drag to select)
4. Make sure it's 1280x800 pixels

---

## Steps to Submit

1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay $5 registration (one-time)
3. Click "New Item"
4. Upload zip (see below)
5. Fill in listing details from above
6. Add privacy policy URL
7. Upload screenshot(s)
8. Submit for review

---

## Create the Zip

Run this in terminal:
```
cd /Users/cakent@capc.com.sg/Documents/CodingChallenges/chrome-extension
zip -r ../chrome-extension.zip . -x "*.DS_Store" "STORE_LISTING.md" "PRIVACY_POLICY.md"
```

Upload the resulting `chrome-extension.zip` file.
