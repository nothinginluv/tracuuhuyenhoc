/**
 * Chia sẻ lá số: sao chép URL và Web Share API.
 *
 * Tách khỏi `App.tsx` để phần giao diện chỉ còn gọi hàm và hiển thị thông báo.
 * Không dùng `prompt()`: một số môi trường chặn và nó tạo unhandled rejection.
 */

export interface ShareOutcome {
  ok: boolean;
  /** Câu thông báo cho trình đọc màn hình; luôn có khi trả về kết quả. */
  message: string;
}

const SHARE_TITLE = 'Tra Cứu Huyền Học — Lá số minh bạch';
const SHARE_TEXT = 'Xem lá số Tử Vi / Bát Tự của tôi tại Tra Cứu Huyền Học.';

/** Copy bằng `document.execCommand` cho trình duyệt không có Clipboard API. */
function legacyCopy(text: string): boolean {
  const input = document.createElement('input');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  input.remove();
  return copied;
}

export async function copyUrl(url: string): Promise<ShareOutcome> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard không khả dụng');
    await navigator.clipboard.writeText(url);
    return { ok: true, message: 'Đã sao chép URL lá số vào clipboard.' };
  } catch {
    const copied = legacyCopy(url);
    return copied
      ? { ok: true, message: 'Đã sao chép URL lá số.' }
      : { ok: false, message: 'Không sao chép tự động được — hãy copy URL trên thanh địa chỉ.' };
  }
}

/**
 * Mở hộp chia sẻ của hệ điều hành; không có thì rơi xuống sao chép.
 * Trả `null` khi người dùng tự huỷ hộp chia sẻ — huỷ không phải lỗi, cũng
 * không nên tự copy thay họ.
 */
export async function shareUrl(url: string): Promise<ShareOutcome | null> {
  const data = { title: SHARE_TITLE, text: SHARE_TEXT, url };
  try {
    if (navigator.share && navigator.canShare?.(data)) {
      await navigator.share(data);
      return { ok: true, message: 'Đã mở hộp chia sẻ.' };
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null;
    /* Trình duyệt từ chối vì lý do khác: rơi xuống sao chép. */
  }
  return copyUrl(url);
}
