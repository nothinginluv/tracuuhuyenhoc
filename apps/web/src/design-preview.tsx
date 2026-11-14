/**
 * Thư viện xem trước design system — chỉ chạy khi mở /design-preview.html
 * trong chế độ dev. Không nằm trong gói production (Vite chỉ build index.html).
 *
 * Mục đích: duyệt bằng mắt mọi biến thể component trước khi đem vào
 * PalaceCard, ReadingPanel, BirthForm…
 */

import { StrictMode, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Radio,
  Select,
  Switch,
  Textarea,
} from './components/ui/index.ts';
import './styles.css';
import './design-system/ui.css';
import './design-system/preview.css';

const Section = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="pv-section">
    <h2 className="pv-section__title">{title}</h2>
    {note ? <p className="pv-section__note">{note}</p> : null}
    <div className="pv-row">{children}</div>
  </section>
);

function Preview() {
  const [picked, setPicked] = useState('tuvi');
  const [agree, setAgree] = useState(true);
  const [compact, setCompact] = useState(false);

  return (
    <main className="pv">
      <header className="pv-head">
        <div>
          <p className="pv-eyebrow">Design system · Vũ Trụ Tử Vi</p>
          <h1 className="pv-title">Thư viện component</h1>
          <p className="pv-sub">
            Mực tàu · giấy dó · son ấn · vàng cổ · ngọc bích. Chỉ dùng biến CSS trong{' '}
            <code>styles.css</code>, một chế độ sáng duy nhất.
          </p>
        </div>
      </header>

      <Section title="Button" note="6 biến thể · 4 cỡ · trạng thái loading và disabled.">
        <Button>Cổng Thiên Môn</Button>
        <Button variant="secondary">Xem lá số</Button>
        <Button variant="outline">Đối chiếu nguồn</Button>
        <Button variant="ghost">Bỏ qua</Button>
        <Button variant="destructive">Xoá lá số</Button>
        <Button variant="link">Cách tính</Button>
      </Section>

      <Section title="Button — cỡ & trạng thái">
        <Button size="sm">Nhỏ</Button>
        <Button size="md">Vừa</Button>
        <Button size="lg">Lớn</Button>
        <Button loading>Đang lập lá số</Button>
        <Button disabled>Không bấm được</Button>
        <Button size="icon" variant="outline" aria-label="Sao chép liên kết">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5h10" />
          </svg>
        </Button>
      </Section>

      <Section title="Card" note="Thẻ nội dung, có nhãn phụ và chân thẻ.">
        <Card className="pv-card">
          <CardHeader>
            <CardTitle>Cung Mệnh · Tý</CardTitle>
            <CardDescription>Tử Vi miếu, Thiên Phủ vượng — nền tảng vững.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="pv-copy">
              Luận giải hiển thị bằng lời giảng dễ hiểu; câu Hán gốc vẫn mở được ở từng dòng.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="outline">
              Mở nguyên văn
            </Button>
          </CardFooter>
        </Card>
        <Card interactive className="pv-card">
          <CardHeader>
            <CardTitle>Thẻ bấm được</CardTitle>
            <CardDescription>Nhấc nhẹ khi hover, tôn trọng reduced-motion.</CardDescription>
          </CardHeader>
        </Card>
      </Section>

      <Section title="Form" note="Nhãn, gợi ý, lỗi và trạng thái disabled.">
        <div className="pv-form">
          <Input label="Họ tên" placeholder="Nguyễn Văn A" hint="Không bắt buộc." />
          <Input label="Năm sinh" defaultValue="1990" error="Năm sinh phải nằm trong khoảng 1800–2100." />
          <Input
            label="Tìm tỉnh"
            placeholder="Gõ để lọc…"
            leadingIcon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            }
          />
          <Input label="Không sửa được" defaultValue="Đã khoá" disabled />
          <Select
            label="Giới tính"
            value="nam"
            onChange={() => {}}
            options={[
              { value: 'nam', label: 'Nam' },
              { value: 'nu', label: 'Nữ' },
            ]}
          />
          <Textarea label="Ghi chú" placeholder="Ví dụ: sinh ở Hà Nội trước 1975…" hint="Giúp chọn đúng múi giờ lịch sử." />
        </div>
      </Section>

      <Section title="Lựa chọn">
        <div className="pv-form">
          <Checkbox
            label="Đọc chế độ dễ hiểu"
            description="Ẩn thuật ngữ, hiện lời giảng."
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <Radio
            label="Lá số Tử Vi"
            description="An sao theo Tử Vi Đẩu Số."
            name="chart"
            checked={picked === 'tuvi'}
            onChange={() => setPicked('tuvi')}
          />
          <Radio
            label="Bát Tự"
            description="Tứ trụ, can chi, thập thần."
            name="chart"
            checked={picked === 'bazi'}
            onChange={() => setPicked('bazi')}
          />
          <Switch
            label="Bảng gọn"
            description="Giảm khoảng đệm trên màn hình nhỏ."
            checked={compact}
            onChange={(e) => setCompact(e.target.checked)}
          />
        </div>
      </Section>
    </main>
  );
}

const el = document.getElementById('root');
if (!el) throw new Error('Không tìm thấy #root');

createRoot(el).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
