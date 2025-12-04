import { test, expect } from '@playwright/test';

test.describe('UI Audit - Complete Frontend Inspection', () => {
  test('1. Home Page - Before Login', async ({ page }) => {
    console.log('=== HOME PAGE BEFORE LOGIN ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-01-home-before-login.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('2. Sign In Page', async ({ page }) => {
    console.log('=== SIGN IN PAGE ===');
    await page.goto('http://localhost:3000/users/sign_in');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-02-signin.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('3. Sign Up Page', async ({ page }) => {
    console.log('=== SIGN UP PAGE ===');
    await page.goto('http://localhost:3000/users/sign_up');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-03-signup.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('4. Login and View Dashboard', async ({ page, context }) => {
    console.log('=== DASHBOARD AFTER LOGIN ===');
    // Use stored auth if available, otherwise create test user
    const cookies = await context.cookies();
    if (cookies.length === 0) {
      // Create test account
      await page.goto('http://localhost:3000/users/sign_up');
      await page.fill('input[name="user[email]"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="user[password]"]', 'TestPassword123!');
      await page.fill('input[name="user[password_confirmation]"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-04-dashboard.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('5. Settings Page', async ({ page, context }) => {
    console.log('=== SETTINGS PAGE ===');
    // First sign in
    const cookies = await context.cookies();
    if (cookies.some(c => c.name.includes('session'))) {
      await page.goto('http://localhost:3000/settings');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'playwright-screenshots/audit-05-settings.png', fullPage: true });
      console.log('✓ Screenshot saved');
    } else {
      console.log('⊘ Not logged in, skipping');
    }
  });

  test('6. Chat Sessions List', async ({ page, context }) => {
    console.log('=== CHAT SESSIONS LIST ===');
    const cookies = await context.cookies();
    if (cookies.some(c => c.name.includes('session'))) {
      await page.goto('http://localhost:3000/chat_sessions');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'playwright-screenshots/audit-06-sessions-list.png', fullPage: true });
      console.log('✓ Screenshot saved');
    } else {
      console.log('⊘ Not logged in, skipping');
    }
  });

  test('7. New Chat Session', async ({ page, context }) => {
    console.log('=== NEW CHAT SESSION ===');
    const cookies = await context.cookies();
    if (cookies.some(c => c.name.includes('session'))) {
      await page.goto('http://localhost:3000/chat_sessions/new');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'playwright-screenshots/audit-07-new-chat.png', fullPage: true });
      console.log('✓ Screenshot saved');
    } else {
      console.log('⊘ Not logged in, skipping');
    }
  });

  test('8. Mobile View - Home', async ({ page }) => {
    console.log('=== MOBILE VIEW - HOME ===');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-08-mobile-home.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('9. Mobile View - Dashboard', async ({ page, context }) => {
    console.log('=== MOBILE VIEW - DASHBOARD ===');
    await page.setViewportSize({ width: 375, height: 667 });
    const cookies = await context.cookies();
    if (cookies.some(c => c.name.includes('session'))) {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'playwright-screenshots/audit-09-mobile-dashboard.png', fullPage: true });
      console.log('✓ Screenshot saved');
    } else {
      console.log('⊘ Not logged in, skipping');
    }
  });

  test('10. Mobile View - Settings', async ({ page, context }) => {
    console.log('=== MOBILE VIEW - SETTINGS ===');
    await page.setViewportSize({ width: 375, height: 667 });
    const cookies = await context.cookies();
    if (cookies.some(c => c.name.includes('session'))) {
      await page.goto('http://localhost:3000/settings');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'playwright-screenshots/audit-10-mobile-settings.png', fullPage: true });
      console.log('✓ Screenshot saved');
    } else {
      console.log('⊘ Not logged in, skipping');
    }
  });
});
