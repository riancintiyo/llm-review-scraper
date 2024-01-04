import puppeteer from "puppeteer";

const getQuotes = async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null});

    const page = await browser.newPage();

    await page.goto("http://quotes.toscrape.com/", { waitUntil: "domcontentloaded"});

    // get page data 
    const quotes = await page.evaluate(() => {
        const quoteNodes = document.querySelectorAll(".quote");

        // First Approach
        // const texts = [];

        // quoteNodes.forEach( (item) => {
        //     const text = item.querySelector(".text").innerText;

        //     const author = item.querySelector(".author").innerText;

        //     texts.push({ text, author });
        // });

        
        // Second Approach
        return Array.from(quoteNodes).map( (item) => { // Array.from() => Static method create new shallow copied array
            const text = item.querySelector(".text").innerText;

            const author = item.querySelector(".author").innerText;

            return { text, author };
        });
    });

    console.log(quotes);
    await browser.close();

};

getQuotes();