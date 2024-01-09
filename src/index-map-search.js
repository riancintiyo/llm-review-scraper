import pw from 'playwright';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import promptSync from 'prompt-sync';
const prompt = promptSync();

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY || 'default_api_key');

const getPlace = async (place) => {
	const browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();
};

const getReview = async (url) => {
	const browser = await pw.chromium.launch({ headless: true });
	const page = await browser.newPage();
	let reviews = [];

	await page.goto(url);
	await page.waitForSelector('.MyEned', { state: 'visible' });

	const reviewList = page.locator('.MyEned');
	const el = await reviewList.count();

	for (let i = 0; i < el; i++) {
		let rev = reviewList.nth(i);
		let btn = rev.locator('button.w8nwRe.kyuRq');
		let textEl = rev.locator('.wiI7pd');
		const btnCount = await btn.count();

		if (btnCount > 0) {
			await btn.click();
			const text = await textEl.textContent();
			reviews.push(text);
		}
	}

	await browser.close();

	console.log(reviews);
	return reviews;
};

const run = async (keyword) => {
	console.log('===== Running the code, please wait... =====');

	//get reviews list
	const reviews = await getReview(url);

	console.log('===== One Process Finished =====');

	const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

	let firstPrompt = `I have collected some reviews of a place I was considering visiting.\n
          Can you summarize the reviews for me?. The reviews are bellow:`;

	let indoPrompt = `Saya sudah mengumpulkan beberapa review dari tempat yang akan saya kunjungi. \n
          Tolong, bisakah kamu membuat kesimpulan dari review tersebut untuk saya?. Adapun reviewnya seperti ini:`;

	let dataPrompt = '';

	for (let i = 0; i <= reviews.length; i++) {
		dataPrompt += reviews[i];
	}

	const result = await model.generateContent(firstPrompt + dataPrompt);
	const response = await result.response;
	const text = response.text();
	console.log('===== Done. =====');
	console.log(text);
};

const keyword = prompt('Search for place here:');

if (keyword) {
	run(keyword).catch((error) => console.log(error));
} else {
	console.error('Keyword cannot be empty');
}
