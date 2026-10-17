import { test, expect } from '@playwright/test';
import { openProfile } from './profileTestSetup.js';

test('TC_9_0_005 / Scenario 9.5: อัปโหลดไฟล์ที่ไม่ใช่รูปภาพ', async ({ page }) => {
  await openProfile(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'not-an-image.exe',
    mimeType: 'application/x-msdownload',
    buffer: Buffer.from('not an image'),
  });

  await expect(page.getByText('ประเภทไฟล์ไม่ถูกต้อง')).toBeVisible();
  await expect(page.locator('img[alt="Profile"]').last()).not.toHaveAttribute('src', /^data:/);
});
