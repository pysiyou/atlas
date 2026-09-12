import { test, expect } from '@playwright/test';
import { login, navigateSidebar } from './helpers';

test.describe('Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await navigateSidebar(page, 'Catalog');
  });

  test('list shows tests', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText(/HEM001|CBC|blood/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('open test detail', async ({ page }) => {
    await page.getByRole('row').filter({ hasText: /HEM001|CBC/i }).first().click();
    await expect(page).toHaveURL(/catalog\/HEM001/, { timeout: 10_000 });
  });

  test('search catalog', async ({ page }) => {
    const s = page.getByPlaceholder(/search/i).first();
    if (await s.isVisible()) {
      await s.fill('glucose');
      await page.waitForTimeout(500);
    }
  });
});
