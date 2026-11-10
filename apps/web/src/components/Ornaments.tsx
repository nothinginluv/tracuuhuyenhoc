/**
 * Hoạ tiết trang trí thuần hình học — không chứa chữ Hán.
 *
 * Mọi thành phần ở đây đều `aria-hidden`: chúng chỉ tạo không khí thị giác,
 * không mang thông tin. Màu lấy từ biến CSS để đổi theo bảng màu.
 */

type SealProps = {
  size?: number;
  className?: string;
};

/** Ấn triện: nền son, lòng ấn khắc thái cực. */
export function SealMark({ size = 44, className }: SealProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="46" height="46" rx="7" fill="var(--seal-bg, #9c2f22)" />
      <rect
        x="4.5"
        y="4.5"
        width="39"
        height="39"
        rx="4.5"
        fill="none"
        stroke="var(--seal-ink, #f4e8cf)"
        strokeOpacity="0.5"
      />
      <g transform="translate(24 24)" fill="var(--seal-ink, #f4e8cf)">
        <circle r="12.2" fill="none" stroke="var(--seal-ink, #f4e8cf)" strokeWidth="1.5" />
        <path d="M0 -12.2A12.2 12.2 0 0 1 0 12.2 6.1 6.1 0 0 1 0 0 6.1 6.1 0 0 0 0 -12.2Z" />
        <circle cx="0" cy="-6.1" r="2.1" />
        <circle cx="0" cy="6.1" r="2.1" fill="var(--seal-bg, #9c2f22)" />
      </g>
    </svg>
  );
}

/** Tám quẻ Tiên thiên, mỗi quẻ ba hào — hào liền hoặc hào đứt. */
const BAGUA: readonly (readonly number[])[] = [
  [1, 1, 1],
  [0, 1, 1],
  [1, 0, 1],
  [0, 0, 1],
  [1, 1, 0],
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, 0],
];

const BAR_W = 30;
const BAR_H = 4;
const BAR_GAP = 5;

function Trigram({ pattern }: { pattern: readonly number[] }) {
  const height = pattern.length * BAR_H + (pattern.length - 1) * BAR_GAP;
  return (
    <g transform={`translate(0 ${-height / 2})`}>
      {pattern.map((solid, i) =>
        solid ? (
          <rect
            key={i}
            x={-BAR_W / 2}
            y={i * (BAR_H + BAR_GAP)}
            width={BAR_W}
            height={BAR_H}
            rx="1.4"
            fill="currentColor"
          />
        ) : (
          <g key={i} fill="currentColor">
            <rect
              x={-BAR_W / 2}
              y={i * (BAR_H + BAR_GAP)}
              width={BAR_W / 2 - 3}
              height={BAR_H}
              rx="1.4"
            />
            <rect
              x={3}
              y={i * (BAR_H + BAR_GAP)}
              width={BAR_W / 2 - 3}
              height={BAR_H}
              rx="1.4"
            />
          </g>
        ),
      )}
    </g>
  );
}

/**
 * La bàn phong thuỷ: vòng thiên can, 72 vạch khắc, tám quẻ và thái cực ở tâm.
 * Đặt phía sau tiêu đề như hình chìm trên giấy.
 */
export function LuopanArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor">
        <circle cx="300" cy="300" r="291" strokeWidth="1" opacity="0.3" />
        <circle cx="300" cy="300" r="274" strokeWidth="0.8" opacity="0.5" />
        <circle cx="300" cy="300" r="268" strokeWidth="2" opacity="0.55" />
        <circle cx="300" cy="300" r="212" strokeWidth="0.8" opacity="0.45" />
        <circle cx="300" cy="300" r="206" strokeWidth="1.6" opacity="0.5" />
        <circle cx="300" cy="300" r="150" strokeWidth="0.8" opacity="0.35" />
        <circle cx="300" cy="300" r="96" strokeWidth="0.8" opacity="0.3" />
        <circle cx="300" cy="300" r="58" strokeWidth="0.8" opacity="0.35" />
        <circle cx="300" cy="300" r="34" strokeWidth="1.2" opacity="0.5" />
        <line x1="300" y1="9" x2="300" y2="30" strokeWidth="1" opacity="0.4" />
        <line x1="300" y1="570" x2="300" y2="591" strokeWidth="1" opacity="0.4" />
        <line x1="9" y1="300" x2="30" y2="300" strokeWidth="1" opacity="0.4" />
        <line x1="570" y1="300" x2="591" y2="300" strokeWidth="1" opacity="0.4" />
      </g>

      <g className="luopan-rotor" fill="none" stroke="currentColor">
        {Array.from({ length: 72 }, (_, i) => (
          <line
            key={i}
            x1="300"
            y1="34"
            x2="300"
            y2={i % 3 === 0 ? 58 : 49}
            strokeWidth={i % 3 === 0 ? 1.3 : 0.7}
            opacity={i % 3 === 0 ? 0.6 : 0.32}
            transform={`rotate(${i * 5} 300 300)`}
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <circle
            key={i}
            cx="300"
            cy="71"
            r="2.2"
            fill="currentColor"
            stroke="none"
            opacity="0.45"
            transform={`rotate(${i * 30} 300 300)`}
          />
        ))}
        {BAGUA.map((pattern, i) => (
          <g key={i} transform={`rotate(${i * 45} 300 300)`}>
            <g transform="translate(300 133)" color="currentColor">
              <Trigram pattern={pattern} />
            </g>
          </g>
        ))}
      </g>

      <g transform="translate(300 300)" fill="currentColor">
        <circle r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <path
          d="M0 -20A20 20 0 0 1 0 20 10 10 0 0 1 0 0 10 10 0 0 0 0 -20Z"
          opacity="0.5"
        />
        <circle cx="0" cy="-10" r="3.2" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <circle cx="0" cy="10" r="3.2" opacity="0.5" />
      </g>
    </svg>
  );
}
