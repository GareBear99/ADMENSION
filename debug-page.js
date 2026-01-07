const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    console.log(`BROWSER [${msg.type()}]:`, msg.text());
  });
  
  // Capture page errors
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    console.log('STACK:', err.stack);
  });
  
  // Capture failed requests
  page.on('requestfailed', request => {
    console.log('FAILED REQUEST:', request.url());
  });
  
  await page.goto('file:///Users/TheRustySpoon/Desktop/Projects/Main projects/Trading_bots/ADMENSION/index.html', {
    waitUntil: 'networkidle0'
  });
  
  await page.waitForTimeout(3000);
  
  // Check debug pill
  const debugText = await page.$eval('#debugPill', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('\n=== DEBUG PILL:', debugText);
  
  // Check if showPage was called
  const showPageCalled = await page.evaluate(() => window.showPageCalled || false);
  console.log('=== showPage() called:', showPageCalled);
  
  // Check main content
  const mainVisible = await page.evaluate(() => {
    const main = document.getElementById('main');
    return main ? main.style.display !== 'none' : false;
  });
  console.log('=== Main content visible:', mainVisible);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('\n=== Screenshot saved to debug-screenshot.png');
  
  await browser.close();
})();
