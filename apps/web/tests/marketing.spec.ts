import { expect, test } from '@playwright/test';

test.describe('marketing conversion pages', () => {
  test('home page renders the Cumulus DB narrative', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cumulus DB');
    await expect(page.getByText('The database for your agent, for free.', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start free' }).first()).toHaveAttribute('href', '#cumulus-db');
    await expect(page.getByRole('heading', { name: 'Start Cumulus DB from a terminal.' })).toBeVisible();
    await expect(page.locator('#terminal code')).toContainText('npm run db:build');
    await expect(page.locator('#terminal code')).toContainText('npm run db:start');
    await expect(page.getByRole('heading', { name: 'Run your daily operations with one clear ecosystem.' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'All products in one federation map' })).toHaveCount(0);
  });

  test('docs page documents Cumulus DB setup', async ({ page }) => {
    const response = await page.goto('/docs');

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Start Cumulus DB for your agent.');
    await expect(page.getByText('npm run db:build', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('npm run db:start', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('CUMULUS_DB_ENGINE=jsonl', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('CUMULUS_DB_AUTO_MIGRATE=false', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('The public app talks to Cumulus DB through HTTP/token APIs', { exact: false })).toBeVisible();
  });

  test('models page shows the free Cumulus DB plan', async ({ page }) => {
    await page.goto('/models');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Run Cumulus DB for free');
    await expect(page.getByRole('heading', { name: 'Cumulus DB Free', exact: true })).toBeVisible();
    await expect(page.getByText('Free', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toHaveCount(0);

    const docsLink = page.getByRole('link', { name: 'Read setup docs' }).first();
    await expect(docsLink).toHaveAttribute('href', '/docs');
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

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ejecuta Cumulus DB gratis');
    await expect(page.getByText('Gratis', { exact: true }).first()).toBeVisible();

    await context.close();
  });
});
