import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const screenshotDir = '/Users/yashramteke/Desktop/nexus_screenshots';

// Create directory if it doesn't exist
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test('Capture all frontend pages', async ({ page }) => {
  console.log('\n📸 Taking screenshots of Nexus AI frontend...\n');

  // 1. Landing Page - Desktop
  console.log('1️⃣  Landing Page (Desktop - 1920px)');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${screenshotDir}/01_landing_desktop.png`, fullPage: true });
  console.log('   ✅ Saved: 01_landing_desktop.png\n');

   // 2. Login Page - Desktop
   console.log('2️⃣  Login Page (Desktop - 1920px)');
   await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
   await page.screenshot({ path: `${screenshotDir}/02_login_desktop.png`, fullPage: true });
   console.log('   ✅ Saved: 02_login_desktop.png\n');

   // 3. Signup Page - Desktop
   console.log('3️⃣  Signup Page (Desktop - 1920px)');
   await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
   await page.screenshot({ path: `${screenshotDir}/03_signup_desktop.png`, fullPage: true });
   console.log('   ✅ Saved: 03_signup_desktop.png\n');

  // 4. Mobile View - Landing Page
  console.log('4️⃣  Landing Page (Mobile - 375px)');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${screenshotDir}/04_landing_mobile.png`, fullPage: true });
  console.log('   ✅ Saved: 04_landing_mobile.png\n');

   // 5. Mobile View - Login Page
   console.log('5️⃣  Login Page (Mobile - 375px)');
   await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
   await page.screenshot({ path: `${screenshotDir}/05_login_mobile.png`, fullPage: true });
   console.log('   ✅ Saved: 05_login_mobile.png\n');

  // 6. Tablet View - Landing Page
  console.log('6️⃣  Landing Page (Tablet - 768px)');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${screenshotDir}/06_landing_tablet.png`, fullPage: true });
  console.log('   ✅ Saved: 06_landing_tablet.png\n');

  console.log('════════════════════════════════════════════════════════════');
  console.log('🎉 All screenshots saved to: ~/Desktop/nexus_screenshots/');
  console.log('════════════════════════════════════════════════════════════');
});
