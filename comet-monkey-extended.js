const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  SCREENSHOT_DIR: 'playwright-screenshots',
  TIMEOUT: 30000,
  INTERACTION_DELAY: 300,
  MAX_PAGES_TO_TEST: 10,
  SESSION_DURATION_MS: 60000 // 1 minute extended session
};

if (!fs.existsSync(CONFIG.SCREENSHOT_DIR)) {
  fs.mkdirSync(CONFIG.SCREENSHOT_DIR, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  duration_ms: 0,
  pages_visited: [],
  elements_clicked: [],
  forms_tested: [],
  errors: [],
  performance: {
    avg_load_time: 0,
    total_requests: 0
  },
  coverage: {
    unique_urls: new Set(),
    unique_elements: new Set()
  }
};

async function saveScreenshot(page, filename) {
  try {
    const filepath = path.join(CONFIG.SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath });
    return filepath;
  } catch (error) {
    console.error(`Failed to save screenshot: ${error.message}`);
    return null;
  }
}

async function discoverAndClickElements(page) {
  const clicked = [];
  try {
    // Find all clickable elements
    const clickables = await page.locator('a, button, [role="button"], [onclick]').all();
    
    // Randomly select and click some
    const toClick = Math.min(3, clickables.length);
    for (let i = 0; i < toClick; i++) {
      const randomIndex = Math.floor(Math.random() * clickables.length);
      const element = clickables[randomIndex];
      
      try {
        const text = await element.textContent();
        const href = await element.getAttribute('href');
        const isEnabled = await element.isEnabled();
        
        if (isEnabled && !href?.includes('#')) { // Skip fragments and disabled elements
          console.log(`  → Clicking: ${text?.trim().substring(0, 40) || '(no text)'}`);
          await element.click();
          await sleep(CONFIG.INTERACTION_DELAY);
          clicked.push({
            text: text?.trim().substring(0, 50),
            href: href,
            success: true
          });
        }
      } catch (e) {
        // Element might no longer be available, continue
      }
    }
  } catch (error) {
    console.error(`Error discovering elements: ${error.message}`);
  }
  return clicked;
}

async function testFormsOnPage(page) {
  const tested = [];
  try {
    const forms = await page.locator('form').all();
    
    for (const form of forms.slice(0, 2)) { // Test first 2 forms
      try {
        const formInputs = await form.locator('input, textarea, select').all();
        
        for (const input of formInputs) {
          const type = await input.getAttribute('type');
          const placeholder = await input.getAttribute('placeholder');
          
          try {
            if (type === 'text' || type === 'email' || !type) {
              await input.fill('test-value');
              tested.push({
                type,
                placeholder,
                filled: true
              });
            } else if (type === 'checkbox') {
              await input.check();
              tested.push({ type: 'checkbox', checked: true });
            }
          } catch (e) {
            // Input might be read-only or disabled
          }
        }
      } catch (e) {
        // Form might have changed, continue
      }
    }
  } catch (error) {
    console.error(`Error testing forms: ${error.message}`);
  }
  return tested;
}

(async () => {
  const startTime = Date.now();
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let requestCount = 0;
  let totalLoadTime = 0;

  page.on('response', response => {
    requestCount++;
    if (response.status() >= 400) {
      report.errors.push({
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      report.errors.push({
        type: 'console_error',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   EXTENDED AUTONOMOUS TESTING SESSION   ║');
    console.log('║         (1-Minute Duration)             ║');
    console.log('╚════════════════════════════════════════╝\n');

    const pages = [
      '/',
      '/chat_sessions',
      '/chat_sessions/new',
      '/users/sign_in'
    ];

    let pageIndex = 0;

    while (Date.now() - startTime < CONFIG.SESSION_DURATION_MS) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      console.log(`\n⏱️  [${elapsedSeconds}s] ${pages[pageIndex % pages.length]}`);

      try {
        const url = `${CONFIG.BASE_URL}${pages[pageIndex % pages.length]}`;
        const pageStartTime = Date.now();
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.TIMEOUT }).catch(() => {});
        
        const loadTime = Date.now() - pageStartTime;
        totalLoadTime += loadTime;

        report.pages_visited.push({
          url,
          timestamp: new Date().toISOString(),
          load_time_ms: loadTime
        });

        report.coverage.unique_urls.add(url);

        // Interact with the page
        const clicked = await discoverAndClickElements(page);
        report.elements_clicked.push(...clicked);

        // Test forms
        const tested = await testFormsOnPage(page);
        report.forms_tested.push(...tested);

        // Take screenshot
        const screenshotNum = Math.floor((Date.now() - startTime) / 10000) + 1;
        await saveScreenshot(page, `extended-session-${screenshotNum}.png`);

        pageIndex++;
        await sleep(CONFIG.INTERACTION_DELAY);

      } catch (error) {
        console.error(`Error on iteration: ${error.message}`);
        report.errors.push({
          type: 'iteration_error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Calculate statistics
    const duration = Date.now() - startTime;
    report.duration_ms = duration;
    report.performance.avg_load_time = Math.round(totalLoadTime / report.pages_visited.length);
    report.performance.total_requests = requestCount;
    report.performance.unique_urls = report.coverage.unique_urls.size;

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║           SESSION COMPLETE              ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('📊 STATISTICS:');
    console.log(`  Duration: ${Math.round(report.duration_ms / 1000)}s`);
    console.log(`  Pages Visited: ${report.pages_visited.length}`);
    console.log(`  Unique URLs: ${report.performance.unique_urls}`);
    console.log(`  Elements Clicked: ${report.elements_clicked.length}`);
    console.log(`  Forms Tested: ${report.forms_tested.length}`);
    console.log(`  Network Requests: ${report.performance.total_requests}`);
    console.log(`  Errors Encountered: ${report.errors.length}`);
    console.log(`  Average Load Time: ${report.performance.avg_load_time}ms`);

    if (report.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      const errorSummary = {};
      report.errors.forEach(err => {
        const key = err.status || err.type;
        errorSummary[key] = (errorSummary[key] || 0) + 1;
      });
      Object.entries(errorSummary).forEach(([key, count]) => {
        console.log(`  ${key}: ${count} occurrences`);
      });
    }

    // Clean up circular references for JSON serialization
    const cleanReport = {
      ...report,
      coverage: {
        unique_urls: report.coverage.unique_urls.size,
        unique_elements_count: report.coverage.unique_elements.size
      }
    };

    const reportPath = path.join(CONFIG.SCREENSHOT_DIR, 'extended-session-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(cleanReport, null, 2));
    console.log(`\n✓ Detailed report saved to: ${reportPath}`);

  } catch (error) {
    console.error(`✗ Fatal error: ${error.message}`);
  } finally {
    await browser.close();
    console.log('\n=== EXTENDED TESTING SESSION CLOSED ===\n');
  }
})();
