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

  // This test would require authentication, which is challenging in E2E tests
  // In a real test suite, we would use test accounts or mock the authentication
  test.skip('should allow admin to add a gift', async ({ page }) => {
    // Log in as admin (this would need to be implemented)
    // await loginAsAdmin(page);
    
    // Click the add gift button
    await page.click('#add-gift-btn');
    
    // Fill out the form
    await page.fill('#gift-title', 'Test Gift');
    await page.fill('#gift-hyperlink', 'https://example.com/test');
    await page.fill('#gift-note', 'This is a test gift');
    
    // Submit the form
    await page.click('#submit-btn');
    
    // Check that the gift was added
    await expect(page.locator('text=Test Gift')).toBeVisible();
  });
});

// Helper function to simulate admin login
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
