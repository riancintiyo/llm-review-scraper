import pw from 'playwright';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import promptSync from 'prompt-sync';
const prompt = promptSync();

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY || 'default_api_key');

const getPlace = async (place) => {
	let selectedUrl = '';
	const browser = await pw.chromium.launch({ headless: true });
    const page = await browser.newPage();

	await page.goto('https://www.google.com/maps');
	await page.waitForSelector('.searchboxinput.xiQnY');
	await page.locator('.searchboxinput.xiQnY').fill(`${place}`);
	await page.locator('#searchbox-searchbutton').click();
    await page.waitForFunction(
        () => {
            return document.querySelector('.L1xEbb') || document.querySelector('.yx21af.XDi3Bc');
        },
        { timeout: 50000 }
    );

	const isList = await page.evaluate(() => {
		const resultEl = document.querySelector('.fontTitleLarge.IFMGgb');
		const detailEl = document.body.querySelector('.yx21af.XDi3Bc');
		return ( resultEl && !detailEl);
	});

	if(isList){
		await page.waitForSelector('.Nv2PK.THOPZb.CpccDe');
		const places = await page.evaluate(() => {
			const listBox = Array.from(document.body.querySelectorAll(".hfpxzc"));
			const results = listBox.map(item => {
				const label = item.getAttribute('aria-label');
				const href = item.getAttribute('href');
				return { label: label, href: href };
			});
			return { anchor: results };
		});

		const resultString = places.anchor.map((item, index) => `${index} ${item.label}`).join('\n');
		console.log('Here is the list result: \n' + resultString);

		const selectedPlace = prompt('Please input number to select places:');

		if(!selectedPlace) throw new Error('The input cannot be empty');
		
		const selectedHref = places.anchor[parseInt(selectedPlace)].href;
		selectedUrl = selectedHref;

	} else {
		await page.waitForFunction(() => window.location.href.includes('?entry=ttu'), { timeout: 30000 });
		const currentURl = await page.evaluate(() => {
			return window.location.href;
		});
		selectedUrl = currentURl;
	}

	await browser.close();

	return selectedUrl;
};

const getReview = async (url) => {
	const browser = await pw.chromium.launch({ headless: false });
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

	return reviews.length > 0 ? reviews.join('\n') : 'Sorry currently there is no review available';
};

const run = async (keyword) => {
	console.log('===== Running the code, please wait... =====');

	// Get url from selected place
	const url = await getPlace(keyword);

	console.log('final url is:',url);

	//get reviews list
	const reviews = await getReview(url);

	console.log('===== One Process Finished =====');

	console.log('review is:', reviews);

	if( reviews.split(' ')[0] == 'Sorry' ) {
		console.log(reviews);
		throw new Error ('No review available');
	} else {
		
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
		console.log(text);
		console.log('===== Done. =====');
		return;
	}
};

const keyword = prompt('Search for place here:');

if (keyword) {
	run(keyword).catch((error) => console.log(error));
} else {
	console.error('Keyword cannot be empty');
}
