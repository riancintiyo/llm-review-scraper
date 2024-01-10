import pw from 'playwright';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import promptSync from 'prompt-sync';
const prompt = promptSync();

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY || 'default_api_key');

const getPlace = async (place) => {
	const browser = await pw.chromium.launch({ headless: false });
    const page = await browser.newPage();

	await page.goto('https://www.google.com/maps');
	await page.waitForSelector('.searchboxinput.xiQnY');

	const inputEl = page.locator('.searchboxinput.xiQnY');
	const searchBtn = page.locator('#searchbox-searchbutton');

	await inputEl.fill(`${place}`);
	await searchBtn.click();

	// Wait for either of the elements to appear
    await page.waitForFunction(
        () => {
            return document.querySelector('.L1xEbb') || document.querySelector('.yx21af.XDi3Bc');
        },
        { timeout: 30000 }
    );

	const isList = await page.evaluate(() => {
		const resultEl = document.querySelector('.fontTitleLarge.IFMGgb');
		const detailEl = document.body.querySelector('.yx21af.XDi3Bc');
		if ( resultEl && !detailEl ) {
			return true;
		} else {
			return false;
		}
	});

	console.log(isList);
	if(isList){
		await page.waitForSelector('.Nv2PK.THOPZb.CpccDe');
		const places = await page.evaluate(() => {
			const listBox = document.body.querySelectorAll(".Nv2PK.THOPZb.CpccDe");
			const results = Array.from(listBox).map(item => {
				const anchor = item.querySelector('.hfpxzc').getAttribute('aria-label');
				return anchor;
			});

			return { nodeList: listBox, stringList: results };
		});
		
		const resultString = places.stringList.map((item, index) => `${index} ${item}`).join('\n');
		console.log('Here is the list result: \n' + resultString);
		const selectedPlace = prompt('Please input number to select places:');

		if(!selectedPlace){
			throw new Error('The input cannot be empty');
		}

		


	} else {
		await page.waitForFunction(() => window.location.href.includes('?entry=ttu'), { timeout: 30000 });
		const currentURl = await page.evaluate(() => {
			return window.location.href;
		});
		console.log(currentURl);
	}
	

	await browser.close();

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

	// Get url from selected place
	const url = await getPlace(keyword);

	//get reviews list
	// const reviews = await getReview(url);

	console.log('===== One Process Finished =====');

	// const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

	let firstPrompt = `I have collected some reviews of a place I was considering visiting.\n
          Can you summarize the reviews for me?. The reviews are bellow:`;

	let indoPrompt = `Saya sudah mengumpulkan beberapa review dari tempat yang akan saya kunjungi. \n
          Tolong, bisakah kamu membuat kesimpulan dari review tersebut untuk saya?. Adapun reviewnya seperti ini:`;

	let dataPrompt = '';

	// for (let i = 0; i <= reviews.length; i++) {
	// 	dataPrompt += reviews[i];
	// }

	// const result = await model.generateContent(firstPrompt + dataPrompt);
	// const response = await result.response;
	// const text = response.text();
	console.log('===== Done. =====');
	// console.log(text);
};

const keyword = prompt('Search for place here:');

if (keyword) {
	run(keyword).catch((error) => console.log(error));
} else {
	console.error('Keyword cannot be empty');
}
