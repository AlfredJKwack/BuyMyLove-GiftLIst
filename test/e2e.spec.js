import { test, expect } from '@playwright/test';

// These tests would normally be run against a real deployment
// or a local development server with a test database

test.describe('Gift List App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/');
  });

  test('should display the gift list page', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle('Gift List App');
    
    // Check that the header contains the app name
    const header = page.locator('h1');
    await expect(header).toContainText('Gift List');
    
    // Check that the navigation links are present
    await expect(page.locator('#nav-list')).toBeVisible();
    await expect(page.locator('#nav-login')).toBeVisible();
  });

  test('should navigate to admin login page', async ({ page }) => {
    // Click the admin login link
    await page.click('#nav-login');
    
    // Check that the login form is displayed
    await expect(page.locator('form#login-form')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('button#login-btn')).toBeVisible();
  });

  test('should show empty state when no gifts are available', async ({ page }) => {
    // This test assumes there are no gifts in the database
    // In a real test, we would set up a test database with known state
    
    // Check for the empty state message
    await expect(page.locator('text=No gifts found')).toBeVisible();
  });

  test('should display error modal for expired OTP link', async ({ page }) => {
    // Navigate to the app with an error hash (simulating Supabase redirect)
    await page.goto('http://localhost:5173/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    
    // Check that the error modal is displayed
    await expect(page.locator('#admin-modal')).toBeVisible();
    await expect(page.locator('.admin-panel h2')).toContainText('Authentication Error');
    
    // Check that the error message is user-friendly
    await expect(page.locator('.admin-info p')).toContainText('Your login link has expired. Please request a new one.');
    
    // Check that the action buttons are present
    await expect(page.locator('#error-close-btn')).toBeVisible();
    await expect(page.locator('#try-again-link')).toBeVisible();
    
    // Check that the URL hash has been cleaned up
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('should close error modal when close button is clicked', async ({ page }) => {
    // Navigate to the app with an error hash
    await page.goto('http://localhost:5173/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    
    // Wait for the modal to appear
    await expect(page.locator('#admin-modal')).toBeVisible();
    
    // Click the close button
    await page.click('#error-close-btn');
    
    // Check that the modal is hidden
    await expect(page.locator('#admin-modal')).toBeHidden();
  });

  test('should navigate to admin login when try again is clicked', async ({ page }) => {
    // Navigate to the app with an error hash
    await page.goto('http://localhost:5173/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    
    // Wait for the modal to appear
    await expect(page.locator('#admin-modal')).toBeVisible();
    
    // Click the try again link
    await page.click('#try-again-link');
    
    // Wait for the modal to reopen with the login form
    await expect(page.locator('#admin-modal')).toBeVisible();
    await expect(page.locator('form#login-form')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    
    // Check that the URL has changed to admin
    await expect(page).toHaveURL('http://localhost:5173/#/admin');
  });

  test('should handle different error types with appropriate messages', async ({ page }) => {
    // Test access denied error
    await page.goto('http://localhost:5173/#error=access_denied&error_description=Access+was+denied');
    await expect(page.locator('.admin-info p')).toContainText('Access was denied. This may be due to an expired or invalid link.');
    
    // Close modal and test another error type
    await page.click('#error-close-btn');
    
    // Test server error
    await page.goto('http://localhost:5173/#error=server_error&error_code=server_error&error_description=Internal+server+error');
    await expect(page.locator('#admin-modal')).toBeVisible();
    await expect(page.locator('.admin-info p')).toContainText('A server error occurred. Please try again later.');
  });

  test('should allow admin to add a gift with mocked authentication', async ({ page }) => {
    // Mock authentication by setting localStorage
    await page.addInitScript(() => {
      // Mock Supabase session
      window.localStorage.setItem('sb-test-auth-token', JSON.stringify({
        access_token: 'mock-admin-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000, // 1 hour from now
        user: {
          id: 'mock-admin-id',
          email: 'admin@example.com'
        }
      }));
    });

    // Mock the fetch calls to edge functions
    await page.route('**/functions/v1/add-gift', async route => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      // Simulate successful gift addition
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-gift-id',
            title: postData.title,
            hyperlink: postData.hyperlink,
            note: postData.note,
            bought: false,
            date_added: new Date().toISOString()
          }
        })
      });
    });

    // Mock the gifts fetch to return our new gift
    await page.route('**/rest/v1/gifts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'mock-gift-id',
            title: 'Test Gift',
            hyperlink: 'https://example.com/test',
            note: 'This is a test gift',
            bought: false,
            date_added: new Date().toISOString()
          }
        ])
      });
    });

    // Navigate to the app
    await page.goto('http://localhost:5173/');
    
    // Navigate to admin page
    await page.click('#nav-login');
    
    // Check that we're in admin mode (should show add gift button)
    await expect(page.locator('#add-gift-btn')).toBeVisible();
    
    // Click the add gift button
    await page.click('#add-gift-btn');
    
    // Fill out the form
    await page.fill('#gift-title', 'Test Gift');
    await page.fill('#gift-hyperlink', 'https://example.com/test');
    await page.fill('#gift-note', 'This is a test gift');
    
    // Submit the form
    await page.click('#submit-btn');
    
    // Check that the gift was added (should appear in the list)
    await expect(page.locator('text=Test Gift')).toBeVisible();
  });

  test('should allow admin to edit a gift with mocked authentication', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-test-auth-token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: { id: 'mock-admin-id', email: 'admin@example.com' }
      }));
    });

    // Mock initial gifts fetch
    await page.route('**/rest/v1/gifts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'existing-gift-id',
            title: 'Existing Gift',
            hyperlink: 'https://example.com/existing',
            note: 'Original note',
            bought: false,
            date_added: new Date().toISOString()
          }
        ])
      });
    });

    // Mock the update gift edge function
    await page.route('**/functions/v1/update-gift', async route => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: postData.giftId,
            ...postData.updates,
            bought: false,
            date_added: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('http://localhost:5173/');
    await page.click('#nav-login');
    
    // Wait for the existing gift to load
    await expect(page.locator('text=Existing Gift')).toBeVisible();
    
    // Click edit button for the gift
    await page.click('[data-testid="edit-gift-existing-gift-id"]');
    
    // Update the form
    await page.fill('#gift-title', 'Updated Gift');
    await page.fill('#gift-note', 'Updated note');
    
    // Submit the form
    await page.click('#submit-btn');
    
    // Check that the gift was updated
    await expect(page.locator('text=Updated Gift')).toBeVisible();
  });

  test('should allow admin to delete a gift with mocked authentication', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-test-auth-token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: { id: 'mock-admin-id', email: 'admin@example.com' }
      }));
    });

    // Mock initial gifts fetch
    await page.route('**/rest/v1/gifts*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'gift-to-delete',
            title: 'Gift to Delete',
            hyperlink: 'https://example.com/delete',
            note: 'Will be deleted',
            bought: false,
            date_added: new Date().toISOString()
          }
        ])
      });
    });

    // Mock the delete gift edge function
    await page.route('**/functions/v1/delete-gift', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.goto('http://localhost:5173/');
    await page.click('#nav-login');
    
    // Wait for the gift to load
    await expect(page.locator('text=Gift to Delete')).toBeVisible();
    
    // Click delete button for the gift
    await page.click('[data-testid="delete-gift-gift-to-delete"]');
    
    // Confirm deletion in modal/dialog
    await page.click('#confirm-delete-btn');
    
    // Check that the gift was removed
    await expect(page.locator('text=Gift to Delete')).not.toBeVisible();
  });

  test('should handle edge function errors gracefully', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-test-auth-token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: { id: 'mock-admin-id', email: 'admin@example.com' }
      }));
    });

    // Mock the add gift edge function to return an error
    await page.route('**/functions/v1/add-gift', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Server error occurred'
        })
      });
    });

    await page.goto('http://localhost:5173/');
    await page.click('#nav-login');
    await page.click('#add-gift-btn');
    
    // Fill out the form
    await page.fill('#gift-title', 'Test Gift');
    await page.fill('#gift-hyperlink', 'https://example.com/test');
    
    // Submit the form
    await page.click('#submit-btn');
    
    // Check that error message is displayed
    await expect(page.locator('text=Server error occurred')).toBeVisible();
  });
});

// Helper function to simulate admin login (kept for reference)
async function loginAsAdmin(page) {
  // Navigate to login page
  await page.click('#nav-login');
  
  // Enter admin email
  await page.fill('#email', 'admin@example.com');
  
  // Submit the form
  await page.click('#login-btn');
  
  // In a real test, we would need to handle the OTP flow
  // For testing purposes, we might mock the authentication service
}
