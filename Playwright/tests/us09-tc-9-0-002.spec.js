import { test, expect } from '@playwright/test';
import { openProfile, submitProfile } from './profileTestSetup.js';

test('TC_9_0_002 / Scenario 9.2: แก้ไขข้อมูลโปรไฟล์ทุกช่องที่แก้ไขได้', async ({ page }) => {
  await openProfile(page);
  await page.locator('input[type="text"]').nth(0).fill('Chitipat');
  await page.locator('input[type="text"]').nth(1).fill('Churhor');
  const gender = page.getByRole('combobox');
  await gender.selectOption({ label: 'หญิง' });
  const selectedGender = await gender.inputValue();
  await submitProfile(page);

  await expect(page.getByText('อัปเดตข้อมูลเรียบร้อย!')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chitipat Churhor' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__us09Requests[0]?.submittedValues))
    .toMatchObject({ firstName: 'Chitipat', lastName: 'Churhor', gender: selectedGender });
});
