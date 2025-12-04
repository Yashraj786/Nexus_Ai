import { test, expect } from '@playwright/test';

test.describe('API Key Configuration Workflow', () => {
  test('Complete API Key Setup and Chat Flow', async ({ page, context }) => {
    console.log('=== STEP 1: Navigate to home ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/01-home-page.png', fullPage: true });

    console.log('=== STEP 2: Click Sign Up ===');
    await page.click('a:has-text("Sign Up")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/02-signup.png', fullPage: true });

    console.log('=== STEP 3: Create test account ===');
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPass123!';
    
    await page.fill('input[id="user_email"]', email);
    await page.fill('input[id="user_password"]', password);
    await page.fill('input[id="user_password_confirmation"]', password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/03-after-signup.png', fullPage: true });

    console.log(`Created account: ${email}`);

    console.log('=== STEP 4: Navigate to Settings ===');
    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/04-settings-page.png', fullPage: true });

    console.log('=== STEP 5: Fill API Configuration ===');
    
    // Select provider
    await page.selectOption('select[name="user[api_provider]"]', 'openai');
    await page.screenshot({ path: 'playwright-screenshots/05-select-provider.png', fullPage: true });

    // Fill model name
    await page.fill('input[name="user[api_model_name]"]', 'gpt-3.5-turbo');
    await page.screenshot({ path: 'playwright-screenshots/06-model-name.png', fullPage: true });

    // Fill API key (using test key)
    await page.fill('input[name="user[encrypted_api_key]"]', 'sk-test-123456789');
    await page.screenshot({ path: 'playwright-screenshots/07-api-key.png', fullPage: true });

    console.log('=== STEP 6: Submit API Configuration ===');
    await page.click('button:has-text("Save Configuration")');
    
    // Wait and capture any errors
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'playwright-screenshots/08-after-save.png', fullPage: true });

    // Check for error messages
    const errorMsg = await page.locator('#api-form-errors').isVisible().catch(() => false);
    if (errorMsg) {
      const errorText = await page.locator('#api-form-errors').textContent();
      console.error('ERROR FOUND:', errorText);
      await page.screenshot({ path: 'playwright-screenshots/08a-ERROR.png', fullPage: true });
    }

    console.log('=== STEP 7: Check if API was saved ===');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/09-after-reload.png', fullPage: true });

    console.log('=== STEP 8: Navigate to New Chat ===');
    await page.goto('http://localhost:3000/chat_sessions/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'playwright-screenshots/10-new-chat.png', fullPage: true });

    console.log('=== STEP 9: Check available personas ===');
    const personaSelect = await page.locator('select').first().isVisible().catch(() => false);
    if (personaSelect) {
      await page.screenshot({ path: 'playwright-screenshots/11-personas.png', fullPage: true });
    }

    console.log('✓ Test completed');
  });
});
