// Node.js file handling for Lookalike.
// Uses the built-in fs/promises + path modules (no extra dependencies).
//
// Everything lives inside server/data/, and every file name that comes from
// an HTTP request is validated by safeFilePath() so nobody can read or delete
// files outside that folder (path-traversal protection).

import {
  appendFile, mkdir, readFile, writeFile, readdir, stat, unlink,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const dataDir = path.join(__dirname, 'data');
export const backupDir = path.join(dataDir, 'backups');
export const feedbackFile = path.join(dataDir, 'feedback.jsonl');

const ALLOWED_EXTENSIONS = new Set(['.json', '.jsonl', '.csv']);
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function ensureDirs() {
  await mkdir(backupDir, { recursive: true }); // also creates dataDir
}

// ---------- CREATE / APPEND ----------
export async function appendJsonLine(file, record) {
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, JSON.stringify(record) + '\n', {
    encoding: 'utf8',
    mode: 0o600,
  });
}

export async function writeJsonFile(file, payload) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(payload, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
}

// ---------- READ ----------
// Reads a JSON-Lines file and returns an array of objects.
// A missing file is not an error (nothing saved yet); a corrupt line is skipped.
export async function readJsonLines(file) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      console.warn('Skipping unreadable line in', path.basename(file));
    }
  }
  return rows;
}

// ---------- LIST ----------
async function describeDir(dir, prefix) {
  let names = [];
  try {
    names = await readdir(dir);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const name of names) {
    if (!ALLOWED_EXTENSIONS.has(path.extname(name))) continue;
    const info = await stat(path.join(dir, name));
    if (!info.isFile()) continue;
    files.push({
      name: prefix + name,
      size: info.size,
      modified: info.mtime.toISOString(),
    });
  }
  return files;
}

export async function listDataFiles() {
  const [main, backups] = await Promise.all([
    describeDir(dataDir, ''),
    describeDir(backupDir, 'backups/'),
  ]);
  return [...main, ...backups].sort((a, b) => b.modified.localeCompare(a.modified));
}

// ---------- SAFE PATHS ----------
// Accepts "feedback.jsonl" or "backups/products-2026-10-20.json".
// Returns an absolute path, or null if the name is not allowed.
export function safeFilePath(name) {
  if (typeof name !== 'string' || name.length > 120) return null;

  const parts = name.split('/');
  if (parts.length > 2) return null;
  if (parts.length === 2 && parts[0] !== 'backups') return null;

  const fileName = parts[parts.length - 1];
  if (!NAME_PATTERN.test(fileName) || fileName.includes('..')) return null;
  if (!ALLOWED_EXTENSIONS.has(path.extname(fileName))) return null;

  const base = parts.length === 2 ? backupDir : dataDir;
  const resolved = path.resolve(base, fileName);
  return resolved.startsWith(base + path.sep) ? resolved : null;
}

// ---------- DELETE ----------
export async function deleteDataFile(name) {
  const target = safeFilePath(name);
  if (!target) return { ok: false, status: 400, error: 'That file name is not allowed.' };

  try {
    await unlink(target);
    return { ok: true };
  } catch (error) {
    if (error.code === 'ENOENT') return { ok: false, status: 404, error: 'File not found.' };
    throw error;
  }
}

// ---------- BACKUP ----------
export async function writeBackup(payload) {
  await ensureDirs();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const name = `products-${stamp}.json`;
  await writeJsonFile(path.join(backupDir, name), payload);
  return `backups/${name}`;
}

// ---------- CSV EXPORT ----------
// Cells starting with = + - @ are prefixed with a quote so Excel never
// treats user-supplied feedback as a formula.
function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows, columns) {
  const lines = [columns.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(columns.map(column => csvCell(row[column])).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}
