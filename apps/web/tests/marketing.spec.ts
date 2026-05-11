import { expect, test } from '@playwright/test';

test.describe('marketing conversion pages', () => {
  test('home page renders the Dome landing narrative', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dome');
    await expect(page.getByText('Local-first desktop system for dual-note workflows', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Request Build' }).first()).toHaveAttribute('href', '/contact');
    await expect(page.getByRole('heading', { name: 'One system, four operational surfaces.' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'user.md' })).toBeVisible();
    await page.getByRole('tab', { name: 'calendar' }).click();
    await expect(page.getByText('The calendar is there so overnight automation remains inspectable.', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Run your daily operations with one clear ecosystem.' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'All products in one federation map' })).toHaveCount(0);
  });

  test('models page shows paid-only cards and checkout routes', async ({ page }) => {
    await page.goto('/models');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Choose your operating level');
    await expect(page.getByRole('heading', { name: 'Access' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro Monthly' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro Annual' })).toBeVisible();
    await expect(page.getByText('Free', { exact: true })).toHaveCount(0);

    const accessLink = page.getByRole('link', { name: 'Buy Access' }).first();
    await expect(accessLink).toHaveAttribute('href', /\/checkout\/start\?/);
  });

  test('spanish locale cookie controls render language and currency', async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'cml_locale',
        value: 'es',
        domain: '127.0.0.1',
        path: '/',
      },
      {
        name: 'cml_currency',
        value: 'EUR',
        domain: '127.0.0.1',
        path: '/',
      },
    ]);

    const page = await context.newPage();
    await page.goto('/models');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Elige tu nivel operativo');
    await expect(page.getByText('99', { exact: false }).first()).toBeVisible();

    await context.close();
  });
});
