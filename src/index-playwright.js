import pw from 'playwright';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY || 'default_api_key');

const main = async () => {
  const browser = await pw.chromium.launch({ headless: false });
  let reviews = [];

  const page = await browser.newPage();
  await page.goto(
    'https://www.google.com/maps/place/Gunung+Putri+Lembang/@-6.7935958,107.6333703,15z/data=!4m6!3m5!1s0x2e68e05a4048dbf5:0xe4065e4e8662d324!8m2!3d-6.8004462!4d107.6337131!16s%2Fg%2F11c5q_z3rh?entry=ttu',
  );
  await page.waitForSelector('.MyEned', { state: 'visible' });

  const reviewList = await page.$$('.MyEned');

  for (const review of reviewList) {
    const btn = await review.$('button.w8nwRe.kyuRq');
    if (btn) {
      await btn.click();
      const text = await review.$eval('.wiI7pd', (element) => element.textContent.trim());
      reviews.push(text);
    }
  }
  
  await browser.close();
  return reviews;
};

const run = async () => {
    //get reviews list
    const reviews = await main();
  
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
    let firstPrompt = `I have collected some reviews of a place I was considering visiting.\n
          Can you summarize the reviews for me?. The reviews are bellow:`;
  
    let indoPrompt = `Saya sudah mengumpulkan beberapa review dari tempat yang akan saya kunjungi. \n
          Tolong, bisakah kamu membuat kesimpulan dari review tersebut untuk saya?. Adapun reviewnya seperti ini:`;
  
    let dataPrompt = '';
  
    for (let i = 0; i <= reviews.length ; i++) {
      dataPrompt += reviews[i];
    }
  
    const result = await model.generateContent(firstPrompt + dataPrompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
  };
  
  run().catch((error) => console.log(error));