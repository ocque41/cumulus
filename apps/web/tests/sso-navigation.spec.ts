import { test, expect } from '@playwright/test';

test.describe('Dashboard navigation', () => {
  test('sidebar exposes public-safe internal links', async ({ page }) => {
    await page.goto('/dashboard');
    if (page.url().includes('sign-in') || page.url().includes('login')) return;

    await expect(page.getByRole('button', { name: 'Tado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible();
  });

  test('clicking System stays inside the public app', async ({ page }) => {
    await page.goto('/dashboard');
    if (page.url().includes('sign-in') || page.url().includes('login')) return;

    await page.getByRole('button', { name: 'System' }).click();
    await page.waitForURL('**/dashboard/system', { timeout: 10000 });
  });

  test('mobile sidebar opens with internal dashboard links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    if (page.url().includes('sign-in') || page.url().includes('login')) return;

    const toggle = page.getByRole('button', { name: 'Toggle Navigation' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.getByRole('button', { name: 'Tado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible();
  });
});
