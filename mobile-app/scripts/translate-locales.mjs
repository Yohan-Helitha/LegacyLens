#!/usr/bin/env node
/**
 * Fills the Sinhala (si) and Tamil (ta) interface catalogs from the English ones using the Google Cloud
 * Translation API (Basic / v2).
 *
 *   node scripts/translate-locales.mjs            translate only keys missing from si/ta
 *   node scripts/translate-locales.mjs --force    re-translate everything (overwrites reviewed text!)
 *   node scripts/translate-locales.mjs --dry-run  show what would be translated, call nothing
 *   node scripts/translate-locales.mjs --lang=si  one language only
 *   node scripts/translate-locales.mjs --report   write src/i18n/translation-review.md (no API calls)
 *
 * The API key is read from the GOOGLE_TRANSLATE_API_KEY environment variable, or else from the backend's
 * gitignored application-local.properties. It is never printed or logged.
 *
 * Machine translation is a first draft: have a native Sinhala / Tamil speaker review the generated files
 * in src/i18n/locales/{si,ta}. Reviewed text is kept on later runs (only *missing* keys are translated).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const BACKEND_PROPERTIES = path.resolve(ROOT, '..', 'backend', 'src', 'main', 'resources', 'application-local.properties');
const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const BATCH_SIZE = 50;
/** Product names that must never be translated. */
const BRAND_TERMS = ['Legacy Lens'];

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const REPORT = args.includes('--report');
const langArg = args.find((a) => a.startsWith('--lang='))?.split('=')[1];
const TARGETS = langArg ? [langArg] : ['si', 'ta'];

function loadApiKey() {
  if (process.env.GOOGLE_TRANSLATE_API_KEY?.trim()) return process.env.GOOGLE_TRANSLATE_API_KEY.trim();
  if (fs.existsSync(BACKEND_PROPERTIES)) {
    const line = fs.readFileSync(BACKEND_PROPERTIES, 'utf8').split(/\r?\n/).find((l) => l.startsWith('GOOGLE_TRANSLATE_API_KEY='));
    const value = line?.slice('GOOGLE_TRANSLATE_API_KEY='.length).trim();
    if (value) return value;
  }
  return null;
}

// ---- catalog helpers -------------------------------------------------------------------------------------
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') flatten(v, `${prefix}${k}.`, out);
    else out[`${prefix}${k}`] = v;
  }
  return out;
}

/** Rebuilds the nested object using the *English* key order, so every locale file has the same layout. */
function unflatten(flat, orderFrom) {
  const out = {};
  for (const key of Object.keys(orderFrom)) {
    if (!(key in flat)) continue;
    const parts = key.split('.');
    let cur = out;
    for (const part of parts.slice(0, -1)) cur = cur[part] ??= {};
    cur[parts.at(-1)] = flat[key];
  }
  return out;
}

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {});
const writeJson = (p, obj) => fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');

// ---- placeholder / tag protection -------------------------------------------------------------------------
const PLACEHOLDER = /\{\{([^}]+)\}\}/g;
const TAG = /<\/?[a-zA-Z][^>]*>/g;
/** Placeholders that hold numbers: swapped for a natural-looking number so the sentence translates fluently. */
const NUMERIC_NAMES = new Set(['count', 'level', 'number', 'views', 'previous', 'percent', 'seconds', 'rating', 'score']);
const SENTINEL_POOL = [7, 4, 9, 12, 15, 18, 21, 24];

const escapeAmp = (t) => t.replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;');
const wrapNoTranslate = (m) => `<span translate="no">${m}</span>`;
const placeholdersOf = (t) => [...t.matchAll(PLACEHOLDER)].map((m) => m[0]);

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

const unwrapNoTranslate = (html) => html.replace(/<span translate="no">([\s\S]*?)<\/span>/g, '$1');

/** Machine output often has stray spaces around punctuation and tags; tidy them. */
function normalize(text) {
  return text
    .replace(/<(\w+)>\s+/g, '<$1>')
    .replace(/\s+<\/(\w+)>/g, '</$1>')
    .replace(/([^\s>(])<(\w+)>/g, '$1 <$2>')
    .replace(/\s+([,.:;!?…])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

const sorted = (arr) => [...arr].sort().join('|');
/** The translation must keep the same {{placeholders}} and <tags>, and no stray braces. */
function isFaithful(source, translated) {
  const stripped = translated.replace(PLACEHOLDER, '');
  return (
    sorted(placeholdersOf(source)) === sorted(placeholdersOf(translated)) &&
    sorted(source.match(TAG) ?? []) === sorted(translated.match(TAG) ?? []) &&
    !/[{}]/.test(stripped)
  );
}

/**
 * Strategy A: numeric placeholders -> sample numbers (fluent sentences), text placeholders and brand names
 * -> protected spans. Strategy B: every placeholder a protected span. Strategy C: plain text.
 */
function prepare(strategy, text, key) {
  if (strategy === 'C') return { payload: text, format: 'text', restore: (t) => decodeEntities(t) };

  const used = new Set((text.match(/\d+/g) ?? []).map(Number));
  const sentinels = new Map(); // sentinel number -> '{{name}}'
  let html = escapeAmp(text);

  if (strategy === 'A') {
    const names = [...new Set(placeholdersOf(text).map((m) => m.slice(2, -2)))];
    const pool = [...SENTINEL_POOL];
    for (const name of names.filter((n) => NUMERIC_NAMES.has(n))) {
      let value = name === 'count' && key.endsWith('_one') ? 1 : pool.shift();
      while (value === undefined || used.has(value) || sentinels.has(value)) value = pool.shift() ?? (value ?? 30) + 1;
      used.add(value);
      sentinels.set(value, `{{${name}}}`);
      html = html.split(`{{${name}}}`).join(String(value));
    }
  }
  html = html.replace(/\{\{[^}]+\}\}/g, wrapNoTranslate);
  for (const term of BRAND_TERMS) html = html.split(term).join(wrapNoTranslate(term));

  return {
    payload: html,
    format: 'html',
    restore: (translated) => {
      let out = decodeEntities(unwrapNoTranslate(translated));
      for (const [value, token] of sentinels) {
        const re = new RegExp(`(?<![\\d.])${value}(?!\\d)`, 'g');
        if ((out.match(re) ?? []).length !== 1) return null; // sentinel lost or duplicated -> not faithful
        out = out.replace(re, token);
      }
      return out;
    },
  };
}

// ---- Google Cloud Translation (Basic v2) -------------------------------------------------------------------
async function callApi(key, target, texts, format) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
      body: JSON.stringify({ q: texts, source: 'en', target, format }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data.translations.map((t) => t.translatedText);
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }
    // Never echo the request (it carries the key); the API's own error message is safe.
    const body = await res.json().catch(() => ({}));
    throw new Error(`Translation API ${res.status}: ${body?.error?.message ?? 'request failed'}`);
  }
  throw new Error('Translation API: retries exhausted');
}

async function translateWith(strategy, key, target, entries) {
  const prepared = entries.map(([k, text]) => ({ k, text, ...prepare(strategy, text, k) }));
  const out = new Map();
  for (const format of ['html', 'text']) {
    const group = prepared.filter((p) => p.format === format);
    for (let i = 0; i < group.length; i += BATCH_SIZE) {
      const chunk = group.slice(i, i + BATCH_SIZE);
      const translated = await callApi(key, target, chunk.map((p) => p.payload), format);
      chunk.forEach((p, j) => {
        const restored = p.restore(translated[j]);
        const candidate = restored == null ? null : normalize(restored);
        if (candidate && isFaithful(p.text, candidate)) out.set(p.k, candidate);
      });
    }
  }
  return out;
}

async function translateAll(key, target, entries) {
  const results = {};
  let remaining = entries;
  for (const strategy of ['A', 'B', 'C']) {
    if (remaining.length === 0) break;
    const done = await translateWith(strategy, key, target, remaining);
    for (const [k, v] of done) results[k] = v;
    remaining = remaining.filter(([k]) => !(k in results));
  }
  return { results, problems: remaining.map(([k]) => k) };
}

// ---- main --------------------------------------------------------------------------------------------------
const namespaces = fs.readdirSync(path.join(LOCALES_DIR, 'en')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

/** Side-by-side table for a native-speaker review: src/i18n/translation-review.md */
function writeReport() {
  const rows = [];
  let needsAttention = 0;
  for (const ns of namespaces) {
    const en = flatten(readJson(path.join(LOCALES_DIR, 'en', `${ns}.json`)));
    const si = flatten(readJson(path.join(LOCALES_DIR, 'si', `${ns}.json`)));
    const ta = flatten(readJson(path.join(LOCALES_DIR, 'ta', `${ns}.json`)));
    for (const [k, text] of Object.entries(en)) {
      const flag = (v) => (!v || v === text ? ' (!)' : '');
      if (!si[k] || si[k] === text || !ta[k] || ta[k] === text) needsAttention++;
      const cell = (v) => `${(v ?? '').replace(/\|/g, '\\|')}${flag(v)}`;
      rows.push(`| ${ns}:${k} | ${text.replace(/\|/g, '\\|')} | ${cell(si[k])} | ${cell(ta[k])} |`);
    }
  }
  const md = [
    '# Translation review sheet',
    '',
    'Machine-translated (Google Cloud Translation) first drafts. A native speaker should check the Sinhala and Tamil columns,',
    'then edit the JSON files in `src/i18n/locales/{si,ta}` directly - reviewed text is kept when the script is re-run.',
    '`(!)` = still identical to English (left untranslated, or the machine output could not be verified).',
    '',
    `Rows: ${rows.length}, needing attention: ${needsAttention}`,
    '',
    '| Key | English | Sinhala | Tamil |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'src', 'i18n', 'translation-review.md'), md, 'utf8');
  console.log(`Wrote src/i18n/translation-review.md (${rows.length} rows, ${needsAttention} needing attention)`);
}

if (REPORT) {
  writeReport();
  process.exit(0);
}

const key = DRY_RUN ? null : loadApiKey();
if (!DRY_RUN && !key) {
  console.error('No GOOGLE_TRANSLATE_API_KEY found (env var or backend application-local.properties).');
  process.exit(1);
}

let totalTranslated = 0;
let totalChars = 0;

for (const ns of namespaces) {
  const enFlat = flatten(readJson(path.join(LOCALES_DIR, 'en', `${ns}.json`)));
  for (const lang of TARGETS) {
    const file = path.join(LOCALES_DIR, lang, `${ns}.json`);
    const existing = flatten(readJson(file));
    const todo = Object.entries(enFlat).filter(([k]) => FORCE || !(k in existing) || existing[k] === '');
    if (todo.length === 0) {
      console.log(`${lang}/${ns}: up to date`);
      continue;
    }
    const chars = todo.reduce((n, [, t]) => n + t.length, 0);
    console.log(`${lang}/${ns}: ${todo.length} string(s), ${chars} characters${DRY_RUN ? ' (dry run)' : ''}`);
    if (DRY_RUN) continue;

    const { results, problems } = await translateAll(key, lang, todo);
    // Anything that could not be translated faithfully falls back to English rather than shipping broken text.
    const merged = { ...existing, ...results };
    for (const p of problems) merged[p] = enFlat[p];
    writeJson(file, unflatten(merged, enFlat));
    totalTranslated += Object.keys(results).length;
    totalChars += chars;
    if (problems.length) console.warn(`  ! ${problems.length} string(s) kept in English (could not be verified): ${problems.join(', ')}`);
  }
}

if (!DRY_RUN) {
  console.log(`Done: ${totalTranslated} string(s) translated, ~${totalChars} characters billed.`);
  writeReport();
}
