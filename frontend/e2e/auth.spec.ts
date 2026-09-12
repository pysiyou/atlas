import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Auth', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill('bad');
    await page.locator('#password').fill('bad');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/login/);
  });

  for (const role of Object.keys(USERS) as (keyof typeof USERS)[]) {
    test(`login as ${role}`, async ({ page }) => {
      await login(page, role);
      await expect(page.locator('main')).toBeVisible();
    });
  }

  test('protected route redirects', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/login/);
  });
});
