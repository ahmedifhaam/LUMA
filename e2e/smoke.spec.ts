import { expect, test } from '@playwright/test';

test('library shell loads with an empty state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
  await expect(page.getByTestId('add-book')).toBeVisible();
  await expect(page.getByText('No books yet.')).toBeVisible();
  await expect(page.getByTestId('file-input')).toHaveAttribute(
    'accept',
    /application\/epub\+zip/,
  );
  await page.getByTestId('open-shortcuts').click();
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible();
  await expect(page.getByText('Previous / next page').first()).toBeVisible();
});
