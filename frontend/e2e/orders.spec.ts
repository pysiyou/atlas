import { test, expect } from '@playwright/test';
import { login, navigateSidebar } from './helpers';

test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'receptionist');
    await navigateSidebar(page, 'Orders');
  });

  test('list loads', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });

  test('open new order modal', async ({ page }) => {
    await page.getByRole('button', { name: /new order/i }).click();
    await expect(page.getByRole('dialog').or(page.getByText(/select patient|patient/i).first())).toBeVisible({ timeout: 10_000 });
  });
});
