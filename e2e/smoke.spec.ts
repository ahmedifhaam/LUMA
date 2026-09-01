import { expect, test } from '@playwright/test';

test('library shell loads with an empty state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Add Book' })).toBeVisible();
  await expect(page.getByText('No books yet.')).toBeVisible();
});
