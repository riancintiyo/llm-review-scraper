import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();
const apiKey = process.env.API_KEY || 'default_api_key';

const getQuotes = async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });

  const page = await browser.newPage();

  await page.goto('http://quotes.toscrape.com/', { waitUntil: 'domcontentloaded' });

  // get page data
  const quotes = await page.evaluate(() => {
    const quoteNodes = document.querySelectorAll('.quote');

    // create array of objects for the quotes
    return Array.from(quoteNodes).map((item) => {
      const text = item.querySelector('.text').innerText;

      const author = item.querySelector('.author').innerText;

      return { text, author };
    });
  });

  console.log(quotes);

  await browser.close();
};

getQuotes();
