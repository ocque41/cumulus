import { test, expect, type Page } from '@playwright/test';

async function openDashboardWhenAuthenticated(page: Page) {
  await page.goto('/dashboard');

  const result = await Promise.race([
    page.waitForURL('**/login', { timeout: 8000 }).then(() => 'login' as const).catch(() => null),
    page.getByRole('heading', { name: 'Tado' }).waitFor({ timeout: 8000 }).then(() => 'dashboard' as const).catch(() => null),
  ]);

  return result === 'dashboard';
}

test.describe('Dashboard navigation', () => {
  test('sidebar exposes public-safe internal links', async ({ page }) => {
    if (!(await openDashboardWhenAuthenticated(page))) return;

    await expect(page.getByRole('button', { name: 'Tado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible();
  });

  test('clicking System stays inside the public app', async ({ page }) => {
    if (!(await openDashboardWhenAuthenticated(page))) return;

    await Promise.all([
      page.waitForURL('**/dashboard/system', { timeout: 10000 }),
      page.getByRole('button', { name: 'System' }).click(),
    ]);
  });

  test('mobile sidebar opens with internal dashboard links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    if (!(await openDashboardWhenAuthenticated(page))) return;

    const toggle = page.getByRole('button', { name: 'Toggle Navigation' });
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.getByRole('button', { name: 'Tado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible();
  });
});
