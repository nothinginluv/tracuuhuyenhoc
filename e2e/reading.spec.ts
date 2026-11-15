import { expect, test } from '@playwright/test';

/**
 * Luồng thật của người dùng: nhập ngày sinh → lá số → chọn cung → đọc câu của
 * sách. Ngày 20/05/1985 11:00 (nam) là lá số dùng trong tài liệu kiểm tay:
 * cung Mệnh có Thái Âm, cung Tài Bạch chỉ có phụ tinh nên hiện câu "không có
 * sao chính".
 */
test('nhập lá số, đọc cung, đổi ngày sinh và mở trang nguồn', async ({ page }) => {
  await page.goto('/');

  // Trang đầu chỉ có biểu mẫu — không bìa, không thẻ giới thiệu.
  await expect(page.getByRole('heading', { name: 'Ngày giờ sinh', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'An lá số' })).toBeVisible();

  await page.locator('#birth-day').fill('20');
  await page.locator('#birth-month').fill('5');
  await page.locator('#birth-year').fill('1985');
  await page.locator('#birth-hour').fill('11');
  await page.locator('#birth-minute').fill('0');
  await page.getByRole('button', { name: 'An lá số' }).click();

  const results = page.getByRole('region', { name: 'Kết quả lá số' });
  await expect(results).toBeVisible();

  // Biểu mẫu ẩn sau khi tính.
  await expect(page.locator('#birth-day')).toHaveCount(0);

  // URL chia sẻ mang đủ tham số để mở lại đúng lá số.
  await expect(page).toHaveURL(/[?&]y=1985/);
  await expect(page).toHaveURL(/[?&]m=5/);
  await expect(page).toHaveURL(/[?&]d=20/);
  await expect(page).toHaveURL(/[?&]h=11/);
  await expect(page).toHaveURL(/[?&]gender=nam/);

  // Mở lại bằng URL chia sẻ: kết quả dựng lại, không phải bấm "An lá số".
  await page.reload();
  await expect(results).toBeVisible();

  // Tab Tử Vi mặc định, lá số có đủ 12 ô cung.
  await expect(page.getByRole('tab', { name: 'Tử Vi' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.chart-cell')).toHaveCount(12);

  // Khung đọc 12 cung: cung Mệnh đang mở, có câu của sách cho Thái Âm.
  const panel = page.locator('.reading-view');
  await expect(panel.getByRole('heading', { name: /^Mệnh/ })).toBeVisible();
  await expect(panel.locator('.star-name', { hasText: 'Thái Âm' })).toBeVisible();
  await expect(panel.getByText('thông minh', { exact: false })).toBeVisible();

  // Bấm một ô trên lá số cũng mở đúng cung ở khung đọc.
  await page.locator('.chart-cell', { hasText: 'Tài Bạch' }).click();
  await expect(panel.getByRole('heading', { name: 'Tài Bạch' })).toBeVisible();
  await expect(panel.getByText('Cung này không có sao chính', { exact: false })).toBeVisible();

  // Bàn phím: mũi tên phải chuyển sang cung kế tiếp (Mệnh → Huynh Đệ).
  await page.getByRole('tab', { name: /^Mệnh/ }).click();
  await expect(panel.getByRole('heading', { name: /^Mệnh/ })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('tab', { name: /^Huynh Đệ/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(panel.getByRole('heading', { name: 'Huynh Đệ' })).toBeVisible();

  // Đại hạn vẫn còn trong tab Tử Vi.
  await expect(page.getByRole('heading', { name: 'Đại hạn' }).first()).toBeVisible();

  // Tab Bát Tự dựng được cùng lá số.
  await page.getByRole('tab', { name: 'Bát Tự' }).click();
  await expect(page.getByRole('heading', { name: 'Lá số Bát Tự' })).toBeVisible();
  await expect(page.getByText('Tứ trụ lấy theo tiết khí', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Nhật chủ Kỷ/ })).toBeVisible();

  // Tab Cách tính: chuỗi tính + nguồn mở được.
  await page.getByRole('tab', { name: 'Cách tính' }).click();
  await expect(page.getByRole('heading', { name: 'Cách tính ra lá số này' })).toBeVisible();
  const cite = page.locator('details.cite').first();
  await cite.locator('> summary').click();
  await expect(cite.locator('.cite-zh')).not.toBeEmpty();
  await expect(cite).toContainText('Wikisource');

  // Đổi ngày sinh: biểu mẫu mở lại, "Huỷ" trả về kết quả cũ.
  await page.getByRole('button', { name: 'Đổi ngày sinh' }).click();
  await expect(page.getByRole('heading', { name: 'Ngày giờ sinh', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Huỷ' }).click();
  await expect(results).toBeVisible();

  // Trang nguồn & phương pháp là chỗ duy nhất hiện khối trích dẫn.
  await page.getByRole('button', { name: 'Nguồn & phương pháp' }).click();
  await expect(page.getByRole('heading', { name: 'Nguồn & phương pháp', level: 1 })).toBeVisible();
  await page.locator('details.cite > summary').first().click();
  await expect(page.locator('details.cite .cite-zh').first()).not.toBeEmpty();
});
