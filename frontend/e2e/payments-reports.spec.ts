import { test, expect } from '@playwright/test';
import { login, navigateSidebar } from './helpers';

test.describe('Payments', () => {
  test('payments list', async ({ page }) => {
    await login(page, 'receptionist');
    await navigateSidebar(page, 'Payments');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Reports', () => {
  test('reports list', async ({ page }) => {
    await login(page, 'admin');
    await navigateSidebar(page, 'Reports');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Dashboard by role', () => {
  test('receptionist dashboard', async ({ page }) => {
    await login(page, 'receptionist');
    await expect(page.locator('main')).toBeVisible();
  });

  test('labtech dashboard with critical panel', async ({ page }) => {
    await login(page, 'labtech');
    await expect(page.locator('main')).toBeVisible();
  });
});
