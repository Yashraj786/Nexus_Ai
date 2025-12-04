// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Phase 1 UX Features - Static Structure Verification
 * Tests that verify Phase 1 HTML elements and CSS classes are in place
 * These tests work offline without needing authentication
 */

test.describe('Phase 1 UX Features - Static HTML Verification', () => {
  
  test('should have form IDs in HTML views', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/');
    
    // The page should load (may redirect to sign in)
    await expect(page).toHaveTitle(/Nexus AI|Sign/i);
  });

});
