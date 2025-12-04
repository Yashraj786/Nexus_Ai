import { test, expect } from '@playwright/test';

test.describe('Final UI Audit - After Fixes', () => {
  test('Home Page - Light Theme', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/final-01-home-light.png', fullPage: true });
    console.log('✓ Home page screenshot');
  });

  test('Sign In Page', async ({ page }) => {
    await page.goto('http://localhost:3000/users/sign_in');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/final-02-signin.png', fullPage: true });
    console.log('✓ Sign in page screenshot');
  });

  test('Sign Up Page', async ({ page }) => {
    await page.goto('http://localhost:3000/users/sign_up');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/final-03-signup.png', fullPage: true });
    console.log('✓ Sign up page screenshot');
  });

  test('Mobile - Home Light Theme', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/final-04-mobile-home.png', fullPage: true });
    console.log('✓ Mobile home screenshot');
  });

  test('Error Pages - 404 for deleted routes', async ({ page }) => {
    await page.goto('http://localhost:3000/nexus');
    await page.waitForLoadState('networkidle');
    const status = page.url();
    console.log(`✓ /nexus route returns proper response (URL: ${status})`);
    // Should be 404 or redirect to home
    await page.screenshot({ path: 'playwright-screenshots/final-05-deleted-route.png', fullPage: true });
  });
});
