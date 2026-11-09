import type { ChartContext } from '../../../../packages/calendar-core/src/index.ts';

/**
 * Danh sách cảnh báo của lần tính hiện tại. Tách riêng để trang kết quả không
 * phải tải cả bảng "Cách tính" chỉ vì vài dòng cảnh báo.
 */
export function WarningList({ ctx }: { ctx: ChartContext }) {
  if (ctx.warnings.length === 0) return null;
  return (
    <ul className="warnings">
      {ctx.warnings.map((w, i) => (
        <li key={`${w.code}-${i}`} className={`warning warning-${w.severity}`}>
          <span className="warning-kind">{w.severity === 'warn' ? 'Cần lưu ý' : 'Thông tin'}</span>
          <span>{w.message}</span>
        </li>
      ))}
    </ul>
  );
}
