import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import { isScalar, parseDocument, visit } from 'yaml';

export interface Reference {
  readonly target: string;
  readonly embedded: boolean;
  readonly syntax: 'wiki' | 'markdown';
}

const markdown = new MarkdownIt({ html: true, linkify: false });

// Inline rules leave escaped links, inline code, and fenced code untouched.
markdown.inline.ruler.before('link', 'obsidian-wikilink', (state, silent) => {
  const start = state.pos;
  const embedded = state.src.startsWith('![[', start);
  const opener = embedded ? 3 : 2;
  if (!embedded && !state.src.startsWith('[[', start)) return false;
  const end = state.src.indexOf(']]', start + opener);
  if (end < 0) return false;
  const inner = state.src.slice(start + opener, end);
  if (inner.includes('\n')) return false;
  if (!silent) {
    const token = state.push('vault_reference', '', 0);
    token.attrSet('target', inner.split('|')[0]!.trim());
    token.attrSet('embedded', String(embedded));
  }
  state.pos = end + 2;
  return true;
});

// Obsidian comments, including multiline comments, are not active links.
markdown.inline.ruler.before('text', 'obsidian-comment', (state) => {
  if (!state.src.startsWith('%%', state.pos)) return false;
  const end = state.src.indexOf('%%', state.pos + 2);
  if (end < 0) return false;
  state.pos = end + 2;
  return true;
});

function referencesIn(text: string): Reference[] {
  const refs: Reference[] = [];
  const walk = (tokens: Token[]) => {
    for (const token of tokens) {
      if (token.type === 'vault_reference') {
        refs.push({ target: token.attrGet('target') ?? '', embedded: token.attrGet('embedded') === 'true', syntax: 'wiki' });
      } else if (token.type === 'link_open' || token.type === 'image') {
        refs.push({ target: token.attrGet(token.type === 'image' ? 'src' : 'href') ?? '', embedded: token.type === 'image', syntax: 'markdown' });
      }
      // Image alt text is not a second active reference.
      if (token.children && token.type !== 'image') walk(token.children);
    }
  };
  walk(markdown.parse(text, {}));
  return refs;
}

export function parseNote(content: string): {
  references: Reference[];
  frontmatterError?: string;
  referencesComplete: boolean;
} {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (!/^---[ \t]*$/.test(lines[0] ?? '')) {
    return { references: referencesIn(content), referencesComplete: true };
  }
  const end = lines.findIndex((line, index) => index > 0 && /^---[ \t]*$/.test(line));
  if (end === -1) {
    return { references: [], frontmatterError: 'Opening frontmatter delimiter has no closing --- delimiter.', referencesComplete: false };
  }

  const references = referencesIn(lines.slice(end + 1).join('\n'));
  const document = parseDocument(lines.slice(1, end).join('\n'), { prettyErrors: false });
  if (document.errors.length) {
    return {
      references,
      frontmatterError: document.errors.map(error => error.message).join('; '),
      referencesComplete: false,
    };
  }
  let aliasError: string | undefined;
  // Walk the syntax tree instead of expanding aliases (including recursive aliases).
  visit(document, {
    Alias(_key, node) {
      if (!node.resolve(document)) aliasError = `Unresolved YAML alias: ${node.source}`;
    },
    Scalar(key, node) {
      if (key !== 'key' && isScalar(node) && typeof node.value === 'string') {
        references.push(...referencesIn(node.value));
      }
    },
  });
  return { references, frontmatterError: aliasError, referencesComplete: !aliasError };
}

/** URI schemes and protocol-relative URLs are never local vault links. */
export function localTarget(raw: string): string | null {
  const target = raw.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) return null;
  // Split before decoding so a filename containing an encoded # is preserved.
  const path = target.split('#')[0]!;
  if (!path) return null; // Same-note heading/block links are outside target existence checks.
  try {
    return decodeURIComponent(path);
  } catch {
    return path; // Literal percent signs are legal in vault filenames.
  }
}
