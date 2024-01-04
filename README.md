# LLM Review Scraper

Scraping Google Maps review using Puppeteer and create Sentiment Analysis summary using LLM

## Installation
- Make sure you have installed Node.js
- Clone the repository.

```bash
npm install
```

## Usage

```javascript

# change url '##newURL' in index.js
await page.goto("##newURL", { waitUntil: "domcontentloaded"});
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

Thanks to [Kylie Ying](https://www.kylieying.com/) for inspiring the ideas.

## License

[MIT](https://choosealicense.com/licenses/mit/)
