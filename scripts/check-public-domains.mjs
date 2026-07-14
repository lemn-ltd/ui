import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const root = process.cwd();
const forbiddenDomains = [
  ['lemn', 'ai'].join('.'),
  ['appranks', 'com'].join('.'),
];

const files = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  { cwd: root, encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);

const failures = [];

for (const file of files) {
  const content = await readFile(file);
  if (content.includes(0)) continue;

  const lines = content.toString('utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const normalizedLine = line.toLowerCase();
    const domain = forbiddenDomains.find((candidate) => normalizedLine.includes(candidate));
    if (domain) failures.push(`${file}:${index + 1}: contains legacy domain ${domain}`);
  });
}

if (failures.length > 0) {
  console.error('Public-domain check failed. Replace legacy deployment domains:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
