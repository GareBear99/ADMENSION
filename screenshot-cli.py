#!/usr/bin/env python3
"""
ADMENSION Screenshot CLI Tool
Simple, reliable screenshot capture using Selenium WebDriver
Works without SSL certificate issues
"""

import sys
import os
from datetime import datetime

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
except ImportError as e:
    print("❌ Selenium not installed. Install with:")
    print("   pip3 install selenium")
    print(f"\nError: {e}")
    sys.exit(1)

BASE_URL = "https://garebear99.github.io/ADMENSION/"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")

PAGES = {
    "home": "#home",
    "stats": "#stats", 
    "create": "#create",
    "manage": "#manage",
    "docs": "#docs",
    "admin": "#admin"
}

def setup_driver():
    """Setup Chrome driver with headless options"""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--ignore-certificate-errors")
    chrome_options.add_argument("--allow-insecure-localhost")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"❌ Error setting up Chrome driver: {e}")
        print("\nTry installing chromedriver:")
        print("   brew install chromedriver")
        print("   # OR download from: https://chromedriver.chromium.org/")
        sys.exit(1)

def capture_page(driver, page_name, page_hash):
    """Capture a single page screenshot"""
    try:
        url = BASE_URL + page_hash
        print(f"📸 Capturing {page_name}...")
        
        driver.get(url)
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Additional wait for dynamic content
        driver.implicitly_wait(2)
        
        # Get full page height for screenshot
        total_height = driver.execute_script("return document.body.scrollHeight")
        driver.set_window_size(1920, total_height)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"admension_{page_name}_{timestamp}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        # Take screenshot
        driver.save_screenshot(filepath)
        
        print(f"✅ Saved: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"❌ Error capturing {page_name}: {e}")
        return None

def main():
    """Main function"""
    print("🚀 ADMENSION Screenshot CLI")
    print(f"📂 Output: {OUTPUT_DIR}\n")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Setup driver
    driver = setup_driver()
    
    try:
        # Capture all pages
        captured = []
        for page_name, page_hash in PAGES.items():
            result = capture_page(driver, page_name, page_hash)
            if result:
                captured.append(result)
        
        print(f"\n🎉 Captured {len(captured)}/{len(PAGES)} pages")
        print(f"📂 Location: {OUTPUT_DIR}")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
