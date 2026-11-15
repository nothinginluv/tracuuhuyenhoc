import { useMemo, useState, type FormEvent } from 'react';
import { PROVINCES } from '../../../../packages/calendar-core/src/provinces.ts';
import type { PresetName } from '../../../../packages/calendar-core/src/index.ts';
import type { LeapMonthRule } from '../../../../packages/tuvi-engine/src/index.ts';
import { PRESET_INFO, QUANG_TRI, type FormValues } from '../form.ts';

const DISTRICT_NAMES = ['Vĩnh Linh (bắc vĩ tuyến 17)', 'Huyện khác (nam vĩ tuyến 17)'];

/** Chỉ giữ chữ số, cắt đúng độ dài. Cho phép gõ "04" hoặc "4". */
const digits = (value: string, max: number): string => value.replace(/\D/g, '').slice(0, max);

type Props = {
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  error: string | null;
  busy?: boolean;
};

export function BirthForm({ values, onChange, onSubmit, onCancel, error, busy }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const provinces = useMemo(
    () => [...PROVINCES].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [],
  );

  const year = Number(values.year);
  const needsDistrict = values.province === QUANG_TRI && year >= 1960 && year <= 1975;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="form" onSubmit={submit}>
      <p className="form-kicker">Lập lá số</p>
      <h1 className="form-title">Ngày giờ sinh</h1>

      <div className="form-grid">
        <div className="field">
          <span className="field-label" id="birth-date-label">
            Ngày sinh (dương lịch)
          </span>
          <div className="split-input" role="group" aria-labelledby="birth-date-label">
            <label className="subfield">
              <span>Ngày</span>
              <input
                id="birth-day"
                type="text"
                inputMode="numeric"
                autoComplete="bday-day"
                maxLength={2}
                value={values.day}
                onChange={(e) => onChange({ day: digits(e.target.value, 2) })}
              />
            </label>
            <label className="subfield">
              <span>Tháng</span>
              <input
                id="birth-month"
                type="text"
                inputMode="numeric"
                autoComplete="bday-month"
                maxLength={2}
                value={values.month}
                onChange={(e) => onChange({ month: digits(e.target.value, 2) })}
              />
            </label>
            <label className="subfield year">
              <span>Năm</span>
              <input
                id="birth-year"
                type="text"
                inputMode="numeric"
                autoComplete="bday-year"
                maxLength={4}
                value={values.year}
                onChange={(e) => onChange({ year: digits(e.target.value, 4) })}
              />
            </label>
          </div>
        </div>

        <div className="field">
          <span className="field-label" id="birth-time-label">
            Giờ sinh
          </span>
          <div className="split-input" role="group" aria-labelledby="birth-time-label">
            <label className="subfield">
              <span>Giờ</span>
              <input
                id="birth-hour"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={values.hour}
                onChange={(e) => onChange({ hour: digits(e.target.value, 2) })}
              />
            </label>
            <span className="time-sep" aria-hidden="true">
              :
            </span>
            <label className="subfield">
              <span>Phút</span>
              <input
                id="birth-minute"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={values.minute}
                onChange={(e) => onChange({ minute: digits(e.target.value, 2) })}
              />
            </label>
          </div>
          <span className="field-hint">Giờ trên đồng hồ nơi sinh, 24 giờ.</span>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="birth-province">
            Nơi sinh
          </label>
          <select
            id="birth-province"
            value={values.province}
            onChange={(e) =>
              onChange({
                province: e.target.value,
                district: e.target.value === QUANG_TRI ? values.district : '',
              })
            }
          >
            <option value="">— Không rõ / ngoài Việt Nam —</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="field-hint">Tỉnh, thành trước 01/07/2025 — dùng cho múi giờ lịch sử.</span>
        </div>

        <div className="field">
          <span className="field-label" id="gender-label">
            Giới tính
          </span>
          <div className="segmented" role="group" aria-labelledby="gender-label">
            {(
              [
                ['nam', 'Nam'],
                ['nu', 'Nữ'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={values.gender === value}
                onClick={() => onChange({ gender: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {needsDistrict && (
        <div className="field district">
          <label className="field-label" htmlFor="birth-district">
            Huyện nơi sinh (Quảng Trị, 1960–1975)
          </label>
          <select
            id="birth-district"
            value={values.district || DISTRICT_NAMES[1]}
            onChange={(e) => onChange({ district: e.target.value })}
          >
            {DISTRICT_NAMES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="field-hint">
            Vĩnh Linh dùng UTC+7, phần còn lại dùng UTC+8 trong giai đoạn này.
          </span>
        </div>
      )}

      <div className="form-foot">
        <button
          type="button"
          className="link-btn"
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={advanced}
        >
          {advanced ? 'Thu gọn quy ước' : 'Tuỳ chỉnh quy ước'}
        </button>
        <div className="form-actions">
          {onCancel && (
            <button type="button" className="link-btn" onClick={onCancel}>
              Huỷ
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Đang an…' : 'An lá số'}
          </button>
        </div>
      </div>

      {advanced && (
        <div className="advanced">
          <div className="field">
            <label className="field-label" htmlFor="birth-preset">
              Quy ước tính
            </label>
            <select
              id="birth-preset"
              value={values.preset}
              onChange={(e) => onChange({ preset: e.target.value as PresetName })}
            >
              {(Object.keys(PRESET_INFO) as PresetName[]).map((key) => (
                <option key={key} value={key}>
                  {PRESET_INFO[key].label}
                </option>
              ))}
            </select>
            <span className="field-hint">{PRESET_INFO[values.preset].detail}</span>
          </div>

          <div className="advanced-grid">
            <div className="field">
              <label className="field-label" htmlFor="birth-zi">
                Ranh giới giờ Tý
              </label>
              <select
                id="birth-zi"
                value={values.ziBoundary}
                onChange={(e) =>
                  onChange({ ziBoundary: e.target.value as FormValues['ziBoundary'] })
                }
              >
                <option value="">Theo quy ước chung</option>
                <option value="late">Tý muộn — đổi ngày lúc 00:00</option>
                <option value="early">Tý sớm — đổi ngày lúc 23:00</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="birth-hourstem">
                Can giờ 23:00–23:59
              </label>
              <select
                id="birth-hourstem"
                value={values.hourStemRule}
                onChange={(e) =>
                  onChange({ hourStemRule: e.target.value as FormValues['hourStemRule'] })
                }
              >
                <option value="">Theo quy ước chung</option>
                <option value="current-day">Suy từ can ngày hiện tại</option>
                <option value="next-day">Suy từ can ngày kế tiếp</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="birth-leap">
                Tháng nhuận (Tử Vi)
              </label>
              <select
                id="birth-leap"
                value={values.leapMonthRule}
                onChange={(e) => onChange({ leapMonthRule: e.target.value as LeapMonthRule })}
              >
                <option value="split">Chia đôi tháng nhuận</option>
                <option value="as-month">Giữ nguyên số tháng</option>
                <option value="as-next">Dồn sang tháng sau</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          <strong>Không dựng được lá số.</strong> {error}
        </div>
      )}
    </form>
  );
}
