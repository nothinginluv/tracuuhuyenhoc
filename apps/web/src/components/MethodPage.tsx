import { Cite } from '../quotes.tsx';
import { QUOTES, SOURCE_LABEL, SOURCE_LINK } from '../quotes-data.ts';

type Props = { onBack: () => void };

export function MethodPage({ onBack }: Props) {
  return (
    <article className="method">
      <header className="method-head">
        <div className="eyebrow">Phụ lục · Phương pháp</div>
        <h1>Sổ ghi phép dựng</h1>
        <p className="sub">
          Trang này không luận giải vận mệnh. Nó trả lời một câu hỏi hẹp hơn: <em>con số này
          được tính ra như thế nào, theo quy ước nào, và khác ứng dụng khác ở đâu?</em>
        </p>
        <button className="link-btn" onClick={onBack}>
          ← Về trang tra cứu
        </button>
      </header>

      <section className="prose">
        <h2>1. Chuỗi tính</h2>
        <p>
          Người dùng chỉ biết <strong>giờ trên đồng hồ tại nơi sinh</strong>. Từ đó hệ thống suy
          ra thời điểm vật lý (UTC), rồi mới diễn giải thành ngày âm lịch và tứ trụ:
        </p>
        <pre className="chain">{`Giờ đồng hồ nơi sinh
  → toạ độ + miền  (63 tỉnh trước 01/07/2025; Quảng Trị 1960–1975 phải hỏi huyện)
  → múi giờ lịch sử  →  thời điểm UTC
  → đồng hồ quy ước: Bắc Kinh (+8) | nơi sinh | mặt trời thật
  → âm lịch Trung Quốc (+8) và Việt Nam (+7)
  → tứ trụ (năm/tháng theo thời điểm tiết khí; ngày/giờ theo đồng hồ đã quy ước)
  → an sao Tử Vi / tàng can, thập thần, đại vận`}</pre>
        <p>
          Điểm quan trọng: <strong>tiết khí luôn được so dưới dạng thời điểm UTC</strong>, không bao
          giờ so “giờ Việt Nam” với một bảng ghi giờ Bắc Kinh. Đây là lỗi phổ biến khiến trụ tháng
          lệch ở các thời điểm sát tiết.
        </p>

        <h2>2. Bốn quy ước có thể chọn</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Quy ước</th>
              <th>Đồng hồ</th>
              <th>Tý</th>
              <th>Can giờ 23:00–23:59</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Chuẩn Trung Quốc — mặc định</td>
              <td>Bắc Kinh UTC+8</td>
              <td>muộn (00:00)</td>
              <td>theo ngày hiện tại</td>
            </tr>
            <tr>
              <td>Giờ Việt Nam tại nơi sinh</td>
              <td>giờ dân sự nơi sinh</td>
              <td>muộn (00:00)</td>
              <td>theo ngày hiện tại</td>
            </tr>
            <tr>
              <td>Giờ mặt trời thật</td>
              <td>mặt trời thật (kinh độ + phương trình thời gian)</td>
              <td>muộn (00:00)</td>
              <td>theo ngày hiện tại</td>
            </tr>
            <tr>
              <td>Khớp lunar-javascript</td>
              <td>Bắc Kinh UTC+8</td>
              <td>muộn (00:00)</td>
              <td>theo ngày kế tiếp</td>
            </tr>
          </tbody>
        </table>
        <p>
          Không có lựa chọn nào “đúng tuyệt đối”. Mặc định <strong>Chuẩn Trung Quốc</strong> được
          chọn vì nó khớp văn bản gốc và phần lớn phần mềm Trung Quốc; ba lựa chọn còn lại để người
          dùng đối chiếu khi thấy kết quả khác. Trong phần “Tuỳ chỉnh quy ước tính”, bạn còn đổi
          riêng được ranh giới Tý, can giờ 23:00–23:59 và quy tắc tháng nhuận mà không cần đổi cả
          bộ quy ước.
        </p>

        <h3>Múi giờ lịch sử Việt Nam</h3>
        <p>
          Không dùng cơ sở dữ liệu múi giờ hệ điều hành, vì nó chỉ có một mô hình{' '}
          <code>Asia/Ho_Chi_Minh</code> và không tách Bắc/Nam. Bảng dùng ở đây:
        </p>
        <ul>
          <li>Trước 01/01/1960: cả nước UTC+7.</li>
          <li>
            01/01/1960 – 12/06/1975: miền Bắc UTC+7; miền Nam UTC+8. Riêng Quảng Trị bị chia ở
            vĩ tuyến 17 — Vĩnh Linh thuộc miền Bắc, phần còn lại thuộc miền Nam.
          </li>
          <li>Từ 13/06/1975: cả nước UTC+7.</li>
        </ul>

        <h2>3. Tử Vi Đẩu Số</h2>
        <p>
          Đầu vào là <strong>năm âm lịch Trung Quốc</strong> (đổi tại Tết, không dùng năm tiết khí),
          tháng âm, ngày âm và chi giờ. Các bước an sao:
        </p>
        <ul>
          <li>Xác định cung Mệnh, cung Thân từ tháng và giờ; can cung theo phép Ngũ Hổ Độn.</li>
          <li>Tính Ngũ Hành Cục từ can chi cung Mệnh (tương đương tra nạp âm).</li>
          <li>An 14 chính tinh theo cục và ngày, 24 phụ tinh theo tháng/ngày/giờ/năm.</li>
          <li>Gán Tứ Hoá theo can năm — bảng Nam phái (Tử Vi, Liêm Trinh, Vũ Khúc, Thái Dương…).</li>
          <li>Xác định Mệnh chủ theo chi cung Mệnh, Thân chủ theo chi năm sinh.</li>
          <li>
            Đại hạn: dương nam / âm nữ đi thuận từ cung Phụ Mẫu, âm nam / dương nữ đi nghịch từ
            cung Huynh Đệ; tuổi khởi bằng số của ngũ hành cục (2–6), mỗi hạn 10 năm.
          </li>
        </ul>
        <p>
          Riêng <strong>tháng nhuận</strong>, mặc định dùng quy tắc chia đôi: ngày 1–15 tính là
          tháng nhuận, ngày 16–30 tính sang tháng kế tiếp. Các phần mềm khác có thể giữ nguyên
          tháng hoặc dồn cả tháng — đó là khác biệt quy ước, không phải lỗi.
        </p>
        <p>
          <strong>sao Phong Cáo</strong> đi theo khẩu quyết “khởi Dần tại Tý, đếm nghịch đến giờ sinh”.
          Thư viện <code>iztro</code> đếm xuôi, nên hai bên cố ý khác nhau ở sao này — đã ghi nhận
          trong bộ kiểm thử đối chứng.
        </p>
        <div className="cite-row">
          <Cite id="q_tv_0001" />
          <Cite id="q_tv_0003" />
        </div>

        <h2>4. Bát Tự / Tứ Trụ</h2>
        <ul>
          <li>
            <strong>Trụ năm</strong> đổi tại thời điểm Lập Xuân, không đổi ngày 01/01 dương lịch.
          </li>
          <li>
            <strong>Trụ tháng</strong> đổi tại 12 “tiết”, không phải 12 “khí”.
          </li>
          <li>
            <strong>Trụ ngày</strong> theo vòng 60 Giáp Tý trên số ngày Julius; Tý sớm cộng một
            ngày khi 23:00–23:59.
          </li>
          <li>
            <strong>Trụ giờ</strong> theo phép Ngũ Thử Độn từ can ngày; quy ước can giờ lúc 23:00 là lựa
            chọn có thể đổi.
          </li>
          <li>
            <strong>Tàng can</strong> lấy đúng bài Địa Chi Tàng Độn Ca, sắp theo bản khí → trung khí →
            dư khí.
          </li>
          <li>
            <strong>Thập thần</strong> tính từ can ngày; mỗi quan hệ chia âm/dương thành hai.
          </li>
          <li>
            <strong>Đại vận</strong>: dương nam / âm nữ đi thuận, âm nam / dương nữ đi nghịch;
            3 ngày = 1 năm; vận đầu là trụ tháng tiến/lùi một bước; tuổi hiển thị là số năm kể từ
            lúc sinh, không phải tuổi mụ.
          </li>
        </ul>
        <div className="cite-row">
          <Cite id="q_bz_0008" />
          <Cite id="q_bz_0004" />
          <Cite id="q_bz_0005" />
          <Cite id="q_bz_0006" />
          <Cite id="q_bz_0007" />
        </div>

        <h2>5. Giới hạn đã biết</h2>
        <ul>
          <li>
            Luận giải đọc tới mức: sao ở cung nào, độ sáng tại cung đó, câu “thuận / trắc trở” của
            cả cung, đại hạn và cung lưu niên; chưa luận ảnh hưởng từng sao tại từng cung, tổ hợp
            sao, cách cục, tiểu hạn, vượng suy hay hình xung hợp hại — không đưa lời khuyên.
          </li>
          <li>Chưa hỗ trợ người sinh ngoài Việt Nam hoặc không rõ tỉnh (chỉ tính được khi chọn quy ước Bắc Kinh).</li>
          <li>Chưa có trường hợp không rõ giờ sinh; hãy nhập giờ ước lượng và đọc cảnh báo.</li>
          <li>Phạm vi 1900–2100. Tử Vi cần năm âm lịch ≥ 1900, nên sinh trước Tết 1900 chỉ xem được Bát Tự.</li>
          <li>Chỉ có bảng Tứ Hoá Nam phái; gói dữ liệu Trung Châu phái chưa triển khai.</li>
          <li>
            Đối chứng tự động: <code>iztro</code> 880 lá số (Tử Vi) và <code>lunar-javascript</code>{" "}
            (tứ trụ, thập thần, đại vận). Các khác biệt đã biết được ghi thành bộ kiểm thử riêng,
            không che giấu.
          </li>
        </ul>

        <h2>6. Nguồn</h2>
        <p>
          Chỉ dùng văn bản cổ công khai (Tầng A), tải từ Wikisource và pin bằng SHA-256. Mỗi trích
          dẫn phải là <strong>chuỗi con nguyên văn</strong> của kho văn bản gốc đã băm; cổng kiểm
          <code>npm run quotes:verify</code> chặn mọi câu không khớp. Hiện có {Object.keys(QUOTES).length} câu
          đã xác minh.
        </p>
        <ul className="source-list">
          {Object.entries(SOURCE_LABEL).map(([key, label]) => (
            <li key={key}>
              <a href={SOURCE_LINK[key]} target="_blank" rel="noreferrer noopener">
                {label}
              </a>
              <span className="muted">
                {' '}
                — {key === 'ziwei-quanshu' ? 'Tử Vi Đẩu Số' : 'Bát Tự / Tứ Trụ'}
              </span>
            </li>
          ))}
        </ul>
        <p className="tiny muted">
          Bảng tháng âm lịch: 2.523 tháng (1899–2102) dựng từ chuẩn lịch Trung Quốc, đối chứng
          0 lệch trên 12.060 ngày. Bảng tiết khí: 4.872 thời điểm UTC (1899–2101).
        </p>
      </section>
    </article>
  );
}
