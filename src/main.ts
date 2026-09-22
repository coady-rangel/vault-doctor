import { Modal, Notice, normalizePath, Plugin, PluginSettingTab, Setting, TFile, type App } from 'obsidian';
import { createVaultReader } from './obsidian-reader';
import { CATEGORIES, durationLabel, emptyMessage, indicator, overallStatus, PROVISIONAL_WARNING, reportMarkdown, SCOPE_WARNING } from './report';
import { scanVault } from './scanner';
import { loadSettings, normalizeExcludedFolders, type VaultDoctorSettings } from './settings';
import { CATEGORY_LABELS, type ScanReport } from './types';

export class ReportModal extends Modal {
  private closed = false;
  constructor(app: App, private version: string, private cancel: () => void) { super(app); }

  onOpen(): void {
    this.titleEl.setText('Vault Doctor');
    this.contentEl.addClass('vault-doctor-report');
    this.contentEl.createEl('p', { text: 'Scanning Markdown notes… No source files are changed. Close this report to cancel.' });
  }

  showError(): void {
    if (this.closed) return;
    this.contentEl.empty();
    this.contentEl.createEl('p', { text: 'The scan could not complete. Wait for the vault to finish loading and try again.' });
  }

  showReport(report: ScanReport): void {
    if (this.closed) return;
    const el = this.contentEl;
    el.empty();
    const status = overallStatus(report);
    el.createEl('h2', { cls: `vault-doctor-status vault-doctor-status-${status === 'Healthy' ? 'healthy' : 'attention'}`, text: status });
    el.createEl('p', { text: `${report.notesScanned} notes scanned · ${report.attachmentsScanned} attachments checked · ${report.findings.length} findings` });
    el.createEl('p', { cls: 'vault-doctor-scope', text: `Scan started ${new Date(report.startedAt).toLocaleString()} · ${durationLabel(report.durationMs)} · Vault Doctor ${this.version}` });
    const summary = el.createDiv({ cls: 'vault-doctor-summary' });
    for (const category of CATEGORIES) {
      const card = summary.createDiv({ cls: 'vault-doctor-summary-item' });
      card.createEl('strong', { text: String(report.counts[category]) });
      card.createEl('span', { text: CATEGORY_LABELS[category] });
      if (!report.counts[category]) card.createEl('small', { text: 'No findings' });
      else if (category === 'orphan-attachment') card.createEl('small', { text: indicator(category, report) });
    }
    const copy = el.createEl('button', { text: 'Copy report as Markdown', attr: { type: 'button' } });
    copy.addEventListener('click', () => { void this.copyReport(report, copy); });
    el.createEl('p', { cls: 'vault-doctor-scope', text: `Local, read-only health check. ${SCOPE_WARNING}` });
    if (report.excludedFolders.length) {
      el.createEl('p', { cls: 'vault-doctor-scope', text: `Excluded folders: ${report.excludedFolders.join(', ')} (${report.excludedFiles} files, including ${report.excludedNotes} notes).` });
    }
    if (report.unsupportedFiles) {
      el.createEl('p', { cls: 'vault-doctor-scope', text: `${report.unsupportedFiles} files outside the supported note/attachment types were not scanned.` });
    }
    if (report.orphanResultsIncomplete) {
      el.createEl('p', { cls: 'vault-doctor-warning', text: PROVISIONAL_WARNING, attr: { role: 'note', 'aria-label': 'Reference coverage caveat' } });
    }
    if (!report.findings.length) el.createEl('p', { text: emptyMessage(report) });
    for (const category of CATEGORIES) {
      const findings = report.findings.filter(finding => finding.category === category);
      if (!findings.length) continue;
      const section = el.createEl('section', { cls: 'vault-doctor-findings' });
      section.createEl('h3', { text: `${CATEGORY_LABELS[category]} (${findings.length})` });
      const list = section.createEl('ul');
      // Bound initial DOM size. All findings remain available on demand and in export.
      let shown = 0;
      let more: HTMLButtonElement | undefined;
      const append = () => {
        for (const finding of findings.slice(shown, shown + 100)) {
          const item = list.createEl('li');
          this.addFileButton(item, finding.path);
          if (finding.target) item.createEl('span', { text: ` → ${finding.target}` });
          item.createEl('p', { text: finding.explanation });
        }
        shown = Math.min(shown + 100, findings.length);
        const remaining = findings.length - shown;
        if (remaining > 0) {
          if (!more) {
            more = section.createEl('button', { attr: { type: 'button' } });
            more.addEventListener('click', append);
          }
          more.setText(`Show next ${Math.min(100, remaining)} (${remaining} remaining)`);
        } else {
          more?.remove();
          more = undefined;
        }
      };
      append();
    }
    if (report.issues.length) {
      el.createEl('h3', { text: 'Scan errors (coverage incomplete)' });
      for (const issue of report.issues) {
        const item = el.createEl('p');
        this.addFileButton(item, issue.path);
        item.createSpan({ text: `: ${issue.explanation}` });
      }
    }
  }

  private async copyReport(report: ScanReport, button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    const markdown = reportMarkdown(report, this.version);
    try {
      // Standard browser API; no Electron dependency or vault file creation.
      await this.contentEl.doc.defaultView!.navigator.clipboard.writeText(markdown);
      if (!this.closed) new Notice('Health report copied as Markdown.');
    } catch {
      if (this.closed) return;
      let area = this.contentEl.querySelector<HTMLTextAreaElement>('.vault-doctor-export');
      if (!area) {
        this.contentEl.createEl('p', { text: 'Clipboard unavailable. Select and copy the Markdown below.' });
        area = this.contentEl.createEl('textarea', { cls: 'vault-doctor-export', attr: { readonly: '', 'aria-label': 'Health report Markdown' } });
      }
      area.value = markdown;
      area.focus();
      area.select();
    } finally {
      button.disabled = false;
    }
  }

  private addFileButton(parent: HTMLElement, path: string): void {
    const button = parent.createEl('button', { cls: 'vault-doctor-file', text: path, attr: { type: 'button', 'aria-label': `Open ${path}` } });
    button.addEventListener('click', () => { void this.openExistingFile(path); });
  }

  private async openExistingFile(path: string): Promise<void> {
    // Never use openLinkText on missing targets: it can lead to file creation.
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      new Notice('This file is no longer available. Run the scan again.');
      return;
    }
    try {
      await this.app.workspace.getLeaf(false).openFile(file);
      this.close();
    } catch {
      new Notice('Obsidian could not open this file. Locate it using the path in the report.');
    }
  }

  onClose(): void { this.closed = true; this.cancel(); this.contentEl.empty(); }
}

class VaultDoctorSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: VaultDoctorPlugin) { super(app, plugin); }

  display(): void {
    this.containerEl.empty();
    let draft = this.plugin.settings.excludedFolders.join('\n');
    new Setting(this.containerEl)
      .setName('Excluded folders')
      .setDesc('One vault-relative folder per line, such as Archive/Old. Includes subfolders; case-sensitive, no wildcards. Blank scans all supported files. Links into excluded folders still resolve; excluded notes make orphan candidates provisional. Apply saves only this plugin preference; scan again to update the report.')
      .addTextArea(text => text.setPlaceholder('Archive\nTemplates').setValue(draft).onChange(value => { draft = value; }));
    new Setting(this.containerEl).addButton(button => button.setButtonText('Apply exclusions').onClick(async () => {
      button.setDisabled(true);
      try {
        const excludedFolders = normalizeExcludedFolders(draft.split(/\r?\n/)).map(path => normalizePath(path));
        await this.plugin.saveData({ excludedFolders });
        this.plugin.settings = { excludedFolders };
        this.plugin.settingsReady = true;
        new Notice('Exclusions saved. Run a new scan to apply them.');
        this.display();
      } catch (error) {
        new Notice(`Could not apply exclusions: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        button.setDisabled(false);
      }
    }));
  }
}

export default class VaultDoctorPlugin extends Plugin {
  settings: VaultDoctorSettings = { excludedFolders: [] };
  settingsReady = false;
  private scanning = false;
  private disposed = false;
  private controller?: AbortController;
  private modal?: ReportModal;

  async onload(): Promise<void> {
    try {
      this.settings = loadSettings(await this.loadData());
      this.settingsReady = true;
    } catch {
      new Notice('Vault Doctor could not load exclusions. Review and apply exclusions in its settings before scanning.');
    }
    if (this.disposed) return;
    this.addSettingTab(new VaultDoctorSettingTab(this.app, this));
    this.addCommand({
      id: 'scan-vault',
      name: 'Scan vault', // Obsidian prefixes this with the plugin name.
      callback: () => { void this.runScan(); },
    });
  }

  private async runScan(): Promise<void> {
    if (!this.settingsReady) {
      new Notice('Review and apply exclusions in Vault Doctor settings before scanning.');
      return;
    }
    if (this.scanning) {
      new Notice('Vault Doctor is already scanning.');
      return;
    }
    this.modal?.close();
    this.scanning = true;
    const controller = new AbortController();
    this.controller = controller;
    const modal = new ReportModal(this.app, this.manifest.version, () => controller.abort());
    this.modal = modal;
    modal.open();
    try {
      const report = await scanVault(createVaultReader(this.app), { excludedFolders: this.settings.excludedFolders, signal: controller.signal });
      if (!controller.signal.aborted) modal.showReport(report);
    } catch {
      if (!controller.signal.aborted) modal.showError();
    } finally {
      this.scanning = false;
      this.controller = undefined;
    }
  }

  onunload(): void {
    this.disposed = true;
    this.controller?.abort();
    this.modal?.close();
    this.modal = undefined;
  }
}
