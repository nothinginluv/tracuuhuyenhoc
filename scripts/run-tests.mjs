/**
 * Chạy toàn bộ test bằng `node --test` với danh sách tệp cụ thể.
 *
 * Vì sao không truyền thư mục: Node 24 (bản CI đang pin) không nhận thư mục làm
 * đối số của `--test`, còn Node 26 thì có. Liệt kê tệp thủ công cho cả hai bản
 * chạy giống nhau, và không phụ thuộc shell nào có mở rộng glob hay không.
 */
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOTS = [
  'packages/calendar-core/test',
  'packages/tuvi-engine/test',
  'packages/bazi-engine/test',
  'apps/web/test',
];

/** @param {string} dir */
function collect(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(path));
    else if (/\.test\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

const files = ROOTS.flatMap(collect).sort();
if (files.length === 0) {
  console.error('Không tìm thấy tệp test nào.');
  process.exit(1);
}

console.log(`Chạy ${files.length} tệp test.`);
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
