export interface VaultDoctorSettings {
  excludedFolders: string[];
}

/** Folder paths only: case-sensitive, vault-relative, no glob interpretation. */
export function normalizeExcludedFolders(input: readonly string[]): string[] {
  const paths = input.map(raw => {
    const value = raw.trim().replace(/\\/g, '/');
    if (!value) return '';
    if (value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) {
      throw new Error('Use vault-relative folders, such as Archive/Old.');
    }
    const parts = value.split('/').filter(part => part && part !== '.');
    if (parts.includes('..') || parts.some(part => /[\u0000-\u001f]/.test(part)) || !parts.length) {
      throw new Error('Folder paths cannot select the vault root, contain control characters, or use .. segments.');
    }
    return parts.join('/');
  }).filter(Boolean);
  return [...new Set(paths)].sort().filter((path, _index, all) => !all.some(parent => path.startsWith(`${parent}/`)));
}

export function isExcluded(path: string, folders: readonly string[]): boolean {
  // Only descendants: an entry is a folder, never a same-named file.
  return folders.some(folder => path.startsWith(`${folder}/`));
}

export function loadSettings(data: unknown): VaultDoctorSettings {
  if (data === null || data === undefined) return { excludedFolders: [] };
  if (typeof data !== 'object' || !('excludedFolders' in data)
    || !Array.isArray(data.excludedFolders) || !data.excludedFolders.every(path => typeof path === 'string')) {
    throw new Error('Invalid saved folder exclusions.');
  }
  return { excludedFolders: normalizeExcludedFolders(data.excludedFolders) };
}
