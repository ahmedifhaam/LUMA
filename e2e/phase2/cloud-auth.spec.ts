import { test, expect } from '@playwright/test';
import {
  PHASE2_TEST_USER,
  savePhase2Video,
  signInViaUi,
} from './helpers/cloud-utils';

test.describe('Phase 2 cloud auth', () => {
  test('signs in and out against the local API', async ({ page }) => {
    await page.goto('/');

    await signInViaUi(page, PHASE2_TEST_USER.username, PHASE2_TEST_USER.password);
    await expect(page.getByTestId('auth-user-label')).toHaveText(PHASE2_TEST_USER.username);

    await page.getByTestId('auth-sign-out').click();
    await page.getByTestId('app-menu-trigger').click();
    await expect(page.getByTestId('app-menu-sign-in')).toBeVisible();

    await savePhase2Video(page, 'phase2-cloud-auth');
  });
});
