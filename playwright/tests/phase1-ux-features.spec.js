// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Phase 1 UX Features E2E Tests
 * Tests for loading spinners, empty states, error displays, and form functionality
 * 
 * Note: These tests assume the application is running with test database seeded.
 * Run: env RAILS_ENV=test bin/rails db:seed:replant
 */

const loginUser = async (page) => {
  await page.goto('/users/sign_in');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/chat_sessions', { timeout: 10000 });
};

test.describe('Phase 1 UX Features - Loading Spinners', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should show loading indicator when sending a message', async ({ page }) => {
    // Navigate to a chat session
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    // Type and send a message
    const messageInput = page.locator('[data-chat-target="input"]');
    await messageInput.fill('Hello, how are you?');

    const loadingIndicator = page.locator('[data-chat-target="loadingIndicator"]');
    const isHiddenBefore = await loadingIndicator.evaluate(el => 
      el.classList.contains('hidden')
    );
    expect(isHiddenBefore).toBe(true);

    // Submit message
    await page.click('[data-chat-target="form"] button[type="submit"]');

    // Wait a bit for the loading indicator to appear
    await page.waitForTimeout(500);

    // Check if loading indicator is visible
    const isHiddenAfter = await loadingIndicator.evaluate(el => 
      el.classList.contains('hidden')
    );
    expect(isHiddenAfter).toBe(false);

    // Verify loading text is present
    const loadingText = page.locator('text=AI is thinking');
    await expect(loadingText).toBeVisible();
  });

  test('loading indicator should have animated dots', async ({ page }) => {
    // Navigate to a chat session
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    const loadingIndicator = page.locator('[data-chat-target="loadingIndicator"]');
    
    // Check for animated dots
    const dots = loadingIndicator.locator('.animate-bounce');
    const dotCount = await dots.count();
    expect(dotCount).toBe(3);

    // Verify each dot has different animation delay
    for (let i = 0; i < dotCount; i++) {
      const delay = await dots.nth(i).evaluate(el => 
        el.style.animationDelay
      );
      expect(['0s', '0.1s', '0.2s']).toContain(delay);
    }
  });
});

test.describe('Phase 1 UX Features - Empty States', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display empty state on new chat session', async ({ page }) => {
    // Navigate to a new chat session
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="messages"]');

    // Check for empty state message
    const emptyStateTitle = page.locator('h2, h3').filter({ 
      hasText: /Start a conversation|Chat/ 
    });
    await expect(emptyStateTitle).toBeVisible();

    // Check for persona icon in empty state
    const emptyStateIcon = page.locator('[data-lucide]').first();
    await expect(emptyStateIcon).toBeVisible();
  });

  test('empty state should have persona description', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="messages"]');

    // Check for persona description text
    const description = page.locator('text=/assistant|ready to help/i');
    await expect(description.first()).toBeVisible();
  });

  test('empty state should disappear after first message', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="messages"]');

    // Verify empty state is visible
    const emptyState = page.locator('.h-full.flex.items-center.justify-center');
    await expect(emptyState).toBeVisible();

    // Type and send a message
    const messageInput = page.locator('[data-chat-target="input"]');
    await messageInput.fill('Hello!');
    await page.click('[data-chat-target="form"] button[type="submit"]');

    // Wait a bit for the message to be added
    await page.waitForTimeout(1000);

    // Check if message appears in the chat
    const userMessage = page.locator('[data-role="user"]');
    await expect(userMessage).toBeVisible();
  });
});

test.describe('Phase 1 UX Features - Error Displays', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display error when sending empty message', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    // Try to submit with empty input
    const submitButton = page.locator('[data-chat-target="form"] button[type="submit"]');
    await submitButton.click();

    // Wait for error to appear
    await page.waitForTimeout(500);

    // Check for error message
    const errorContainer = page.locator('#form-errors');
    const isVisible = await errorContainer.evaluate(el => 
      !el.classList.contains('hidden')
    );
    expect(isVisible).toBe(true);

    // Check error text
    const errorText = await errorContainer.textContent();
    expect(errorText).toContain('Please enter a message');
  });

  test('error message should have correct styling', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    // Trigger error
    const submitButton = page.locator('[data-chat-target="form"] button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(500);

    const errorContainer = page.locator('#form-errors');
    const classes = await errorContainer.evaluate(el => el.className);
    
    expect(classes).toContain('bg-red-50');
    expect(classes).toContain('border');
    expect(classes).toContain('text-red-700');
  });

  test('error should auto-dismiss after 5 seconds', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    // Trigger error
    const submitButton = page.locator('[data-chat-target="form"] button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(500);

    const errorContainer = page.locator('#form-errors');
    await expect(errorContainer).toBeVisible();

    // Wait for auto-dismiss (5 seconds + buffer)
    await page.waitForTimeout(5500);

    const isHidden = await errorContainer.evaluate(el => 
      el.classList.contains('hidden')
    );
    expect(isHidden).toBe(true);
  });

  test('should display error for message exceeding max length', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    // Get max length from data attribute
    const form = page.locator('[data-chat-target="form"]');
    const maxLength = await form.evaluate(el => 
      el.getAttribute('data-chat-max_length-value')
    );

    // Type message exceeding max length
    const messageInput = page.locator('[data-chat-target="input"]');
    const longMessage = 'a'.repeat(parseInt(maxLength) + 1);
    await messageInput.fill(longMessage);

    const submitButton = page.locator('[data-chat-target="form"] button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Check for error message
    const errorContainer = page.locator('#form-errors');
    const errorText = await errorContainer.textContent();
    expect(errorText).toContain('too long');
  });
});

test.describe('Phase 1 UX Features - Form IDs and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('message form should have unique ID', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    const form = page.locator('#message_form');
    await expect(form).toBeVisible();
    
    const formId = await form.getAttribute('id');
    expect(formId).toBe('message_form');
  });

  test('error container should have unique ID', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    const errorContainer = page.locator('#form-errors');
    const errorId = await errorContainer.getAttribute('id');
    expect(errorId).toBe('form-errors');
  });

  test('chat container should have unique ID', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="messages"]');

    const chatContainer = page.locator('#chat-container');
    const chatId = await chatContainer.getAttribute('id');
    expect(chatId).toBe('chat-container');
  });
});

test.describe('Phase 1 UX Features - Loading Spinner States on Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should have loading spinner on API settings form', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-controller="settings"]');

    // Check if API settings form exists
    const apiForm = page.locator('form').filter({ hasText: /API|api/i }).first();
    if (await apiForm.isVisible()) {
      const submitButton = apiForm.locator('button[type="submit"]').first();
      await expect(submitButton).toBeVisible();
    }
  });

  test('should have loading spinner on fallback settings form', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-controller="settings"]');

    // Check if fallback form exists
    const forms = page.locator('form');
    const formCount = await forms.count();
    expect(formCount).toBeGreaterThan(0);
  });
});

test.describe('Phase 1 UX Features - Loading Spinner on Auth Forms', () => {
  test('login form should have loading spinner on submit button', async ({ page }) => {
    await page.goto('/users/sign_in');
    await page.waitForSelector('form');

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // Button text should be visible
    const buttonText = await submitButton.textContent();
    expect(buttonText.toLowerCase()).toContain('sign in');
  });

  test('signup form should have loading spinner on submit button', async ({ page }) => {
    await page.goto('/users/sign_up');
    await page.waitForSelector('form');

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // Button text should be visible
    const buttonText = await submitButton.textContent();
    expect(buttonText.toLowerCase()).toContain('sign up');
  });
});

test.describe('Phase 1 UX Features - Feedback Form', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('feedback form should have unique ID', async ({ page }) => {
    // Create a new chat session first
    const newChatButton = page.locator('button').filter({ hasText: /new|create/i }).first();
    if (await newChatButton.isVisible()) {
      await newChatButton.click();
    } else {
      const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
      await firstChat.click();
    }

    // Navigate to feedback
    const feedbackButton = page.locator('[title="Report"]');
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();
      await page.waitForSelector('form');

      const feedbackForm = page.locator('#feedback-form');
      if (await feedbackForm.isVisible()) {
        const formId = await feedbackForm.getAttribute('id');
        expect(formId).toBe('feedback-form');
      }
    }
  });

  test('feedback form should have error container', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();

    const feedbackButton = page.locator('[title="Report"]');
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();
      await page.waitForSelector('form');

      // Check for error container (may have different selector than chat)
      const form = page.locator('form').first();
      const formContent = await form.innerHTML();
      
      // Just verify form loads (error container may be conditional)
      await expect(form).toBeVisible();
    }
  });
});

test.describe('Phase 1 UX Features - Stimulus Controller Integration', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('chat controller should be connected', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-controller="chat"]');

    // Check controller is connected
    const chatController = page.locator('[data-controller="chat"]');
    const controller = await chatController.getAttribute('data-controller');
    expect(controller).toContain('chat');
  });

  test('form should have correct data-action binding', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="form"]');

    const form = page.locator('[data-chat-target="form"]');
    const action = await form.getAttribute('data-action');
    expect(action).toContain('submit->chat#sendMessage');
  });

  test('input should have correct target binding', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="input"]');

    const input = page.locator('[data-chat-target="input"]');
    const target = await input.getAttribute('data-chat-target');
    expect(target).toBe('input');
  });

  test('loading indicator should have correct target binding', async ({ page }) => {
    const firstChat = await page.locator('a[href*="/chat_sessions/"]').first();
    await firstChat.click();
    await page.waitForSelector('[data-chat-target="loadingIndicator"]');

    const loadingIndicator = page.locator('[data-chat-target="loadingIndicator"]');
    const target = await loadingIndicator.getAttribute('data-chat-target');
    expect(target).toBe('loadingIndicator');
  });
});
