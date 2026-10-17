import { test, expect } from '@playwright/test';
import { openProfile, smallPng, submitProfile } from './profileTestSetup.js';

test('TC_9_0_003 / Scenario 9.3: เปลี่ยนรูปโปรไฟล์สำเร็จ', async ({ page }) => {
  await openProfile(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: smallPng,
  });
  await expect(page.locator('img[alt="Profile"]').last())
    .toHaveAttribute('src', /^data:image\/png/);
  await submitProfile(page);

  await expect(page.getByText('อัปเดตข้อมูลเรียบร้อย!')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('user')).profileImage))
    .toBe('https://example.com/profile.png');
});
