const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const app = express();
const port = 5050;

app.get("/videos", async (req, res) => {
  await getYoutubeOrganicResults().then(res.json());
});

app.listen(port, () => {
  console.log(`App running on ${port}`);
});

// #Puppeteer logic scrapper below
puppeteer.use(StealthPlugin());

// const searchString = `${game} trailer`
const searchString = "hitman 3 trailer"; // what we want to search

const requestParams = {
  baseURL: `https://www.youtube.com`,
  encodedQuery: encodeURI(searchString), // what we want to search for in URI encoding
};

async function fillDataFromPage(page) {
  const dataFromPage = await page.evaluate((requestParams) => {
    return Array.from(
      document.querySelectorAll("#contents > ytd-video-renderer")
    ).map((el) => ({
      title: el.querySelector("a#video-title")?.textContent.trim(),
      link: `${requestParams.baseURL}${el
        .querySelector("a#thumbnail")
        ?.getAttribute("href")}`,
      channel: {
        name: el
          .querySelector("#channel-info #channel-name a")
          ?.textContent.trim(),
        link: `${requestParams.baseURL}${el
          .querySelector("#channel-info > a")
          ?.getAttribute("href")}`,
        thumbnail: el
          .querySelector("#channel-info > a #img")
          ?.getAttribute("src"),
      },
      publishedDate: el
        .querySelectorAll("#metadata-line > span")[1]
        ?.textContent.trim(),
      views: el
        .querySelectorAll("#metadata-line > span")[0]
        ?.textContent.trim(),
      length: el
        .querySelector("span.ytd-thumbnail-overlay-time-status-renderer")
        ?.textContent.trim(),
      description: el
        .querySelector(".metadata-snippet-container > yt-formatted-string")
        ?.textContent.trim(),
      extensions: Array.from(el.querySelectorAll("#badges .badge")).map((el) =>
        el.querySelector("span")?.textContent.trim()
      ),
      thumbnail: el.querySelector("a#thumbnail #img")?.getAttribute("src"),
    }));
  }, requestParams);
  return dataFromPage;
}

async function getYoutubeOrganicResults() {
  const browser = await puppeteer.launch({
    headless: false, //set true for prod
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const URL = `${requestParams.baseURL}/results?search_query=${requestParams.encodedQuery}`;

  await page.waitForSelector("#contents > ytd-video-renderer");

  const organicResults = await fillDataFromPage(page);

  await browser.close();

  return organicResults;
}

getYoutubeOrganicResults().then(console.log);
