import { test, expect } from '@playwright/test';
import { login, navigateSidebar } from './helpers';

const MODULES = ['Dashboard', 'Patients', 'Orders', 'Laboratory', 'Payments', 'Reports', 'Catalog'];

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  for (const mod of MODULES) {
    test(`navigate to ${mod}`, async ({ page }) => {
      await navigateSidebar(page, mod);
      await expect(page.locator('main')).toBeVisible();
    });
  }

  test('laboratory tabs', async ({ page }) => {
    await navigateSidebar(page, 'Laboratory');
    for (const tab of [/command center|dashboard/i, /collection/i, /entry/i, /review|validation/i]) {
      const link = page.getByRole('link', { name: tab }).or(page.getByRole('button', { name: tab }));
      if (await link.count()) {
        await link.first().click();
        await expect(page.locator('main')).toBeVisible();
      }
    }
  });
});
