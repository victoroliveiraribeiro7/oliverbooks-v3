const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url()));

    await page.goto('http://localhost:5173/produto/index.html?id=9a687f6b-7198-d371-a788-60b21f524db1');

    try {
        await page.waitForSelector('.buy-button', { timeout: 5000 });
        console.log('Button found, clicking...');
        await page.click('.buy-button');
        console.log('Clicked. Waiting exactly 2 secs...');
        await new Promise(r => setTimeout(r, 2000));
        console.log('Current URL:', page.url());
    } catch (e) {
        console.log('Exception in script:', e);
    }

    await browser.close();
})();
