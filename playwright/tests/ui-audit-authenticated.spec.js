import { test, expect } from '@playwright/test';

test.describe('UI Audit - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto('http://localhost:3000/users/sign_in');
    await page.fill('input[id="user_email"]', 'audit-test-1764841417@test.com');
    await page.fill('input[id="user_password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard After Login', async ({ page }) => {
    console.log('=== DASHBOARD AFTER LOGIN ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-04-dashboard.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('Settings Page Full', async ({ page }) => {
    console.log('=== SETTINGS PAGE ===');
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-05-settings.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('Chat Sessions List', async ({ page }) => {
    console.log('=== CHAT SESSIONS LIST ===');
    await page.goto('http://localhost:3000/chat_sessions');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-06-sessions-list.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('New Chat Session Page', async ({ page }) => {
    console.log('=== NEW CHAT SESSION PAGE ===');
    await page.goto('http://localhost:3000/chat_sessions/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-07-new-chat.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('Mobile - Dashboard', async ({ page }) => {
    console.log('=== MOBILE - DASHBOARD ===');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-09-mobile-dashboard.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });

  test('Mobile - Settings', async ({ page }) => {
    console.log('=== MOBILE - SETTINGS ===');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/audit-10-mobile-settings.png', fullPage: true });
    console.log('✓ Screenshot saved');
  });
});
