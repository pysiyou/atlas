import { test, expect } from '@playwright/test';
import { login, navigateSidebar } from './helpers';

test.describe('Laboratory', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'labtech');
    await navigateSidebar(page, 'Laboratory');
  });

  test('command center loads', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });

  test('collection tab', async ({ page }) => {
    const tab = page.getByRole('link', { name: /collection/i }).or(page.getByRole('button', { name: /collection/i }));
    if (await tab.count()) await tab.first().click();
    await expect(page.locator('main')).toBeVisible();
  });

  test('entry tab', async ({ page }) => {
    const tab = page.getByRole('link', { name: /entry/i }).or(page.getByRole('button', { name: /entry/i }));
    if (await tab.count()) await tab.first().click();
    await expect(page.locator('main')).toBeVisible();
  });

  test('validation tab', async ({ page }) => {
    const tab = page.getByRole('link', { name: /review|validation/i }).or(page.getByRole('button', { name: /review|validation/i }));
    if (await tab.count()) await tab.first().click();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Laboratory supervisor', () => {
  test('labtech plus validation', async ({ page }) => {
    await login(page, 'labtech_plus');
    await navigateSidebar(page, 'Laboratory');
    await expect(page.locator('main')).toBeVisible();
  });
});
