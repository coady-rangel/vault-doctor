/** Test-only Obsidian DOM surface. No browser, vault, clipboard, or settings access. */
interface ElementOptions {
  text?: string;
  cls?: string;
  attr?: Record<string, string>;
}

export class TestElement {
  children: TestElement[] = [];
  text = '';
  cls = '';
  attr: Record<string, string> = {};
  readonly textHistory: string[] = [];
  private listeners = new Map<string, (() => void)[]>();

  constructor(readonly tag: string, private parent?: TestElement) {}

  createEl(tag: string, options: ElementOptions = {}): TestElement {
    const child = new TestElement(tag, this);
    child.cls = options.cls ?? '';
    child.attr = options.attr ?? {};
    child.setText(options.text ?? '');
    this.children.push(child);
    return child;
  }

  createDiv(options?: ElementOptions): TestElement { return this.createEl('div', options); }
  createSpan(options?: ElementOptions): TestElement { return this.createEl('span', options); }
  addClass(cls: string): void { this.cls = `${this.cls} ${cls}`.trim(); }
  setText(text: string): void { this.text = text; this.textHistory.push(text); }
  empty(): void { this.children = []; }
  remove(): void {
    if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
    this.parent = undefined;
  }
  addEventListener(event: string, listener: () => void): void {
    this.listeners.set(event, [...this.listeners.get(event) ?? [], listener]);
  }
  click(): void { for (const listener of this.listeners.get('click') ?? []) listener(); }
  all(): TestElement[] { return [this, ...this.children.flatMap(child => child.all())]; }
}

export class Modal {
  contentEl = new TestElement('div');
  titleEl = new TestElement('h1');
}

// Imported by main.ts, but outside report rendering and deliberately unavailable.
class UnusedAPI {
  constructor() { throw new Error('Unexpected API outside report rendering'); }
}
export class Notice extends UnusedAPI {}
export class Plugin extends UnusedAPI {}
export class PluginSettingTab extends UnusedAPI {}
export class Setting extends UnusedAPI {}
export class TFile extends UnusedAPI {}
export function normalizePath(): never { throw new Error('Unexpected settings access'); }
