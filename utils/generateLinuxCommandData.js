const fs = require('fs');
const path = require('path');

const {
  COMMAND_DIR,
  PUBLIC_ROOT,
  SOURCE_META_PATH,
  listMarkdownFiles,
  extractCommandMeta,
  sanitizeText,
} = require('./linuxCommandShared');

const DETAIL_DIR = path.join(PUBLIC_ROOT, 'commands');

function normalizeSearchText(value) {
  return sanitizeText(value).toLowerCase();
}

function loadSourceMeta() {
  if (!fs.existsSync(SOURCE_META_PATH)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(SOURCE_META_PATH, 'utf8'));
}

function ensureSourceDocsExist(files) {
  if (files.length) {
    return;
  }

  throw new Error(
    `No Linux command markdown files found in ${COMMAND_DIR}. Run "npm run sync:linux-command" first.`,
  );
}

function main() {
  const files = listMarkdownFiles(COMMAND_DIR);
  ensureSourceDocsExist(files);

  fs.rmSync(PUBLIC_ROOT, { recursive: true, force: true });
  fs.mkdirSync(DETAIL_DIR, { recursive: true });

  const commands = files.map((filePath) => {
    const slug = path.basename(filePath, '.md');
    const rawMarkdown = fs.readFileSync(filePath, 'utf8');
    const meta = extractCommandMeta(rawMarkdown, slug);
    const commandData = {
      slug,
      title: meta.title,
      description: meta.description,
      sourcePath: `data/linux-command/command/${slug}.md`,
      markdown: rawMarkdown,
    };

    fs.writeFileSync(
      path.join(DETAIL_DIR, `${slug}.json`),
      JSON.stringify(commandData),
      'utf8',
    );

    return {
      slug,
      title: meta.title,
      description: meta.description,
      searchText: normalizeSearchText(`${slug} ${meta.title} ${meta.description}`),
    };
  });

  commands.sort((left, right) => left.title.localeCompare(right.title, 'en'));

  fs.writeFileSync(
    path.join(PUBLIC_ROOT, 'index.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalCommands: commands.length,
        metadata: loadSourceMeta(),
        commands,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Generated Linux command search data for ${commands.length} commands.`);
}

main();
