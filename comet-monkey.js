const { chromium } = require('playwright');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  // Give the server a few seconds to start
  await sleep(5000);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Log console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });

  // Log network errors
  page.on('requestfailed', request => {
    console.error(`Network request failed: ${request.url()} - ${request.failure().errorText}`);
  });

  // --- Login Step ---
  console.log('--- Attempting to log in... ---');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  
  // Take a screenshot and dump HTML before the problematic click
  await page.screenshot({ path: `playwright-screenshots/before-login-click.png` });
  const htmlBeforeClick = await page.content();
  console.log('\n--- HTML before login click ---\n');
  console.log(htmlBeforeClick);
  console.log('\n---------------------------------\n');


  // Instead of waiting for navigation, wait for an element that appears after login
  await Promise.all([
    page.waitForSelector('a[href="/chat_sessions/new"]', { timeout: 60000 }), // Increased timeout for this specific wait
    page.getByRole('button', { name: 'Sign In' }).click()
  ]);
  
  console.log('--- Logged in successfully ---');
  await page.screenshot({ path: `playwright-screenshots/after-login.png` });


  // Store interaction history
  const interactionHistory = [];
  let interactionCount = 0;

  const performInteraction = async (element, type, value = null) => {
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const outerHTML = await element.evaluate(el => el.outerHTML);
    const identifier = outerHTML.length > 50 ? outerHTML.substring(0, 50) + '...' : outerHTML;

    console.log(`\n--- Performing ${type} on ${tagName}: ${identifier} ---`);
    interactionHistory.push({
      count: ++interactionCount,
      type,
      tagName,
      identifier,
      value,
      timestamp: new Date().toISOString()
    });

    try {
      if (type === 'click') {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}), // Don't fail if no navigation
          element.click()
        ]);
      } else if (type === 'fill') {
        await element.fill(value);
      }
      await page.screenshot({ path: `playwright-screenshots/interaction-${interactionCount}.png` });
    } catch (error) {
      console.error(`Error during interaction: ${error.message}`);
      interactionHistory[interactionHistory.length - 1].error = error.message;
      await page.screenshot({ path: `playwright-screenshots/interaction-${interactionCount}-error.png` });
    }
  };

  const url = 'http://localhost:3000';
  await page.goto(url); // Go to the root page after login
  await page.screenshot({ path: `playwright-screenshots/initial-state-after-login.png` });
  console.log(`Inspecting and interacting with page: ${url}`);

  // Create a directory for screenshots
  const fs = require('fs');
  const path = require('path');
  const screenshotDir = 'playwright-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  // Define how many random interactions to perform
  const MAX_RANDOM_INTERACTIONS = 10;

  for (let i = 0; i < MAX_RANDOM_INTERACTIONS; i++) {
    const interactiveElements = [
      ...(await page.locator('a').all()),
      ...(await page.locator('button').all()),
      ...(await page.locator('input[type="text"]').all()),
      ...(await page.locator('input[type="email"]').all()),
      ...(await page.locator('textarea').all())
    ];

    if (interactiveElements.length === 0) {
      console.log("No more interactive elements found on the current page. Ending interactions.");
      break;
    }

    const randomElement = interactiveElements[Math.floor(Math.random() * interactiveElements.length)];
    const tagName = await randomElement.evaluate(el => el.tagName.toLowerCase());

    if (tagName === 'a' || tagName === 'button') {
      await performInteraction(randomElement, 'click');
    } else if (tagName === 'input' || tagName === 'textarea') {
      await performInteraction(randomElement, 'fill', 'random_text_' + Math.random().toString(36).substring(7));
    }
    
    // Give the page some time to settle after interaction
    await sleep(2000);
  }

  console.log('\n--- Interaction History ---');
  console.log(JSON.stringify(interactionHistory, null, 2));
  console.log('---------------------------\n');


  await browser.close();
})();
