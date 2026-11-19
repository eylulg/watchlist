/**
 * Fails when anything that could reveal the TMDB credential ends up in the browser bundle.
 * Run after `next build`. It never prints the key itself, only where a match was found.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const clientDir = path.join(root, '.next', 'static');

const readKeyFromDotEnv = () => {
  try {
    const line = readFileSync(path.join(root, '.env'), 'utf8')
      .split('\n')
      .find((entry) => entry.startsWith('TMDB_API_KEY='));
    return line
      ?.slice('TMDB_API_KEY='.length)
      .trim()
      .replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
};

const key = process.env.TMDB_API_KEY?.trim() || readKeyFromDotEnv();

/** Patterns that only server code should ever contain. */
const checks = [
  {
    name: 'the TMDB key value',
    test: (text) => Boolean(key && key.length >= 16 && text.includes(key)),
  },
  { name: 'the TMDB_API_KEY variable name', test: (text) => text.includes('TMDB_API_KEY') },
  { name: 'a direct TMDB API URL', test: (text) => text.includes('api.themoviedb.org') },
  { name: 'an api_key query parameter', test: (text) => /[?&]api_key=/.test(text) },
];

const files = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? files(full) : [full];
  });

let scanned;
try {
  scanned = files(clientDir).filter((file) => /\.(js|css|html|json|map)$/.test(file));
} catch {
  console.error('No client build found at .next/static. Run `npm run build` first.');
  process.exit(1);
}

const problems = scanned.flatMap((file) => {
  const text = readFileSync(file, 'utf8');
  return checks
    .filter((check) => check.test(text))
    .map((check) => `${path.relative(root, file)} contains ${check.name}`);
});

if (!key) console.warn('TMDB_API_KEY is not set, so only the name and URL patterns were checked.');

if (problems.length > 0) {
  console.error(`Client bundle check failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}

console.log(
  `Client bundle check passed: ${String(scanned.length)} files in .next/static, no TMDB credential or direct TMDB API access.`,
);
