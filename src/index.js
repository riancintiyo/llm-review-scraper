import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY || 'default_api_key');

const getReviews = async () => {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: null });

  const page = await browser.newPage();

  await page.goto(
    'https://www.google.com/maps/place/Ayam+Gepuk+Pak+Gembus+Ciumbuleuit/@-6.8732282,107.6061942,18.56z/data=!4m6!3m5!1s0x2e68e6f1f7d25dbd:0xdd90d8ed39e022b9!8m2!3d-6.8741218!4d107.6046802!16s%2Fg%2F11fzb1460k?entry=ttu',
    { waitUntil: 'domcontentloaded' },
  );

  await page.waitForSelector('.MyEned');

  // get page data
  const reviews = await page.evaluate(async () => {
    const commentNodes = document.querySelectorAll('.MyEned');

    // Use await Promise.all to wait for all button clicks to complete
    await Promise.all(
      Array.from(commentNodes).map(async (item) => {
        const btn = item.querySelector('.w8nwRe.kyuRq');
        if (btn) {
          // Wrap the click operation in a promise and await it
          await new Promise((resolve) => {
            btn.addEventListener('click', resolve, { once: true });
            btn.click();
          });
        }
      }),
    );

    const reviewList = Array.from(commentNodes).map((item) => {
      return item.textContent;
    });

    return reviewList;
  });

  await browser.close();

  return reviews;
};

const run = async () => {
  const reviews = await getReviews();

  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  let firstPrompt = `I collected some reviews of a place I was considering visiting.\n
		Can you summarize the reviews for me?. The reviews are bellow:`;

  let indoPrompt = `Saya sudah mengumpulkan beberapa review dari tempat yang akan saya kunjungi. \n
		Tolong, bisakah kamu membuat kesimpulan dari review tersebut untuk saya?. Adapun reviewnya seperti ini:`;

  let dataPrompt = '';

  for (let i = 0; i <= 3; i++) {
    dataPrompt += reviews[i];
  }

  const result = await model.generateContent(firstPrompt + dataPrompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
};

run().catch((error) => console.log(error));
