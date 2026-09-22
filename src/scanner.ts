import { localTarget, parseNote } from './parse';
import { isExcluded, normalizeExcludedFolders } from './settings';
import type { Finding, ScanReport, VaultReader } from './types';

// Bounded, explicit asset set; extension matching is case-insensitive.
export const ATTACHMENT_EXTENSIONS = new Set([
  'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp',
  'flac', 'm4a', 'mp3', 'ogg', 'wav', 'webm', '3gp', 'mkv', 'mov', 'mp4', 'ogv', 'pdf',
]);

export function extension(path: string): string {
  return path.split('/').pop()!.split('.').slice(1).pop()?.toLowerCase() ?? '';
}

export function isAttachment(path: string): boolean {
  return ATTACHMENT_EXTENSIONS.has(extension(path));
}

export async function scanVault(reader: VaultReader, options: {
  excludedFolders?: readonly string[];
  signal?: AbortSignal;
} = {}): Promise<ScanReport> {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const excludedFolders = normalizeExcludedFolders(options.excludedFolders ?? []);
  // Copy the inventory; never sort or alter an array owned by the host.
  const allFiles = [...reader.listFiles()].sort();
  const inventory = new Set(allFiles);
  const files = allFiles.filter(path => !isExcluded(path, excludedFolders));
  const excludedNotes = allFiles.filter(path => extension(path) === 'md' && isExcluded(path, excludedFolders)).length;
  const notes = files.filter(path => extension(path) === 'md');
  const attachments = files.filter(isAttachment);
  const referenced = new Set<string>();
  const findings: Finding[] = [];
  const issues: { path: string; explanation: string }[] = [];
  let notesScanned = 0;
  let orphanResultsIncomplete = excludedNotes > 0;

  for (const [index, path] of notes.entries()) {
    options.signal?.throwIfAborted();
    // Let the host paint and handle cancellation, even with immediately resolved reads.
    if (index > 0 && index % 100 === 0) await new Promise<void>(resolve => setTimeout(resolve, 0));
    options.signal?.throwIfAborted();
    try {
      const parsed = parseNote(await reader.readNote(path));
      notesScanned++;
      if (parsed.frontmatterError) {
        findings.push({ category: 'invalid-frontmatter', path, explanation: parsed.frontmatterError });
      }
      if (!parsed.referencesComplete) orphanResultsIncomplete = true;
      const seen = new Set<string>();
      for (const reference of parsed.references) {
        const target = localTarget(reference.target);
        if (target === null) continue;
        const resolved = reader.resolveLink(target, path);
        if (resolved && inventory.has(resolved)) {
          if (isAttachment(resolved)) referenced.add(resolved);
          continue;
        }
        const ext = extension(target);
        // Known asset suffixes identify attachments even in ordinary links.
        // Extensionless embeds can be note transclusions, so classify them as notes.
        const category = isAttachment(target) ? 'missing-attachment' : 'broken-link';
        if (ext && ext !== 'md' && !isAttachment(target) && reference.syntax !== 'wiki') continue;
        const key = `${category}:${target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          category,
          path,
          target,
          explanation: category === 'missing-attachment'
            ? 'This local attachment target could not be resolved from the source note.'
            : 'This internal note target could not be resolved from the source note.',
        });
      }
    } catch (error) {
      orphanResultsIncomplete = true;
      issues.push({ path, explanation: `Could not fully scan this note: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  options.signal?.throwIfAborted();

  for (const path of attachments) {
    if (!referenced.has(path)) {
      findings.push({
        category: 'orphan-attachment', path,
        explanation: 'No supported reference to this attachment was found in the scanned Markdown notes.'
          + (orphanResultsIncomplete ? ' Reference coverage is incomplete; this is only an orphan candidate.' : ''),
      });
    }
  }

  const counts: ScanReport['counts'] = {
    'broken-link': 0, 'missing-attachment': 0, 'orphan-attachment': 0, 'invalid-frontmatter': 0,
  };
  for (const finding of findings) counts[finding.category]++;
  return {
    startedAt, durationMs: performance.now() - started,
    filesInspected: notesScanned + attachments.length, notesDiscovered: notes.length,
    excludedFiles: allFiles.length - files.length, excludedNotes, excludedFolders,
    notesScanned, attachmentsScanned: attachments.length, findings, counts, issues, orphanResultsIncomplete,
    unsupportedFiles: files.length - notes.length - attachments.length,
  };
}
