import path from 'node:path';
import type { VaultReader } from '../src/types';

export const SYNTHETIC_COUNTS = { 'broken-link': 3, 'missing-attachment': 2, 'orphan-attachment': 2, 'invalid-frontmatter': 2 };

/** In-memory, deterministic, unambiguous fixture; not an Obsidian resolver emulator. */
export function syntheticVault(noteCount: number): { contents: ReadonlyMap<string, string>; reader: VaultReader } {
  if (!Number.isInteger(noteCount) || noteCount < 10) throw new Error('Use an integer note count of at least 10.');
  const contents = new Map<string, string>();
  const notePath = (i: number) => `Notes/Group ${i % 10}/Note ${String(i).padStart(5, '0')} 雪.md`;
  const usedAssets = Math.ceil(noteCount / 10);
  for (let i = 0; i < noteCount; i++) {
    const next = notePath((i + 1) % noteCount);
    const relative = path.posix.relative(path.posix.dirname(notePath(i)), next);
    let body = `---\ntitle: Note ${i}\naliases: [Display ${i}]\n---\n# Heading\n\n[[${next.slice(0, -3)}|next]]\n[relative](${encodeURI(relative)})\n[[${next}#Heading]]\n[[${next}#^block]]\n![[Assets/Used ${i % usedAssets}.svg]]\n[external](https://example.invalid/ignored.md)\n\nBlock ^block\n`;
    if (i < 3) body += `[[Deliberately missing ${i}]]\n`;
    if (i < 2) body += `![[Assets/Missing ${i}.png]]\n`;
    if (i === 3 || i === 4) body = body.replace(`title: Note ${i}`, 'title: [unclosed');
    contents.set(notePath(i), body);
  }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>\n';
  for (let i = 0; i < usedAssets; i++) contents.set(`Assets/Used ${i}.svg`, svg);
  for (let i = 0; i < 2; i++) contents.set(`Assets/Orphan ${i}.svg`, svg);
  const files = Object.freeze([...contents.keys()]);
  const reader: VaultReader = Object.freeze({
    listFiles: () => files,
    readNote: async (file: string) => {
      const value = contents.get(file);
      if (value === undefined) throw new Error('Missing synthetic file');
      return value;
    },
    resolveLink: (target: string, source: string) => {
      const relative = path.posix.normalize(path.posix.join(path.posix.dirname(source), target));
      return [relative, `${relative}.md`, target, `${target}.md`].find(candidate => contents.has(candidate)) ?? null;
    },
  });
  return { contents, reader };
}
