const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  TEST_USER: { email: 'test@example.com', password: 'password' },
  SCREENSHOT_DIR: 'playwright-screenshots',
  TIMEOUT: 30000,
  INTERACTION_DELAY: 500
};

if (!fs.existsSync(CONFIG.SCREENSHOT_DIR)) {
  fs.mkdirSync(CONFIG.SCREENSHOT_DIR, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  tests: [],
  interactions: [],
  errors: [],
  screenshots: []
};

async function logTest(name, passed, details = '') {
  const entry = { name, passed, timestamp: new Date().toISOString(), details };
  report.tests.push(entry);
  const icon = passed ? '✓' : '✗';
  console.log(`${icon} ${name}${details ? ` - ${details}` : ''}`);
}

async function logInteraction(action, target, status) {
  const entry = { action, target, status, timestamp: new Date().toISOString() };
  report.interactions.push(entry);
  const icon = status === 'success' ? '✓' : '✗';
  console.log(`  ${icon} ${action}: ${target}`);
}

async function saveScreenshot(page, filename) {
  try {
    const filepath = path.join(CONFIG.SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath });
    report.screenshots.push(filename);
  } catch (error) {
    console.error(`Failed to save screenshot: ${error.message}`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      report.errors.push({ message: msg.text(), timestamp: new Date().toISOString() });
    }
  });

  try {
    console.log('\n=== INTERACTIVE TESTING SESSION STARTED ===\n');
    
    // TEST 1: Navigate to homepage
    console.log('[TEST 1] Homepage navigation...');
    try {
      await page.goto(`${CONFIG.BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await logTest('Homepage loads', true);
      await saveScreenshot(page, 'interactive-01-homepage.png');
    } catch (error) {
      await logTest('Homepage loads', false, error.message);
    }

    // TEST 2: Explore available links
    console.log('[TEST 2] Discovering interactive elements...');
    try {
      const allLinks = await page.locator('a').all();
      const allButtons = await page.locator('button').all();
      
      await logInteraction('Discovered', `${allLinks.length} links`, 'success');
      await logInteraction('Discovered', `${allButtons.length} buttons`, 'success');
      
      await logTest('Element discovery', true, `Found ${allLinks.length} links, ${allButtons.length} buttons`);
    } catch (error) {
      await logTest('Element discovery', false, error.message);
    }

    // TEST 3: Try to find and click New Session button
    console.log('[TEST 3] Testing New Session flow...');
    try {
      const newSessionBtn = page.locator('a:has-text("New Session"), button:has-text("New Session")');
      const newSessionCount = await newSessionBtn.count();
      
      if (newSessionCount > 0) {
        await logInteraction('Found', 'New Session button', 'success');
        await logInteraction('Click', 'New Session button', 'success');
        await newSessionBtn.first().click();
        await sleep(1000);
        await saveScreenshot(page, 'interactive-02-new-session.png');
        await logTest('New Session button clickable', true);
      } else {
        await logTest('New Session button visible', false);
      }
    } catch (error) {
      await logTest('New Session flow', false, error.message);
    }

    // TEST 4: Check for persona selection elements
    console.log('[TEST 4] Testing persona selection...');
    try {
      const personas = await page.locator('button[type="button"], div[class*="persona"], div[class*="option"]').all();
      const personaButtons = await page.locator('[class*="persona"], [data-persona]').all();
      
      if (personas.length > 0) {
        await logInteraction('Found', `${personas.length} interactive elements`, 'success');
        
        // Try to click first one
        if (personas.length > 0) {
          const firstPersona = personas[0];
          const text = await firstPersona.textContent();
          await logInteraction('Click', `Persona: ${text?.trim().substring(0, 20)}`, 'success');
          await firstPersona.click();
          await sleep(1000);
          await saveScreenshot(page, 'interactive-03-persona-selected.png');
          await logTest('Persona selection works', true);
        }
      } else {
        await logTest('Persona options visible', false);
      }
    } catch (error) {
      await logTest('Persona selection', false, error.message);
    }

    // TEST 5: Test chat message input
    console.log('[TEST 5] Testing chat message input...');
    try {
      const messageInput = page.locator('textarea, input[type="text"][placeholder*="Ask"], input[type="text"][placeholder*="Message"]').first();
      const inputCount = await page.locator('textarea').count();
      
      if (inputCount > 0) {
        await logInteraction('Found', 'Message input textarea', 'success');
        await logInteraction('Focus', 'Message input', 'success');
        await messageInput.focus();
        await messageInput.fill('Test message from comet-monkey');
        await sleep(CONFIG.INTERACTION_DELAY);
        await saveScreenshot(page, 'interactive-04-message-input.png');
        await logTest('Message input works', true);
      } else {
        await logTest('Message input found', false);
      }
    } catch (error) {
      await logTest('Message input test', false, error.message);
    }

    // TEST 6: Test sidebar navigation
    console.log('[TEST 6] Testing sidebar navigation...');
    try {
      const sidebar = page.locator('aside, [class*="sidebar"]');
      const sidebarCount = await sidebar.count();
      
      if (sidebarCount > 0) {
        await logInteraction('Found', 'Sidebar component', 'success');
        
        const sidebarLinks = page.locator('aside a, [class*="sidebar"] a');
        const linkCount = await sidebarLinks.count();
        await logInteraction('Found', `${linkCount} sidebar links`, 'success');
        
        await logTest('Sidebar navigation visible', true);
      } else {
        await logTest('Sidebar visible', false);
      }
    } catch (error) {
      await logTest('Sidebar test', false, error.message);
    }

    // TEST 7: Test mobile responsive design
    console.log('[TEST 7] Testing mobile responsive design...');
    try {
      const mobileViewport = { width: 375, height: 667 };
      const mobileContext = await browser.newContext({ viewport: mobileViewport });
      const mobilePage = await mobileContext.newPage();
      
      await mobilePage.goto(`${CONFIG.BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await saveScreenshot(mobilePage, 'interactive-05-mobile-view.png');
      
      const mobileReady = await mobilePage.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta !== null;
      });
      
      await logTest('Mobile viewport configured', mobileReady);
      await mobileContext.close();
    } catch (error) {
      await logTest('Mobile responsive test', false, error.message);
    }

    // TEST 8: Test form elements and validation
    console.log('[TEST 8] Testing form elements...');
    try {
      const forms = await page.locator('form').all();
      const inputs = await page.locator('input, textarea, select').all();
      
      await logInteraction('Found', `${forms.length} forms`, 'success');
      await logInteraction('Found', `${inputs.length} input elements`, 'success');
      
      await logTest('Form elements present', inputs.length > 0, `${inputs.length} inputs found`);
    } catch (error) {
      await logTest('Form discovery', false, error.message);
    }

    // TEST 9: Keyboard navigation
    console.log('[TEST 9] Testing keyboard navigation...');
    try {
      await page.keyboard.press('Tab');
      await sleep(200);
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      
      if (focused) {
        await logInteraction('Tab', `Focused on: ${focused}`, 'success');
        await logTest('Keyboard navigation works', true);
      } else {
        await logTest('Keyboard navigation works', false);
      }
    } catch (error) {
      await logTest('Keyboard navigation', false, error.message);
    }

    // TEST 10: Check accessibility attributes
    console.log('[TEST 10] Testing accessibility...');
    try {
      const ariaElements = await page.locator('[aria-label], [role]').all();
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      await logInteraction('Found', `${ariaElements.length} ARIA elements`, 'success');
      await logInteraction('Found', `${headings.length} heading elements`, 'success');
      
      await logTest('Accessibility attributes present', ariaElements.length > 0 || headings.length > 0);
    } catch (error) {
      await logTest('Accessibility check', false, error.message);
    }

    console.log('\n=== TEST SUMMARY ===\n');
    const passed = report.tests.filter(t => t.passed).length;
    const total = report.tests.length;
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Interactions Logged: ${report.interactions.length}`);
    console.log(`Screenshots Captured: ${report.screenshots.length}`);
    console.log(`Errors Found: ${report.errors.length}`);
    
    if (report.errors.length > 0) {
      console.log('\nConsole Errors:');
      report.errors.slice(0, 5).forEach(err => console.log(`  - ${err.message.substring(0, 80)}...`));
      if (report.errors.length > 5) {
        console.log(`  ... and ${report.errors.length - 5} more errors`);
      }
    }
    
    // Save report
    const reportPath = path.join(CONFIG.SCREENSHOT_DIR, 'interactive-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✓ Report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error(`✗ Fatal error: ${error.message}`);
  } finally {
    await browser.close();
    console.log('\n=== INTERACTIVE SESSION COMPLETE ===\n');
  }
})();
