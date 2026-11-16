const puppeteer = require('puppeteer');
const path = require('path');

async function capture() {
  const browser = await puppeteer.launch({ headless: 'new' });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to login page for User...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    // Wait for the email and password inputs
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'nguyenvana@gmail.com');
    await page.type('input[type="password"]', '123456');
    
    // Click submit
    await page.click('button[type="submit"]');

    // Wait for navigation after login (e.g., home page)
    console.log('Waiting for login to complete and navigate...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    
    // Sometimes it takes a moment to render
    await new Promise(r => setTimeout(r, 2000));
    
    // Take Client screenshot
    const clientPath = 'client_screenshot.png';
    await page.screenshot({ path: clientPath });
    console.log(`Saved User Client screenshot to ${clientPath}`);

    // Now do the admin login
    // Clear cookies/localStorage if necessary, or just use a new incognito context
    const context = await browser.createIncognitoBrowserContext();
    const adminPage = await context.newPage();
    await adminPage.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to login page for Admin...');
    await adminPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    await adminPage.waitForSelector('input[type="email"]');
    await adminPage.type('input[type="email"]', 'admin@gmail.com');
    await adminPage.type('input[type="password"]', '123456');
    await adminPage.click('button[type="submit"]');

    console.log('Waiting for admin login to complete...');
    await adminPage.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    
    // Navigate to admin explicitly if it doesn't redirect
    await adminPage.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 2000));

    const adminPath = 'admin_screenshot.png';
    await adminPage.screenshot({ path: adminPath });
    console.log(`Saved Admin Panel screenshot to ${adminPath}`);

    await context.close();
  } catch (error) {
    console.error('Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

capture();
