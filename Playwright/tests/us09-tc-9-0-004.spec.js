import { test, expect } from '@playwright/test';
import { openProfile, submitProfile } from './profileTestSetup.js';

test('TC_9_0_004 / Scenario 9.4: กรอกข้อมูลโปรไฟล์ไม่ถูกต้องหรือไม่ครบถ้วน', async ({ page }) => {
  await openProfile(page);
  await page.locator('input[type="text"]').nth(0).fill('   ');
  await submitProfile(page);

  await expect(page.getByText(/กรุณากรอกชื่อ/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__us09Requests.length)).toBe(0);
});
