// Sinh data/provinces_pre2025.json: 63 tỉnh/thành trước sáp nhập 01/07/2025.
// Toạ độ = tỉnh lỵ. Wikidata chỉ dùng để đối chiếu chéo (không bắt buộc).
import { writeFileSync } from 'node:fs';

/** [tên, tỉnh lỵ, lat, lon] — toạ độ tỉnh lỵ, 4 chữ số thập phân. */
const BASE = [
  ['Hà Nội', 'Hà Nội', 21.0285, 105.8542],
  ['Hải Phòng', 'Hải Phòng', 20.8449, 106.6881],
  ['Hải Dương', 'Hải Dương', 20.9373, 106.3145],
  ['Hưng Yên', 'Hưng Yên', 20.6464, 106.0511],
  ['Vĩnh Phúc', 'Vĩnh Yên', 21.3089, 105.6043],
  ['Bắc Ninh', 'Bắc Ninh', 21.1861, 106.0763],
  ['Bắc Giang', 'Bắc Giang', 21.2731, 106.1946],
  ['Bắc Kạn', 'Bắc Kạn', 22.1470, 105.8348],
  ['Thái Nguyên', 'Thái Nguyên', 21.5942, 105.8482],
  ['Lạng Sơn', 'Lạng Sơn', 21.8537, 106.7615],
  ['Cao Bằng', 'Cao Bằng', 22.6657, 106.2522],
  ['Hà Giang', 'Hà Giang', 22.8233, 104.9836],
  ['Tuyên Quang', 'Tuyên Quang', 21.8236, 105.2140],
  ['Yên Bái', 'Yên Bái', 21.7229, 104.9113],
  ['Lào Cai', 'Lào Cai', 22.4856, 103.9707],
  ['Lai Châu', 'Lai Châu', 22.3964, 103.4587],
  ['Điện Biên', 'Điện Biên Phủ', 21.3860, 103.0230],
  ['Sơn La', 'Sơn La', 21.3256, 103.9188],
  ['Hoà Bình', 'Hoà Bình', 20.8137, 105.3382],
  ['Phú Thọ', 'Việt Trì', 21.3227, 105.4019],
  ['Quảng Ninh', 'Hạ Long', 20.9500, 107.0833],
  ['Thái Bình', 'Thái Bình', 20.4460, 106.3365],
  ['Nam Định', 'Nam Định', 20.4340, 106.1680],
  ['Hà Nam', 'Phủ Lý', 20.5411, 105.9139],
  ['Ninh Bình', 'Ninh Bình', 20.2539, 105.9750],
  ['Thanh Hoá', 'Thanh Hoá', 19.8067, 105.7852],
  ['Nghệ An', 'Vinh', 18.6796, 105.6813],
  ['Hà Tĩnh', 'Hà Tĩnh', 18.3428, 105.9057],
  ['Quảng Bình', 'Đồng Hới', 17.4689, 106.5997],
  ['Quảng Trị', 'Đông Hà', 16.8163, 107.1000],
  ['Thừa Thiên Huế', 'Huế', 16.4637, 107.5909],
  ['Đà Nẵng', 'Đà Nẵng', 16.0544, 108.2022],
  ['Quảng Nam', 'Tam Kỳ', 15.5736, 108.4740],
  ['Quảng Ngãi', 'Quảng Ngãi', 15.1214, 108.8044],
  ['Bình Định', 'Quy Nhơn', 13.7830, 109.2196],
  ['Phú Yên', 'Tuy Hoà', 13.0882, 109.3050],
  ['Khánh Hoà', 'Nha Trang', 12.2388, 109.1967],
  ['Ninh Thuận', 'Phan Rang–Tháp Chàm', 11.5643, 108.9886],
  ['Bình Thuận', 'Phan Thiết', 10.9333, 108.1000],
  ['Kon Tum', 'Kon Tum', 14.3497, 108.0005],
  ['Gia Lai', 'Pleiku', 13.9833, 108.0000],
  ['Đắk Lắk', 'Buôn Ma Thuột', 12.6667, 108.0500],
  ['Đắk Nông', 'Gia Nghĩa', 12.0040, 107.6907],
  ['Lâm Đồng', 'Đà Lạt', 11.9404, 108.4583],
  ['Bình Phước', 'Đồng Xoài', 11.5340, 106.8830],
  ['Tây Ninh', 'Tây Ninh', 11.3100, 106.0980],
  ['Bình Dương', 'Thủ Dầu Một', 10.9804, 106.6519],
  ['Đồng Nai', 'Biên Hoà', 10.9574, 106.8427],
  ['Bà Rịa - Vũng Tàu', 'Bà Rịa', 10.4960, 107.1680],
  ['Thành phố Hồ Chí Minh', 'TP. Hồ Chí Minh', 10.7769, 106.7009],
  ['Long An', 'Tân An', 10.5320, 106.4130],
  ['Tiền Giang', 'Mỹ Tho', 10.3600, 106.3600],
  ['Bến Tre', 'Bến Tre', 10.2410, 106.3760],
  ['Trà Vinh', 'Trà Vinh', 9.9340, 106.3450],
  ['Vĩnh Long', 'Vĩnh Long', 10.2537, 105.9722],
  ['Đồng Tháp', 'Cao Lãnh', 10.4500, 105.6330],
  ['An Giang', 'Long Xuyên', 10.3860, 105.4350],
  ['Kiên Giang', 'Rạch Giá', 10.0125, 105.0809],
  ['Cần Thơ', 'Cần Thơ', 10.0452, 105.7469],
  ['Hậu Giang', 'Vị Thanh', 9.7845, 105.4700],
  ['Sóc Trăng', 'Sóc Trăng', 9.6025, 105.9739],
  ['Bạc Liêu', 'Bạc Liêu', 9.2941, 105.7278],
  ['Cà Mau', 'Cà Mau', 9.1769, 105.1524],
];

if (BASE.length !== 63) throw new Error(`Phải có 63 tỉnh, đang có ${BASE.length}`);

const UA = { 'User-Agent': 'tracuuhuyenhoc/0.1 (data build)' };

/** Đối chiếu chéo với Wikidata P625. Trả về Map<tên, {lat, lon}> hoặc rỗng nếu lỗi mạng. */
async function wikidataCheck(names) {
  const out = new Map();
  try {
    for (let i = 0; i < names.length; i += 40) {
      const batch = names.slice(i, i + 40);
      const url =
        'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&formatversion=2&props=claims|sitelinks&sites=viwiki&titles=' +
        encodeURIComponent(batch.join('|'));
      const res = await fetch(url, { headers: UA });
      if (!res.ok) break;
      const j = await res.json();
      for (const ent of Object.values(j.entities ?? {})) {
        const title = ent.sitelinks?.viwiki?.title;
        const p625 = ent.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
        if (!title || !p625) continue;
        // Chỉ nhận toạ độ nằm trong lãnh thổ VN — tránh khớp nhầm sang tỉnh trùng tên ở nước khác.
        if (p625.latitude < 8 || p625.latitude > 24) continue;
        if (p625.longitude < 102 || p625.longitude > 110) continue;
        out.set(title, { lat: p625.latitude, lon: p625.longitude });
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch {
    // bỏ qua: đối chiếu là tuỳ chọn
  }
  return out;
}

const cross = await wikidataCheck(BASE.map((r) => r[0]));

// Quảng Trị: Vĩnh Linh ở bắc vĩ tuyến 17, phần còn lại ở nam → phải hỏi cấp huyện.
const MIEN_CHIA = new Set(['Quảng Trị']);

const provinces = BASE.map(([name, capital, lat, lon], i) => {
  const mien = MIEN_CHIA.has(name) ? 'chia' : lat < 17.0 ? 'nam' : 'bac';
  const wd = cross.get(name);
  const row = {
    code: String(i + 1).padStart(2, '0'),
    name,
    capital,
    lat,
    lon,
    mien_1960_1975: mien,
  };
  if (wd) {
    const dLat = Math.abs(wd.lat - lat);
    const dLon = Math.abs(wd.lon - lon);
    row.crossCheck = {
      source: 'wikidata:P625',
      lat: Math.round(wd.lat * 10000) / 10000,
      lon: Math.round(wd.lon * 10000) / 10000,
      // Wikidata trả điểm đại diện tỉnh, không phải tỉnh lỵ → lệch tới ~1° là bình thường.
      deltaDeg: Math.round(Math.max(dLat, dLon) * 100) / 100,
    };
  }
  return row;
});

// Kiểm tra hợp lệ cơ bản.
for (const p of provinces) {
  if (p.lat < 8 || p.lat > 24) throw new Error(`${p.name}: vĩ độ vô lý ${p.lat}`);
  if (p.lon < 102 || p.lon > 110) throw new Error(`${p.name}: kinh độ vô lý ${p.lon}`);
}

const far = provinces.filter((p) => p.crossCheck && p.crossCheck.deltaDeg > 1.0);

writeFileSync(
  'packages/calendar-core/data/provinces_pre2025.json',
  JSON.stringify(
    {
      $comment:
        'Đơn vị hành chính cấp tỉnh trước sáp nhập 01/07/2025. Toạ độ = tỉnh lỵ, dùng cho giờ mặt trời thật (sai số ~±2 phút so với điểm sinh thực tế trong tỉnh).',
      scheme: {
        lat: 'vĩ độ tỉnh lỵ',
        lon: 'kinh độ tỉnh lỵ',
        mien_1960_1975:
          'bac | nam | chia — phân vùng múi giờ lịch sử 01/01/1960 – 12/06/1975. "chia" = tỉnh vắt qua vĩ tuyến 17, phải hỏi cấp huyện.',
        crossCheck: 'đối chiếu chéo tuỳ chọn với Wikidata P625 (điểm đại diện tỉnh)',
      },
      count: provinces.length,
      provinces,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log('tỉnh:', provinces.length);
console.log('đối chiếu Wikidata:', cross.size, '/ 63');
console.log('lệch > 1° (bình thường, Wikidata là tâm tỉnh):', far.length);
console.log('chia:', provinces.filter((p) => p.mien_1960_1975 === 'chia').map((p) => p.name).join(', '));
console.log('bắc:', provinces.filter((p) => p.mien_1960_1975 === 'bac').length,
  '| nam:', provinces.filter((p) => p.mien_1960_1975 === 'nam').length);
