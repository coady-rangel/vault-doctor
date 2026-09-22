import { CATEGORY_LABELS, type Category, type ScanReport } from './types';

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
export const SCOPE_WARNING = 'Orphan candidates have no supported reference in scanned Markdown notes. Canvas, HTML, plugin-generated links, and plain property paths are not inspected. Candidates are not proof that an attachment is unused.';
export const PROVISIONAL_WARNING = 'Reference coverage is incomplete: excluded or unreadable notes, or malformed frontmatter, may hide references. Orphan findings are provisional candidates.';

export function overallStatus(report: ScanReport): 'Healthy' | 'Needs attention' | 'Issues found' {
  if (report.counts['broken-link'] || report.counts['missing-attachment'] || report.counts['invalid-frontmatter']) return 'Issues found';
  if (report.findings.length || report.issues.length || report.orphanResultsIncomplete || !report.filesInspected) return 'Needs attention';
  return 'Healthy';
}

export function indicator(category: Category, report: ScanReport): string {
  return category === 'orphan-attachment'
    ? `Review · ${report.orphanResultsIncomplete ? 'provisional candidate' : 'candidate'}`
    : 'Issue · detected';
}

export function durationLabel(ms: number): string {
  return ms < 1000 ? `${ms.toFixed(1)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export function emptyMessage(report: ScanReport): string {
  if (!report.filesInspected) return 'No supported files were inspected. Check the vault contents, exclusions, and any scan errors.';
  if (report.issues.length || report.orphanResultsIncomplete) return 'No findings in the inspected files; coverage is incomplete.';
  return 'No problems found within the supported scan scope.';
}

// Escape vault-controlled text, including raw HTML and Markdown links, on export.
function escapeMarkdown(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}\[\]()#+.!|~-]/g, '\\$&');
}

export function reportMarkdown(report: ScanReport, version: string): string {
  const lines = [
    '# Vault Doctor health report', '',
    `Status: **${overallStatus(report)}**`, '',
    `Scan started: ${report.startedAt}`,
    `Scan duration: ${durationLabel(report.durationMs)}`,
    `Vault Doctor version: ${escapeMarkdown(version)}`, '',
    `Files inspected: ${report.filesInspected}`,
    `Notes scanned: ${report.notesScanned} of ${report.notesDiscovered}`,
    `Attachments checked (inventory only): ${report.attachmentsScanned}`,
    `Excluded files: ${report.excludedFiles} (${report.excludedNotes} notes)`,
    `Unsupported files skipped: ${report.unsupportedFiles}`,
    `Excluded folders: ${report.excludedFolders.length ? report.excludedFolders.map(escapeMarkdown).join(', ') : 'None'}`, '',
    'Local, read-only scan. Source files were not modified.', '', SCOPE_WARNING, '',
  ];
  if (report.orphanResultsIncomplete) lines.push(`**${PROVISIONAL_WARNING}**`, '');
  lines.push('## Summary', '', '| Category | Findings | Indicator |', '| --- | ---: | --- |');
  for (const category of CATEGORIES) lines.push(`| ${CATEGORY_LABELS[category]} | ${report.counts[category]} | ${indicator(category, report)} |`);
  lines.push('');
  if (!report.findings.length) lines.push(emptyMessage(report), '');
  for (const category of CATEGORIES) {
    const findings = report.findings.filter(finding => finding.category === category);
    if (!findings.length) continue;
    lines.push(`## ${CATEGORY_LABELS[category]}`, '', indicator(category, report), '');
    for (const finding of findings) {
      lines.push(`- ${escapeMarkdown(finding.path)}${finding.target ? ` → ${escapeMarkdown(finding.target)}` : ''}: ${escapeMarkdown(finding.explanation)}`);
    }
    lines.push('');
  }
  if (report.issues.length) {
    lines.push('## Scan errors (coverage incomplete)', '');
    for (const issue of report.issues) lines.push(`- ${escapeMarkdown(issue.path)}: ${escapeMarkdown(issue.explanation)}`);
  }
  return lines.join('\n') + '\n';
}
