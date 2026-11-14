import { expect, test } from '@playwright/test';

/**
 * Luồng thật của người dùng: nhập ngày sinh → kết quả → chọn cung → mở nguyên văn.
 *
 * Ngày 20/05/1985 11:00 (nam) là lá số dùng trong tài liệu kiểm tay: cung Tài
 * Bạch có Tả Phụ và Hữu Bật cùng cung, nên câu theo cung là mục gộp
 * "左辅右弼" — dùng để kiểm nhãn "câu chung cho".
 */
test('nhập lá số, đọc cung, mở nguyên văn và chia sẻ URL', async ({ page }) => {
  await page.goto('/');

  await page.locator('#birth-day').fill('20');
  await page.locator('#birth-month').fill('5');
  await page.locator('#birth-year').fill('1985');
  await page.locator('#birth-hour').fill('11');
  await page.locator('#birth-minute').fill('0');
  await page.getByRole('button', { name: 'AN LÁ SỐ' }).click();

  const results = page.getByRole('region', { name: 'Kết quả lá số' });
  await expect(results).toBeVisible();

  // URL chia sẻ mang đủ tham số để mở lại đúng lá số.
  await expect(page).toHaveURL(/[?&]y=1985/);
  await expect(page).toHaveURL(/[?&]m=5/);
  await expect(page).toHaveURL(/[?&]d=20/);
  await expect(page).toHaveURL(/[?&]h=11/);
  await expect(page).toHaveURL(/[?&]gender=nam/);

  // Mở lại bằng URL chia sẻ: kết quả dựng lại, không phải bấm "Lập lá số".
  await page.reload();
  await expect(results).toBeVisible();

  // Khung đọc 12 cung: chọn cung Tài Bạch.
  await expect(page.getByRole('tab', { name: 'Tử Vi' })).toHaveAttribute('aria-selected', 'true');
  const taiBach = page.getByRole('tab', { name: /^Tài Bạch/ });
  await taiBach.click();
  await expect(taiBach).toHaveAttribute('aria-selected', 'true');

  const panel = page.getByRole('tabpanel');
  // Câu theo cung của phụ tinh (卷二) + nhãn mục gộp.
  await expect(panel.getByText('Tại cung Tài Bạch', { exact: false }).first()).toBeVisible();
  const grouped = panel.getByText('Tại cung Tài Bạch · câu chung cho Tả Phụ, Hữu Bật');
  await expect(grouped).toHaveCount(2);
  await expect(grouped.first()).toBeVisible();
  await expect(panel.getByText('Định nghĩa chung').first()).toBeVisible();

  // Dẫn nguồn: mở "§" và đọc câu Hán đã kiểm.
  const cite = panel.locator('details.cite').first();
  await cite.locator('summary').click();
  await expect(cite.locator('.cite-zh')).toBeVisible();
  await expect(cite.locator('.cite-zh')).not.toBeEmpty();
  await expect(cite).toContainText('Wikisource');

  // Bàn phím: mũi tên phải chuyển sang cung kế tiếp (Tài Bạch → Tật Ách).
  await taiBach.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /^Tật Ách/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  // Tab Bát Tự vẫn dựng được cùng lá số.
  await page.getByRole('tab', { name: 'Bát Tự' }).click();
  await expect(page.getByRole('heading', { name: 'Lá số Bát Tự' })).toBeVisible();
  await expect(page.getByText('Tứ trụ lấy theo tiết khí', { exact: false })).toBeVisible();
});
