import { test, expect } from '@playwright/test';
import { openProfile, submitProfile } from './profileTestSetup.js';

test('TC_9_0_001 / Scenario 9.1: แก้ไขข้อมูลโปรไฟล์บางช่องสำเร็จ', async ({ page }) => {
  await openProfile(page);
  await page.locator('input[type="text"]').nth(0).fill('Chitipat');
  await submitProfile(page);

  await expect(page.getByText('อัปเดตข้อมูลเรียบร้อย!')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chitipat Tester' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__us09Requests.length)).toBe(1);
});
