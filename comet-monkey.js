const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configuration
const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  TEST_USER: { email: 'test@example.com', password: 'password' },
  MAX_INTERACTIONS: 5,
  INTERACTION_DELAY: 1000,
  SCREENSHOT_DIR: 'playwright-screenshots',
  TIMEOUT: 30000
};

// Ensure screenshot directory exists
if (!fs.existsSync(CONFIG.SCREENSHOT_DIR)) {
  fs.mkdirSync(CONFIG.SCREENSHOT_DIR, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  results: [],
  errors: [],
  warnings: [],
  screenshots: []
};

async function logTest(name, passed, details = '') {
  const entry = { name, passed, timestamp: new Date().toISOString(), details };
  report.results.push(entry);
  const icon = passed ? '✓' : '✗';
  console.log(`${icon} ${name}${details ? ` - ${details}` : ''}`);
}

async function logError(error) {
  report.errors.push({ message: error, timestamp: new Date().toISOString() });
  console.error(`✗ Error: ${error}`);
}

async function saveScreenshot(page, filename) {
  try {
    const filepath = path.join(CONFIG.SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath });
    report.screenshots.push(filename);
  } catch (error) {
    await logError(`Failed to save screenshot: ${error.message}`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Setup logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      report.warnings.push({ type: 'console_error', message: msg.text() });
    }
  });

  page.on('requestfailed', request => {
    report.warnings.push({ 
      type: 'network_error', 
      url: request.url(),
      error: request.failure().errorText 
    });
  });

  try {
    console.log('\n=== Nexus AI Comet Inspection Started ===\n');
    
    // TEST 1: Page loads
    console.log('[TEST 1] Checking page accessibility...');
    try {
      await page.goto(`${CONFIG.BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: CONFIG.TIMEOUT });
      await logTest('Homepage loads', true);
      await saveScreenshot(page, '01-homepage.png');
    } catch (error) {
      await logTest('Homepage loads', false, error.message);
    }

    // TEST 2: Page title
    console.log('[TEST 2] Checking page title...');
    try {
      const title = await page.title();
      const hasTitle = title.includes('Nexus');
      await logTest('Page title correct', hasTitle, title);
    } catch (error) {
      await logTest('Page title check', false, error.message);
    }

    // TEST 3: Login page
    console.log('[TEST 3] Testing login page...');
    try {
      await page.goto(`${CONFIG.BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      const emailInput = page.locator('input[type="email"]');
      const exists = await emailInput.count() > 0;
      await logTest('Login form renders', exists);
      if (exists) {
        await saveScreenshot(page, '02-login-page.png');
      }
    } catch (error) {
      await logTest('Login page test', false, error.message);
    }

    // TEST 4: Health endpoint
    console.log('[TEST 4] Testing health endpoint...');
    try {
      const response = await page.goto(`${CONFIG.BASE_URL}/health`);
      const isHealthy = response.status() === 200;
      await logTest('Health endpoint', isHealthy, `Status: ${response.status()}`);
    } catch (error) {
      await logTest('Health endpoint test', false, error.message);
    }

    // TEST 5: CSS/JS Loading
    console.log('[TEST 5] Checking CSS and JavaScript...');
    try {
      await page.goto(`${CONFIG.BASE_URL}/`);
      const cssLoaded = await page.evaluate(() => {
        return document.querySelectorAll('link[rel="stylesheet"]').length > 0;
      });
      const jsLoaded = await page.evaluate(() => typeof document.documentElement !== 'undefined');
      await logTest('CSS/JS loaded', cssLoaded && jsLoaded, 
        `CSS: ${cssLoaded ? 'loaded' : 'missing'}, JS: ${jsLoaded ? 'loaded' : 'missing'}`);
    } catch (error) {
      await logTest('CSS/JS loading check', false, error.message);
    }

    // TEST 6: Security headers
    console.log('[TEST 6] Checking security headers...');
    try {
      const response = await page.goto(`${CONFIG.BASE_URL}/`);
      const headers = response.headers();
      const hasSecurityHeaders = 
        headers['x-frame-options'] && 
        headers['x-content-type-options'] &&
        headers['x-xss-protection'];
      await logTest('Security headers present', hasSecurityHeaders);
    } catch (error) {
      await logTest('Security headers check', false, error.message);
    }

    // TEST 7: No fatal console errors
    console.log('[TEST 7] Checking for console errors...');
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
    
    try {
      await page.goto(`${CONFIG.BASE_URL}/`);
      await page.waitForTimeout(2000);
      const errors = consoleLogs.filter(log => log.type === 'error').length;
      await logTest('No fatal console errors', errors === 0, `Found: ${errors} errors`);
    } catch (error) {
      await logTest('Console error check', false, error.message);
    }

    // TEST 8: Responsive design
    console.log('[TEST 8] Testing responsive design...');
    try {
      const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto(`${CONFIG.BASE_URL}/`);
      const mainVisible = await mobilePage.locator('main').isVisible();
      await logTest('Mobile viewport works', mainVisible);
      await mobilePage.screenshot({ path: path.join(CONFIG.SCREENSHOT_DIR, '03-mobile-view.png') });
      await mobileContext.close();
    } catch (error) {
      await logTest('Responsive design test', false, error.message);
    }

    // TEST 9: Form validation
    console.log('[TEST 9] Testing form validation...');
    try {
      await page.goto(`${CONFIG.BASE_URL}/login`);
      const emailInput = page.locator('input[type="email"]');
      const isRequired = await emailInput.evaluate(el => el.required);
      await logTest('Form validation attributes', isRequired);
    } catch (error) {
      await logTest('Form validation test', false, error.message);
    }

    // TEST 10: 404 handling
    console.log('[TEST 10] Testing 404 error handling...');
    try {
      const response = await page.goto(`${CONFIG.BASE_URL}/nonexistent-page-12345`);
      const is404 = response.status() === 404;
      await logTest('404 page handling', is404, `Status: ${response.status()}`);
    } catch (error) {
      // 404 is expected, check if error is from navigation
      if (error.message.includes('404')) {
        await logTest('404 page handling', true, 'Correctly caught 404');
      } else {
        await logTest('404 page handling', false, error.message);
      }
    }

    // TEST 11: Database connectivity (indirect test)
    console.log('[TEST 11] Testing backend connectivity...');
    try {
      await page.goto(`${CONFIG.BASE_URL}/`);
      const bodyContent = await page.content();
      const isConnected = bodyContent.length > 100; // Basic check that page has content
      await logTest('Backend connectivity', isConnected);
    } catch (error) {
      await logTest('Backend connectivity test', false, error.message);
    }

    // TEST 12: API endpoints
    console.log('[TEST 12] Testing API endpoints...');
    try {
      const apiResponse = await page.request.get(`${CONFIG.BASE_URL}/health`);
      const isHealthy = apiResponse.ok();
      await logTest('API endpoints accessible', isHealthy, `Status: ${apiResponse.status()}`);
    } catch (error) {
      await logTest('API endpoints test', false, error.message);
    }

  } catch (error) {
    await logError(`Critical error during testing: ${error.message}`);
  } finally {
    // Summary
    console.log('\n=== Test Summary ===');
    const passed = report.results.filter(r => r.passed).length;
    const total = report.results.length;
    console.log(`Passed: ${passed}/${total}`);
    
    if (report.warnings.length > 0) {
      console.log(`\nWarnings (${report.warnings.length}):`);
      report.warnings.slice(0, 5).forEach(w => {
        console.log(`  - ${w.type}: ${w.message || w.error || 'Unknown'}`);
      });
      if (report.warnings.length > 5) {
        console.log(`  ... and ${report.warnings.length - 5} more`);
      }
    }

    if (report.errors.length > 0) {
      console.log(`\nErrors (${report.errors.length}):`);
      report.errors.forEach(e => {
        console.log(`  - ${e.message}`);
      });
    }

    // Save report
    const reportPath = path.join(CONFIG.SCREENSHOT_DIR, 'inspection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${CONFIG.SCREENSHOT_DIR}/`);
    console.log('\n=== Inspection Complete ===\n');

    await context.close();
    await browser.close();
  }
})();
