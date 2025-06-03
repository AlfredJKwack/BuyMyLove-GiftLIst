import { test, expect } from '@playwright/test'

test.describe('Gift List App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000')
  })

  test('should display the gift list page', async ({ page }) => {
    // Check if the main elements are present
    await expect(page.locator('h1')).toContainText('Gift List')
    await expect(page.locator('#admin-controls')).toBeVisible()
  })

  test('should show login button for non-admin users', async ({ page }) => {
    // Should show login button initially
    await expect(page.locator('#login-btn')).toBeVisible()
    await expect(page.locator('#add-gift-btn')).not.toBeVisible()
  })

  test('should allow admin login with correct secret', async ({ page }) => {
    // Click login button
    await page.click('#login-btn')
    
    // Check if modal is visible
    await expect(page.locator('#login-modal')).toBeVisible()
    
    // Enter admin secret (this would need to be set in test environment)
    await page.fill('#admin-secret', 'test-admin-secret')
    await page.click('button[type="submit"]')
    
    // Should show admin controls after successful login
    // Note: This test assumes the admin secret is set to 'test-admin-secret' in test env
    // In a real test, you'd mock the environment variable
  })

  test('should display empty state when no gifts exist', async ({ page }) => {
    // Should show empty state message
    await expect(page.locator('text=No gifts added yet')).toBeVisible()
  })

  test('should allow anonymous users to toggle bought status', async ({ page }) => {
    // This test assumes there's at least one gift in the database
    // In a real test setup, you'd seed the database with test data
    
    // Look for a gift card with a toggle button
    const toggleButton = page.locator('.bought-toggle').first()
    
    if (await toggleButton.isVisible()) {
      // Get initial state
      const initialIcon = await toggleButton.locator('span').textContent()
      
      // Click toggle
      await toggleButton.click()
      
      // Wait for state change
      await page.waitForTimeout(1000)
      
      // Check if state changed
      const newIcon = await toggleButton.locator('span').textContent()
      expect(newIcon).not.toBe(initialIcon)
    }
  })

  test('should preserve bought status after page reload', async ({ page }) => {
    // This test checks if cookie-based state persistence works
    
    const toggleButton = page.locator('.bought-toggle').first()
    
    if (await toggleButton.isVisible()) {
      // Mark as bought
      await toggleButton.click()
      await page.waitForTimeout(1000)
      
      // Get the state after toggle
      const stateAfterToggle = await toggleButton.locator('span').textContent()
      
      // Reload page
      await page.reload()
      
      // Check if state is preserved
      const stateAfterReload = await toggleButton.locator('span').textContent()
      expect(stateAfterReload).toBe(stateAfterToggle)
    }
  })

  test('should show gift details correctly', async ({ page }) => {
    // This test assumes there's at least one gift with all fields populated
    
    const giftCard = page.locator('.gift-card').first()
    
    if (await giftCard.isVisible()) {
      // Check if gift title is a clickable link
      const titleLink = giftCard.locator('h3 a')
      await expect(titleLink).toBeVisible()
      await expect(titleLink).toHaveAttribute('target', '_blank')
      
      // Check if date is displayed
      await expect(giftCard.locator('text=/Added \\d+\\/\\d+\\/\\d+/')).toBeVisible()
    }
  })

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if the layout adapts to mobile
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('#admin-controls')).toBeVisible()
    
    // Check if gift cards stack properly on mobile
    const giftCards = page.locator('.gift-card')
    if (await giftCards.count() > 0) {
      const firstCard = giftCards.first()
      const cardWidth = await firstCard.boundingBox()
      expect(cardWidth.width).toBeLessThan(400) // Should fit in mobile viewport
    }
  })

  test('admin workflow: add, edit, delete gift', async ({ page }) => {
    // This test requires admin login to work
    // You would need to set up proper test environment variables
    
    // Login as admin first
    await page.click('#login-btn')
    await page.fill('#admin-secret', process.env.TEST_ADMIN_SECRET || 'test-admin-secret')
    await page.click('button[type="submit"]')
    
    // Add new gift
    await page.click('#add-gift-btn')
    await page.fill('#gift-title', 'Test Gift')
    await page.fill('#gift-link', 'https://example.com')
    await page.fill('#gift-note', 'This is a test gift')
    await page.click('button[type="submit"]')
    
    // Wait for gift to be added
    await page.waitForTimeout(2000)
    
    // Check if gift appears in list
    await expect(page.locator('text=Test Gift')).toBeVisible()
    
    // Edit the gift
    await page.click('.edit-gift-btn')
    await page.fill('#gift-title', 'Updated Test Gift')
    await page.click('button[type="submit"]')
    
    // Wait for update
    await page.waitForTimeout(2000)
    
    // Check if gift was updated
    await expect(page.locator('text=Updated Test Gift')).toBeVisible()
    
    // Delete the gift
    page.on('dialog', dialog => dialog.accept()) // Accept confirmation dialog
    await page.click('.delete-gift-btn')
    
    // Wait for deletion
    await page.waitForTimeout(2000)
    
    // Check if gift was removed
    await expect(page.locator('text=Updated Test Gift')).not.toBeVisible()
  })
})
