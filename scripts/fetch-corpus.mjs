#!/usr/bin/env node
/**
 * Tải corpus Tầng A từ Wikisource, làm sạch wikitext, ghi:
 *   corpus/<key>.txt            — văn bản sạch, các quyển ngăn bằng 2 dòng trống
 *   corpus/<key>.segments.json  — {locator, start, end} để kiểm tra trích dẫn đúng quyển
 *   corpus/corpus.lock.json     — sha256 + url + thời điểm tải (chống sửa lén corpus)
 *
 * Chạy: npm run corpus:fetch
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS_DIR = join(ROOT, 'corpus');
const API = 'https://zh.wikisource.org/w/index.php';

const manifest = JSON.parse(
  await readFile(join(CORPUS_DIR, 'sources.manifest.json'), 'utf8'),
);

/** Dựng lại văn bản từ một template đã bị bóc lớp ngoài. */
function renderTemplate(body) {
  const parts = body.split('|');
  const name = parts[0].trim();
  if (/^header/i.test(name)) return ''; // metadata, không phải văn bản
  // giữ tham số vị trí (không có dấu =), bỏ tham số có tên
  return parts
    .slice(1)
    .filter((p) => !/^\s*[\w\-\s\u4e00-\u9fff]+\s*=/u.test(p))
    .map((p) => p.replace(/^\s*\d+\s*=\s*/, ''))
    .join('');
}

/** Bóc template lặp từ trong ra ngoài, giữ lại chữ nằm trong template. */
function stripTemplates(s) {
  let prev;
  let guard = 0;
  do {
    prev = s;
    s = s.replace(/\{\{([^{}]*)\}\}/g, (_, body) => renderTemplate(body));
    if (++guard > 20) break;
  } while (s !== prev && s.includes('{{'));
  return s;
}

/** Wikitext -> văn bản thuần. Giữ nguyên chữ Hán, chỉ bỏ markup. */
function cleanWikitext(raw) {
  let s = raw;
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<ref[^>]*\/>/gi, '');
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
  s = stripTemplates(s);
  s = s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1'); // [[a|b]] -> b
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, ''); // <poem>, <onlyinclude>...
  s = s.replace(/'{2,}/g, ''); // '''đậm'''
  s = s.replace(/^[ \t]*[-*#:]+[ \t]?/gm, ''); // bullet wiki
  s = s.replace(/[ \t\u00a0]+/g, ' ');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

const locatorOf = (title) => (title.includes('/') ? title.split('/').pop() : '全篇');

async function fetchRaw(title, ua, attempt = 1) {
  const url = `${API}?title=${encodeURIComponent(title)}&action=raw`;
  const res = await fetch(url, { headers: { 'User-Agent': ua } });
  if (!res.ok) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      return fetchRaw(title, ua, attempt + 1);
    }
    throw new Error(`HTTP ${res.status} khi tải ${title}`);
  }
  const text = await res.text();
  if (!text.trim()) throw new Error(`Trang rỗng: ${title}`);
  return { url, text };
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

await mkdir(CORPUS_DIR, { recursive: true });
const lock = {};
const report = [];

for (const src of manifest.sources) {
  const chunks = [];
  const segments = [];
  const urls = [];
  let cursor = 0;

  for (const page of src.pages) {
    const { url, text } = await fetchRaw(page, manifest.userAgent);
    urls.push(url);
    const body = cleanWikitext(text);
    if (!body) throw new Error(`Sau khi làm sạch, ${page} rỗng`);

    const locator = locatorOf(page);
    const start = cursor;
    chunks.push(body);
    cursor += body.length;
    segments.push({ locator, start, end: cursor });
    cursor += 2; // "\n\n"

    await new Promise((r) => setTimeout(r, 300)); // lịch sự với server
  }

  const joined = chunks.join('\n\n');
  const file = join(CORPUS_DIR, `${src.key}.txt`);
  const buf = Buffer.from(joined, 'utf8');

  await writeFile(file, buf);
  await writeFile(
    join(CORPUS_DIR, `${src.key}.segments.json`),
    JSON.stringify({ key: src.key, title: src.title, segments }, null, 2) + '\n',
    'utf8',
  );

  lock[src.key] = {
    title: src.title,
    domain: src.domain,
    tier: src.tier,
    license: src.license,
    provider: src.provider,
    pages: src.pages,
    urls,
    chars: joined.length,
    sha256: sha256(buf),
    fetchedAt: new Date().toISOString(),
  };

  report.push({ key: src.key, chars: joined.length, volumes: segments.length });
}

await writeFile(
  join(CORPUS_DIR, 'corpus.lock.json'),
  JSON.stringify(lock, null, 2) + '\n',
  'utf8',
);

console.log('Corpus đã tải:');
for (const r of report) {
  console.log(`  ${r.key.padEnd(18)} ${String(r.chars).padStart(8)} chữ  ${r.volumes} quyển`);
}
console.log('Lock: corpus/corpus.lock.json');
