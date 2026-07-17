const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  COMMAND_DIR,
  DATA_ROOT,
  SOURCE_META_PATH,
  SOURCE_REPO,
} = require('./linuxCommandShared');

function runGit(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'linux-command-'));
  const cloneDir = path.join(tempRoot, 'repo');

  try {
    console.log(`Cloning ${SOURCE_REPO}`);
    runGit(['clone', '--depth', '1', SOURCE_REPO, cloneDir]);

    const logOutput = runGit([
      '-C',
      cloneDir,
      'log',
      '-1',
      '--date=iso-strict',
      '--pretty=format:%H%n%ad%n%s',
    ]);
    const [commitHash, commitDate, subject] = logOutput.split(/\r?\n/);

    const sourceCommandDir = path.join(cloneDir, 'command');
    const commandFiles = fs
      .readdirSync(sourceCommandDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.md');

    ensureCleanDir(COMMAND_DIR);
    for (const entry of commandFiles) {
      fs.copyFileSync(
        path.join(sourceCommandDir, entry.name),
        path.join(COMMAND_DIR, entry.name),
      );
    }

    fs.mkdirSync(DATA_ROOT, { recursive: true });
    fs.writeFileSync(
      SOURCE_META_PATH,
      JSON.stringify(
        {
          repo: SOURCE_REPO,
          syncedAt: new Date().toISOString(),
          commandCount: commandFiles.length,
          sourceCommit: {
            hash: commitHash,
            date: commitDate,
            subject,
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    console.log(`Synced ${commandFiles.length} command documents to ${COMMAND_DIR}`);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
