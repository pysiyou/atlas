import { Page, expect } from '@playwright/test';

export const USERS = {
  admin: { username: 'admin', password: 'admin123' },
  receptionist: { username: 'receptionist', password: 'recept123' },
  labtech: { username: 'labtech', password: 'lab123' },
  labtech_plus: { username: 'labtech_plus', password: 'labplus123' },
} as const;

export async function login(page: Page, role: keyof typeof USERS = 'admin') {
  await page.goto('/login');
  const u = USERS[role];
  await page.locator('#username').fill(u.username);
  await page.locator('#password').fill(u.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
}

export async function navigateSidebar(page: Page, label: string) {
  await page.getByRole('link', { name: label, exact: true }).click();
  await page.waitForLoadState('networkidle');
}
