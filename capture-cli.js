const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage();
  
  // Inject console/error handlers
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  // Navigate to the page
  await page.goto('file:///Users/TheRustySpoon/Desktop/Projects/Main projects/Trading_bots/ADMENSION/index.html', {
    waitUntil: 'networkidle0'
  });
  
  // Wait for page to fully load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get the active page name
  const pageId = await page.evaluate(() => {
    const activePage = document.querySelector('.page.active');
    return activePage ? activePage.id.replace('page-', '') : 'page';
  });
  
  // Get full page dimensions
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });
  
  // Capture full page screenshot (exactly like the button does)
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `ADMENSION_${pageId}_${timestamp}.png`;
  
  await page.screenshot({
    path: filename,
    fullPage: true,
    type: 'png'
  });
  
  console.log(`✅ Screenshot saved: ${filename}`);
  console.log(`   Page: ${pageId}`);
  console.log(`   Dimensions: ${dimensions.width}x${dimensions.height}`);
  
  await browser.close();
})();
