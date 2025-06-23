import { test, expect } from '@playwright/test';

test.describe('Airspace Dashboard', () => {
  test('loads dashboard and displays map', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.getByTestId('map-view')).toBeVisible();
  });
  test('shows aircraft details modal', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByText('AAL123').click();
    await expect(page.getByTestId('aircraft-detail-modal')).toBeVisible();
  });
});
