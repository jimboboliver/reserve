import fetch from "node-fetch";
import express from "express";

const rootUrl = "https://www.australianwhiskyauctions.com.au/live-auction";

const app = express();
export default app;

async function handler(event) {
  let url = rootUrl;
  if (event.page) {
    url += event.page !== 1 && event.page !== "1" ? `/page-${event.page}` : "";
  }
  const request = await fetch(url);
  const content = await request.text();

  const auctionData = /window\.auction_data =((.|\n)*)window\.auction_filters/g;
  const result = auctionData.exec(content);

  const response = {
    statusCode: 200,
    body: result[1].trim().substring(0, result[1].lastIndexOf(";")),
  };
  return response;
}

app.get("/", async (req, res) => {
  res.send(await handler(req.query));
});

export const listen = app.listen;
