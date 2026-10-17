import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createCalendar } from "./lib/announcement-calendar.js";

export default function (eleventyConfig) {
  for (const path of [
    "CNAME",
    "css",
    "files",
    "font-awesome",
    "fonts",
    "img",
    "js"
  ]) {
    eleventyConfig.addPassthroughCopy(path);
  }

  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const announcements = JSON.parse(await readFile("_data/announcements.json", "utf8"));
    const site = JSON.parse(await readFile("_data/site.json", "utf8"));
    const destination = `${dir.output}/calendars`;
    await mkdir(destination, { recursive: true });
    await Promise.all(announcements.filter(item => item.calendar).map(item =>
      writeFile(`${destination}/${item.slug}.ics`, createCalendar(item, site.url))
    ));
  });

  return {
    dir: {
      input: ".",
      output: "_site"
    },
    templateFormats: ["html"]
  };
}
