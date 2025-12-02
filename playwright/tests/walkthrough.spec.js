// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Nexus AI Comprehensive Walkthrough', () => {
  const screenshotDir = '/Users/yashramteke/Desktop/nexus_walkthrough';

  test('01-homepage-landing-page', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, '01-homepage.png'), fullPage: true });
    expect(await page.title()).toContain('Nexus AI');
  });

  test('02-login-page', async ({ page }) => {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, '02-login-page.png'), fullPage: true });
    expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('03-register-page', async ({ page }) => {
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, '03-register-page.png'), fullPage: true });
    expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('04-chat-sessions-logged-in', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('input[type="submit"]');
    await page.waitForURL('**/chat_sessions');
    await page.screenshot({ path: path.join(screenshotDir, '04-chat-sessions-index.png'), fullPage: true });
  });

  test('05-new-session-page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('input[type="submit"]');
    await page.waitForURL('**/chat_sessions');
    await page.click('text=New Session');
    await page.waitForURL('**/chat_sessions/new');
    await page.screenshot({ path: path.join(screenshotDir, '05-new-session-page.png'), fullPage: true });
  });

  test('06-chat-session-view', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('input[type="submit"]');
    await page.waitForURL('**/chat_sessions');
    await page.click('a[href*="/chat_sessions/c"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '06-chat-session-view.png'), fullPage: true });
  });

  test('07-settings-page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('input[type="submit"]');
    await page.waitForURL('**/chat_sessions');
    await page.goto('http://localhost:3000/settings');
    await page.screenshot({ path: path.join(screenshotDir, '07-settings-page.png'), fullPage: true });
  });

  test('08-admin-dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('input[type="submit"]');
    await page.waitForURL('**/chat_sessions');
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.screenshot({ path: path.join(screenshotDir, '08-admin-dashboard.png'), fullPage: true });
  });

  test('09-mobile-view', async ({ browser }) => {
    const mobileContext = await browser.newContext({ 
      viewport: { width: 375, height: 667 }
    });
    const page = await mobileContext.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, '09-mobile-homepage.png'), fullPage: true });
    await mobileContext.close();
  });
});
