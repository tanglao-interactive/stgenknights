# stgenknights.com
Knights of Columbus St. Genevieve Council 14772

## Local development

This site is built with [Eleventy](https://www.11ty.dev/).

```sh
npm install
npm start
```

Eleventy will start a local development server and rebuild the site when files change.
To create a production build in `_site`, run:

```sh
npm run build
```

Pushes to `master` are built and deployed by the GitHub Pages workflow. The repository's
Pages source must be set to **GitHub Actions**.

## How To Contribute

### Requirements

* Mac computer using the Terminal
* Install git by typing in `xcode-select install` in the Terminal.
* Visual Studio Code or Sublime
* Follow steps: [Generate SSH Key](https://docs.github.com/en/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
* Follow steps: [Add SSH Key to Github](https://docs.github.com/en/enterprise/2.15/user/articles/adding-a-new-ssh-key-to-your-github-account#:~:text=In%20the%20user%20settings%20sidebar,key%20%22Personal%20MacBook%20Air%22.)

### Steps To Code and Deploy

#### Step 1. Download the codes from Github
  - git clone git@github.com:tanglao-interactive/stgenknights.git
#### Step 2. Start coding
  - Open Visual Studio Code
  - Open the folder where you downloaded the codes 
  - Make some changes
#### Step 3. Save your changes using git by using these commands.
  - git add .
  - git commit -m "I changed some text in this page"
#### Step 4. Publish your changes
  - git push origin master
#### Step 5. Wait and check your deployment in this website after 5 minutes:
  - http://stgenknights.com/

## Announcement calendars

Event announcements can include a `calendar` array in `_data/announcements.json`.
Each session has an ISO `start` and an optional `end`. Use explicit Pacific offsets
(`-07:00` during daylight saving time, `-08:00` during standard time) for timed
events. For all-day entries, use `YYYY-MM-DD`; an all-day `end` is exclusive.
Use separate sessions for events on multiple days with specific daily times.
Leave an unpublished end time unset. Birthday greeting posts omit this field.
The build generates `.ics` downloads and displays Add to calendar links.

After building, verify with `node --test tests/announcement-calendar.test.js`.
