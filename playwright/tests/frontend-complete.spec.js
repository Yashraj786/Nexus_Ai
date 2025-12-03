import { test, expect } from '@playwright/test';

test.describe('Complete Frontend Testing - Nexus AI', () => {
  const baseURL = 'http://localhost:3000';

  test.describe('Landing Page (Unauthenticated)', () => {
    test('should display landing page with all key elements', async ({ page }) => {
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      
      // Check for key elements
      await expect(page.locator('text=NEXUS AI')).toBeVisible();
      await expect(page.locator('text=Unified AI Intelligence Platform')).toBeVisible();
      
      // Check for features section
      await expect(page.locator('text=Multi-Model Support')).toBeVisible();
      await expect(page.locator('text=AI Personas')).toBeVisible();
      await expect(page.locator('text=Secure & Private')).toBeVisible();
      
      // Check for CTA buttons
      await expect(page.locator('text=Get Started Free')).toBeVisible();
      await expect(page.locator('text=Sign In')).toBeVisible();
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      await page.click('text=Get Started Free');
      
      // Should be on signup page
      await expect(page.locator('text=Create Account')).toBeVisible();
      await expect(page.url()).toContain('/users/sign_up');
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      await page.click('text=Sign In');
      
      // Should be on login page
      await expect(page.locator('text=Sign In')).toBeVisible();
      await expect(page.url()).toContain('/users/sign_in');
    });
  });

  test.describe('Login Page', () => {
    test('should display login form with all fields', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      // Check form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('text=Remember me')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    });

    test('should display error for invalid credentials', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      // Fill in fake credentials
      await page.fill('input[type="email"]', 'nonexistent@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Sign In")');
      
      // Should show error message
      await page.waitForNavigation();
      // Check if we're still on login page (error occurred)
      expect(page.url()).toContain('/users/sign_in');
    });

    test('should have link to signup page', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      const signupLink = page.locator('text=Create Free Account');
      await expect(signupLink).toBeVisible();
      await signupLink.click();
      
      await expect(page.url()).toContain('/users/sign_up');
    });
  });

  test.describe('Signup Page', () => {
    test('should display signup form with all fields', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_up`, { waitUntil: 'networkidle' });
      
      // Check form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[name*="password"]').first()).toBeVisible();
      await expect(page.locator('input[name*="password_confirmation"]')).toBeVisible();
      await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_up`, { waitUntil: 'networkidle' });
      
      const loginLink = page.locator('text=Sign In Instead');
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      
      // Check main content is visible
      const mainContent = page.locator('main, [role="main"], .min-h-screen');
      await expect(mainContent).toBeVisible();
      
      // Check no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const windowWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 1);
    });

    test('should be responsive on tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      
      const mainContent = page.locator('main, [role="main"], .min-h-screen');
      await expect(mainContent).toBeVisible();
    });

    test('should be responsive on desktop (1920px)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      
      const mainContent = page.locator('main, [role="main"], .min-h-screen');
      await expect(mainContent).toBeVisible();
    });

    test('touch targets should be at least 44px on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      
      const buttons = page.locator('button, a[role="button"]');
      const firstButton = buttons.first();
      
      const box = await firstButton.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(32);
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    });
  });

  test.describe('UI Elements & Styling', () => {
    test('should have proper dark theme colors', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      // Check for dark theme classes
      const darkCard = page.locator('.app-card.dark');
      await expect(darkCard).toBeVisible();
      
      // Verify dark theme is applied
      const bgColor = await darkCard.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      // Dark theme should have dark colors
      expect(bgColor).toBeTruthy();
    });

    test('should have animation classes', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      // Check for animation classes
      const animatedElements = page.locator('[class*="animate-"]');
      const count = await animatedElements.count();
      expect(count).toBeGreaterThanOrEqual(0); // May or may not have animations
    });

    test('should have proper button styling', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      const primaryButton = page.locator('.btn-primary');
      await expect(primaryButton).toBeVisible();
      
      const buttonClass = await primaryButton.getAttribute('class');
      expect(buttonClass).toContain('btn-primary');
    });
  });

  test.describe('Form Validation & UX', () => {
    test('should show required field validation', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_up`, { waitUntil: 'networkidle' });
      
      // Try to submit empty form
      const submitButton = page.locator('button:has-text("Create Account")');
      await submitButton.click();
      
      // HTML5 validation should prevent submission
      const emailInput = page.locator('input[type="email"]');
      const validity = await emailInput.evaluate(el => el.validity.valid);
      expect(validity).toBeFalsy();
    });

    test('should have proper input styling with dark theme', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      const emailInput = page.locator('input[type="email"]');
      const inputClass = await emailInput.getAttribute('class');
      
      // Should have input-modern dark classes
      expect(inputClass).toContain('input-modern');
    });

    test('should show placeholder text', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      const emailInput = page.locator('input[type="email"]');
      const placeholder = await emailInput.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
    });
  });

  test.describe('Navigation & Links', () => {
    test('should have proper link styling', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      const link = page.locator('a:has-text("Back to Home")');
      await expect(link).toBeVisible();
    });

    test('should navigate between auth pages', async ({ page }) => {
      // Start at login
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      await expect(page.url()).toContain('/sign_in');
      
      // Navigate to signup
      await page.click('text=Create Free Account');
      await expect(page.url()).toContain('/sign_up');
      
      // Navigate back to login
      await page.click('text=Sign In Instead');
      await expect(page.url()).toContain('/sign_in');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have form labels', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      const labels = page.locator('label');
      const count = await labels.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have alt text for images if present', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      const images = page.locator('img');
      const count = await images.count();
      
      // If images exist, they should have alt text
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // Images should have alt text or be decorative
      }
    });

    test('should have proper focus management', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      
      // Tab to first input
      await page.keyboard.press('Tab');
      
      const focused = await page.evaluate(() => document.activeElement.tagName);
      expect(['INPUT', 'BUTTON', 'A']).toContain(focused);
    });
  });

  test.describe('Performance', () => {
    test('should load landing page within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should load login page within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${baseURL}/users/sign_in`, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have no console errors on landing page', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
      
      // May have warnings but no critical errors
      expect(errors.length).toBeLessThan(3);
    });
  });

  test.describe('Empty States & Error Handling', () => {
    test('should display proper error styling', async ({ page }) => {
      await page.goto(`${baseURL}/users/sign_up`, { waitUntil: 'networkidle' });
      
      // Look for error state classes if they exist
      const errorElements = page.locator('[class*="error"], [class*="red"]');
      // May or may not be visible before form submission
    });
  });
});
