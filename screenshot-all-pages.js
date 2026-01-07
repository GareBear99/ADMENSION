/**
 * ADMENSION Full Page Screenshot Script
 * Uses Playwright to capture all pages
 */

const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://garebear99.github.io/ADMENSION/';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

const pages = [
  { name: 'home', hash: '#home' },
  { name: 'stats', hash: '#stats' },
  { name: 'create', hash: '#create' },
  { name: 'manage', hash: '#manage' },
  { name: 'docs', hash: '#docs' },
  { name: 'admin', hash: '#admin' }
];

(async () => {
  console.log('🚀 Starting ADMENSION screenshot capture...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create output directory
  const fs = require('fs');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const pageInfo of pages) {
    try {
      console.log(`📸 Capturing ${pageInfo.name} page...`);
      
      const url = BASE_URL + pageInfo.hash;
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait a bit for any animations/dynamic content
      await page.waitForTimeout(2000);
      
      const outputPath = path.join(OUTPUT_DIR, `admension_${pageInfo.name}.png`);
      
      await page.screenshot({
        path: outputPath,
        fullPage: true
      });
      
      console.log(`✅ Saved: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Error capturing ${pageInfo.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('🎉 All screenshots captured!');
  console.log(`📂 Location: ${OUTPUT_DIR}`);
})();
