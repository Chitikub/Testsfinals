import { test, expect } from '@playwright/test';
import { openProfile, submitProfile } from './profileTestSetup.js';

test('US-09 AC 5: ตัดช่องว่างหัวท้ายก่อนบันทึก', async ({ page }) => {
  await openProfile(page);
  await page.locator('input[type="text"]').nth(0).fill('  Chitipat  ');
  await page.locator('input[type="text"]').nth(1).fill('  Churhor  ');
  await submitProfile(page);

  await expect(page.getByText('อัปเดตข้อมูลเรียบร้อย!')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__us09Requests[0]?.submittedValues))
    .toMatchObject({ firstName: 'Chitipat', lastName: 'Churhor' });
});
