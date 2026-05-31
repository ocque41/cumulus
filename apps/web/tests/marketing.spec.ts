import { expect, test } from '@playwright/test';

test.describe('marketing conversion pages', () => {
  test('home page renders the Cumulus create command narrative', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Create a Cumulus app.');
    await expect(page.getByText('Run one command. Choose the parts. Get a ready app.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy command: npm create @cmls@latest' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toHaveAttribute('href', '/dashboard');
    await expect(page.getByRole('heading', { name: 'Pick how much app you want.' })).toBeVisible();
    await expect(page.getByText('full', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('agent-auth', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Choose where workspace data lives.' })).toBeVisible();
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

  test('models page renders the create command surface', async ({ page }) => {
    const response = await page.goto('/models');

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Create a Cumulus app.');
    await expect(page.getByRole('heading', { name: 'The defaults are made for a fast start.' })).toBeVisible();
    await expect(page.getByText('npm create @cmls@latest -- --template outer --agent-auth hosted', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro', exact: true })).toHaveCount(0);
  });

  test('locale cookies do not break the create command surface', async ({ browser }) => {
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

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Create a Cumulus app.');
    await expect(page.getByRole('button', { name: 'Copy command: npm create @cmls@latest' }).first()).toBeVisible();

    await context.close();
  });
});
