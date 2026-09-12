import { test, expect } from '@playwright/test';
import { login, navigateSidebar } from './helpers';

test.describe('Patients', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'receptionist');
    await navigateSidebar(page, 'Patients');
  });

  test('list loads', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });

  test('open new patient modal', async ({ page }) => {
    await page.getByRole('button', { name: /new patient/i }).click();
    await expect(page.getByRole('dialog').or(page.locator('[role="dialog"]')).or(page.getByText(/general info/i))).toBeVisible({ timeout: 10_000 });
  });

  test('search patients', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible()) {
      await search.fill('test');
      await page.waitForTimeout(500);
    }
  });
});
