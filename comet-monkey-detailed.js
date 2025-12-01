const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  TEST_USER: { email: 'test@example.com', password: 'password' },
  SCREENSHOT_DIR: 'playwright-screenshots',
  TIMEOUT: 30000
};

if (!fs.existsSync(CONFIG.SCREENSHOT_DIR)) {
  fs.mkdirSync(CONFIG.SCREENSHOT_DIR, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  network_requests: [],
  network_failures: [],
  console_logs: [],
  screenshots: [],
  tests: []
};

async function logTest(name, passed, details = '') {
  const entry = { name, passed, timestamp: new Date().toISOString(), details };
  report.tests.push(entry);
  const icon = passed ? '✓' : '✗';
  console.log(`${icon} ${name}${details ? ` - ${details}` : ''}`);
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

  // Intercept all network requests
  page.on('response', response => {
    const status = response.status();
    report.network_requests.push({
      url: response.url(),
      status: status,
      method: response.request().method(),
      timestamp: new Date().toISOString()
    });
    
    if (status >= 400) {
      console.log(`⚠️  [${status}] ${response.url()}`);
    }
  });

  page.on('requestfailed', request => {
    report.network_failures.push({
      url: request.url(),
      error: request.failure().errorText,
      timestamp: new Date().toISOString()
    });
    console.log(`❌ [FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  page.on('console', msg => {
    report.console_logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    if (msg.type() === 'error') {
      console.log(`🔴 [CONSOLE ERROR] ${msg.text()}`);
    }
  });

  try {
    console.log('\n=== DETAILED NETWORK INSPECTION STARTED ===\n');
    
    console.log('[1] Visiting Homepage...');
    await page.goto(`${CONFIG.BASE_URL}/`, { waitUntil: 'networkidle' });
    await logTest('Homepage loads', true);
    await saveScreenshot(page, 'detailed-homepage.png');
    
    console.log('[2] Visiting Login page...');
    await page.goto(`${CONFIG.BASE_URL}/login`, { waitUntil: 'networkidle' });
    await logTest('Login page loads', true);
    
    console.log('[3] Visiting 404 page...');
    await page.goto(`${CONFIG.BASE_URL}/nonexistent-page-12345`, { waitUntil: 'networkidle' });
    await logTest('404 page loads', true);
    
    console.log('\n=== NETWORK ANALYSIS ===\n');
    console.log(`Total Requests: ${report.network_requests.length}`);
    console.log(`Failed Requests: ${report.network_failures.length}`);
    
    // Summary by status code
    const statusCodes = {};
    report.network_requests.forEach(req => {
      const status = req.status;
      statusCodes[status] = (statusCodes[status] || 0) + 1;
    });
    
    console.log('\nRequests by Status Code:');
    Object.keys(statusCodes).sort((a, b) => b - a).forEach(code => {
      const icon = code >= 400 ? '⚠️ ' : '✓ ';
      console.log(`${icon}${code}: ${statusCodes[code]} requests`);
    });
    
    // Find 404s
    const notFound = report.network_requests.filter(r => r.status === 404);
    if (notFound.length > 0) {
      console.log('\n404 Errors Found:');
      notFound.forEach(req => {
        console.log(`  - ${req.url}`);
      });
    }
    
    console.log('\n=== SAVING DETAILED REPORT ===\n');
    const reportPath = path.join(CONFIG.SCREENSHOT_DIR, 'detailed-network-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✓ Report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error(`✗ Error during inspection: ${error.message}`);
  } finally {
    await browser.close();
    console.log('\n=== INSPECTION COMPLETE ===\n');
  }
})();
