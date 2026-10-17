import { test, expect } from '@playwright/test';
import { openProfile, originalUser, submitProfile } from './profileTestSetup.js';

test('US-09 AC 7: แสดงข้อผิดพลาดเมื่อระบบบันทึกไม่สำเร็จ', async ({ page }) => {
  await openProfile(page);
  await page.evaluate(() => {
    window.__us09ResponseStatus = 500;
  });
  await page.locator('input[type="text"]').nth(0).fill('Unsaved change');
  await submitProfile(page);

  await expect(page.getByText('เกิดข้อผิดพลาดในระบบ')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('user')).firstName))
    .toBe(originalUser.firstName);
});
