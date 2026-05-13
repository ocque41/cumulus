import { expect, test } from '@playwright/test';

test.describe('marketing conversion pages', () => {
  test('home page renders the Cumulus studio and terminal narrative', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cumulus');
    await expect(page.getByText('Tools and infrastructure for people building with AI.', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Talk to Cumulus' }).first()).toHaveAttribute('href', '/contact');
    await expect(page.getByRole('heading', { name: 'Open Cumulus from a terminal.' })).toBeVisible();
    await expect(page.getByText('horizontal link row', { exact: false })).toBeVisible();
    await expect(page.getByText('npx cumulush /tado', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Run your daily operations with one clear ecosystem.' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'All products in one federation map' })).toHaveCount(0);
  });

  test('models page shows paid-only cards and checkout routes', async ({ page }) => {
    await page.goto('/models');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Choose your plan');
    await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toBeVisible();
    await expect(page.getByText('Full access to Tado').first()).toBeVisible();
    await expect(page.getByText('Free', { exact: true })).toHaveCount(0);

    const proLink = page.getByRole('link', { name: 'Start Pro' }).first();
    await expect(proLink).toHaveAttribute('href', /\/checkout\/start\?/);
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

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Elige tu plan');
    await expect(page.getByText('10 €/mes', { exact: false }).first()).toBeVisible();

    await context.close();
  });
});
