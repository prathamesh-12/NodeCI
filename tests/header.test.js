const puppeteer = require('puppeteer');

test('Add 2 numbers', () => {
    const sum = 1 + 2;

    expect(sum).toEqual(3);
})

test('Launch a browser', async () => {

    const browser = await puppeteer.launch({ 
        headless: false
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:3000/');

    // const _logoText = await page.$eval("a.brand-logo", el => el.innerHTML);

    // expect(_logoText).toEqual('Blogger');

})