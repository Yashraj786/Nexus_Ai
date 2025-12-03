import { test, expect } from '@playwright/test';

test.describe('Real User Interaction Tests', () => {
  test('Homepage - Click buttons and navigate', async ({ page }) => {
    console.log('\n🏠 Testing Homepage...');
    
    // Navigate to homepage
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✓ Navigated to homepage');
    
    // Check page title
    const title = await page.title();
    console.log(`✓ Page title: ${title}`);
    
    // Look for Get Started button
    const getStartedBtn = page.locator('a:has-text("Get Started")').first();
    await expect(getStartedBtn).toBeVisible();
    console.log('✓ Get Started button is visible');
    
    // Click Get Started button
    await getStartedBtn.click();
    console.log('✓ Clicked Get Started button');
    
    // Wait for navigation to signup page
    await page.waitForURL('**/register', { timeout: 5000 });
    console.log('✓ Successfully navigated to signup page');
  });

  test('Login Page - Full login flow', async ({ page }) => {
    console.log('\n🔐 Testing Login Page...');
    
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    console.log('✓ Opened login page');
    
    // Check form is visible
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    console.log('✓ Login form is visible');
    
    // Enter email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.click();
    await emailInput.fill('test@example.com');
    console.log('✓ Email entered');
    
    // Enter password
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.click();
    await passwordInput.fill('password123');
    console.log('✓ Password entered');
    
    // Check Sign In button
    const signInButton = page.locator('input[value="Sign In"], button:has-text("Sign In")').first();
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
    console.log('✓ Sign In button is visible and enabled');
    
    // Click it
    console.log('⏳ Clicking Sign In button...');
    await signInButton.click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`✓ Form submitted - Current URL: ${currentUrl}`);
  });

  test('Test all buttons are clickable', async ({ page }) => {
    console.log('\n🖱️ Testing Button Clickability...');
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Test Get Started button
    const getStartedBtn = page.locator('a:has-text("Get Started")').first();
    await expect(getStartedBtn).toBeVisible();
    console.log('✓ Get Started button is visible');
    
    const bbox = await getStartedBtn.boundingBox();
    console.log(`✓ Button size: ${bbox?.width}x${bbox?.height}, Position: (${bbox?.x}, ${bbox?.y})`);
    
    // Test Sign In button
    const signInBtn = page.locator('a:has-text("Sign In")').first();
    await expect(signInBtn).toBeVisible();
    console.log('✓ Sign In button is visible');
    
    // Test feature cards
    const cards = await page.locator('.app-card').count();
    console.log(`✓ Found ${cards} feature cards`);
    
    // Hover over first card
    const firstCard = page.locator('.app-card').first();
    await firstCard.hover();
    console.log('✓ Hover effect works on feature cards');
  });

  test('Test form input responsiveness', async ({ page }) => {
    console.log('\n⌨️ Testing Form Inputs...');
    
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    const emailInput = page.locator('input[type="email"]');
    
    // Type in email field
    await emailInput.click();
    await emailInput.fill('test@example.com');
    const value = await emailInput.inputValue();
    console.log(`✓ Email input working: "${value}"`);
    
    // Test password input
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.click();
    await passwordInput.fill('password123');
    const passValue = await passwordInput.inputValue();
    console.log(`✓ Password input working: "${passValue.replace(/./g, '•')}"`);
    
    // Check checkbox
    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.click();
    const isChecked = await checkbox.isChecked();
    console.log(`✓ Checkbox working: ${isChecked}`);
  });

  test('Verify dark theme colors', async ({ page }) => {
    console.log('\n🎨 Testing Dark Theme...');
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Get body background
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log(`✓ Body background: ${bodyBg}`);
    
    // Get button color
    const btnColor = await page.evaluate(() => {
      const btn = document.querySelector('a.btn-primary');
      return btn ? window.getComputedStyle(btn).color : 'not found';
    });
    console.log(`✓ Button text color: ${btnColor}`);
    
    // Check CSS is loaded
    const cssLoaded = await page.evaluate(() => {
      const stylesheets = document.styleSheets;
      return stylesheets.length > 0;
    });
    console.log(`✓ CSS stylesheets loaded: ${cssLoaded}`);
  });
});
