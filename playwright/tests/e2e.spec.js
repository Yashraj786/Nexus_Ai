// @ts-check
const { test, expect } = require('@playwright/test');

// Setup test context with authentication
test.describe('Nexus AI E2E Tests', () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[Browser Error]: ${msg.text()}`);
      }
    });
    
    page.on('requestfailed', request => {
      console.error(`[Network Error]: ${request.url()} - ${request.failure().errorText}`);
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('1. Page Title and Structure', async () => {
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveTitle(/Nexus AI/);
    
    // Verify basic structure
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    console.log('✓ Page loads with correct title and structure');
  });

  test('2. Login Page Renders', async () => {
    await page.goto('http://localhost:3000/login');
    
    // Check login form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('input[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();
    console.log('✓ Login page renders with all form elements');
  });

  test('3. Navigation Links Exist', async () => {
    await page.goto('http://localhost:3000/');
    
    // Check for links (navigation elements)
    const allLinks = await page.locator('a').count();
    
    // At least some links should exist on the page
    expect(allLinks).toBeGreaterThan(0);
    console.log(`✓ Navigation structure exists (${allLinks} links found)`);
  });

  test('4. API Health Check', async () => {
    const response = await page.goto('http://localhost:3000/health');
    expect(response.status()).toBe(200);
    console.log('✓ Health endpoint responds correctly');
  });

  test('5. CSS and JavaScript Load', async () => {
    await page.goto('http://localhost:3000/');
    
    // Check for Tailwind classes
    const styledElement = page.locator('[class*="bg-"], [class*="text-"], [class*="flex"]').first();
    const boundingBox = await styledElement.boundingBox();
    expect(boundingBox).toBeTruthy();
    
    // Check for JavaScript execution (Lucide icons)
    const iconScript = await page.evaluate(() => typeof window.lucide !== 'undefined');
    expect(iconScript).toBeTruthy();
    console.log('✓ CSS and JavaScript loaded successfully');
  });

  test('6. Form Validation (Empty Submission)', async () => {
    await page.goto('http://localhost:3000/login');
    
    const signInButton = page.locator('button:has-text("Sign In")');
    const emailInput = page.locator('input[type="email"]');
    
    // Email input should have required attribute
    const isRequired = await emailInput.evaluate(el => el.required);
    expect(isRequired).toBe(true);
    console.log('✓ Form validation attributes present');
  });

  test('7. Responsive Design Check', async () => {
    // Test mobile viewport
    const mobileContext = await page.context().browser().newContext({ 
      viewport: { width: 375, height: 667 } 
    });
    const mobilePage = await mobileContext.newPage();
    
    await mobilePage.goto('http://localhost:3000/');
    const mainElement = mobilePage.locator('main');
    await expect(mainElement).toBeVisible();
    
    await mobileContext.close();
    console.log('✓ Responsive design works on mobile viewport');
  });

  test('8. Error Handling - 404 Page', async () => {
    const response = await page.goto('http://localhost:3000/nonexistent-page');
    expect(response.status()).toBe(404);
    console.log('✓ 404 error page handles missing routes correctly');
  });

  test('9. Content Security Policy Headers', async () => {
    const response = await page.goto('http://localhost:3000/');
    const headers = response.headers();
    
    // Check for security headers
    expect(headers['x-frame-options']).toBeTruthy();
    expect(headers['x-content-type-options']).toBeTruthy();
    console.log('✓ Security headers present');
  });

  test('10. No Console Errors on Load', async () => {
    const errorLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000); // Wait for any deferred errors
    
    expect(errorLogs.length).toBe(0);
    console.log('✓ No console errors detected on page load');
  });
});
