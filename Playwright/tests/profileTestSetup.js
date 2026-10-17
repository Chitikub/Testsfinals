import { expect } from '@playwright/test';

export const originalUser = {
  id: 902,
  firstName: 'Playwright',
  lastName: 'Tester',
  phoneNumber: '0812345678',
  email: 'playwright@example.com',
  gender: 'male',
  profileImage: '',
  role: 'user',
};

export const smallPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l7cAAAAASUVORK5CYII=',
  'base64',
);

export async function openProfile(page) {
  await page.addInitScript((user) => {
    localStorage.setItem('token', 'us09-playwright-token');
    localStorage.setItem('user', JSON.stringify(user));
    window.__us09Requests = [];
    window.__us09ResponseStatus = 200;
  }, originalUser);

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname.endsWith('/auth/me')) {
      await route.fulfill({ json: { user: originalUser } });
      return;
    }

    if (pathname.endsWith('/users/profile') && ['PUT', 'PATCH'].includes(request.method())) {
      const postData = request.postData() || '';
      let submittedValues = {};
      try {
        submittedValues = request.postDataJSON();
      } catch {
        for (const field of ['firstName', 'lastName', 'phoneNumber', 'gender']) {
          const value = postData.match(new RegExp(`name="${field}"\\r\\n\\r\\n([^\\r\\n]*)`));
          if (value) submittedValues[field] = value[1];
        }
      }

      await page.evaluate((entry) => {
        window.__us09Requests.push(entry);
      }, { method: request.method(), postData, submittedValues });

      const status = await page.evaluate(() => window.__us09ResponseStatus);
      if (status !== 200) {
        await route.fulfill({
          status,
          json: { message: 'เกิดข้อผิดพลาดในระบบ' },
        });
        return;
      }

      const updatedUser = {
        ...originalUser,
        ...submittedValues,
        ...(postData.includes('name="profileImage";') && {
          profileImage: 'https://example.com/profile.png',
        }),
      };
      await route.fulfill({
        json: { message: 'อัปเดตโปรไฟล์สำเร็จ', user: updatedUser },
      });
      return;
    }

    await route.continue();
  });

  await page.goto('/');
  const profileLink = page.getByRole('link', { name: 'Profile' });
  await expect(profileLink).toBeVisible();
  await page.waitForTimeout(2000);
  await profileLink.click();
  await expect(page.getByRole('heading', { name: 'โปรไฟล์คุณ' })).toBeVisible();
  await page.waitForTimeout(2000);
}

export async function submitProfile(page) {
  await page.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' }).click();
}
