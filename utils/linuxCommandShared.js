const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(PROJECT_ROOT, 'data', 'linux-command');
const COMMAND_DIR = path.join(DATA_ROOT, 'command');
const SOURCE_META_PATH = path.join(DATA_ROOT, 'source.json');
const PUBLIC_ROOT = path.join(PROJECT_ROOT, 'docs', '.vuepress', 'public', 'linux-command');
const SOURCE_REPO = 'https://github.com/jaywcjlove/linux-command.git';

function sanitizeText(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\u2060]/g, '')
    .trim();
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.md')
    .map((entry) => path.join(dir, entry.name))
    .sort((left, right) => left.localeCompare(right, 'en'));
}

function extractCommandMeta(markdown, fallbackTitle) {
  const normalized = String(markdown || '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const firstLine = sanitizeText(lines[0] || fallbackTitle || '');
  let description = '';

  for (let index = 2; index < lines.length; index += 1) {
    const current = sanitizeText(lines[index]);
    if (!current) {
      continue;
    }

    description = current;
    break;
  }

  return {
    title: firstLine || sanitizeText(fallbackTitle),
    description,
  };
}

module.exports = {
  PROJECT_ROOT,
  DATA_ROOT,
  COMMAND_DIR,
  SOURCE_META_PATH,
  PUBLIC_ROOT,
  SOURCE_REPO,
  sanitizeText,
  listMarkdownFiles,
  extractCommandMeta,
};
