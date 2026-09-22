import type { App } from 'obsidian';
import type { VaultReader } from './types';

export function createVaultReader(app: Pick<App, 'vault' | 'metadataCache'>): VaultReader {
  const files = app.vault.getFiles();
  const byPath = new Map(files.map(file => [file.path, file]));
  return {
    listFiles: () => files.map(file => file.path),
    async readNote(path) {
      const file = byPath.get(path);
      if (!file) throw new Error('File is no longer available. Run the scan again.');
      return app.vault.read(file);
    },
    resolveLink: (target, sourcePath) => app.metadataCache.getFirstLinkpathDest(target, sourcePath)?.path ?? null,
  };
}
