export type Category = 'broken-link' | 'missing-attachment' | 'orphan-attachment' | 'invalid-frontmatter';

export interface Finding {
  readonly category: Category;
  /** Existing source note, or the orphan attachment itself. Never a missing target. */
  readonly path: string;
  readonly target?: string;
  readonly explanation: string;
}

/** Deliberately no write, create, delete, rename, or network capabilities. */
export interface VaultReader {
  listFiles(): readonly string[];
  readNote(path: string): Promise<string>;
  resolveLink(target: string, sourcePath: string): string | null;
}

export interface ScanReport {
  readonly startedAt: string;
  readonly durationMs: number;
  readonly filesInspected: number;
  readonly notesDiscovered: number;
  readonly excludedFiles: number;
  readonly excludedNotes: number;
  readonly excludedFolders: readonly string[];
  readonly notesScanned: number;
  readonly attachmentsScanned: number;
  readonly counts: Record<Category, number>;
  readonly findings: readonly Finding[];
  readonly issues: readonly { path: string; explanation: string }[];
  readonly orphanResultsIncomplete: boolean;
  readonly unsupportedFiles: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  'broken-link': 'Broken internal note links',
  'missing-attachment': 'Missing attachments',
  'orphan-attachment': 'Orphan attachment candidates',
  'invalid-frontmatter': 'Invalid frontmatter',
};
