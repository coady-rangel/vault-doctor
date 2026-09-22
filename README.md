# Vault Doctor

**Vault Doctor — a local, read-only health check for your Obsidian vault.**

Run **Vault Doctor: Scan vault** from the command palette. Review broken internal links, missing attachments, orphan attachment candidates, and malformed frontmatter. Source-path buttons open existing files. Missing targets are never opened or created.

**v0.1.0 is an early desktop beta for manual installation.** It is not listed in the Obsidian community directory and does not claim official Obsidian approval. Review findings before acting on them, especially orphan candidates. [RELEASE_AUDIT.md](RELEASE_AUDIT.md) records the pre-release engineering review; the published release assets have since been independently smoke-tested.

## Beta testing

I'm looking for the first five desktop testers. Try a scan and share false positives, suspected missed problems, confusing results, or performance issues—even a useful scan with no problems is worth reporting. Include your Obsidian version, OS, approximate vault size, scan duration, and finding counts in [beta feedback](https://github.com/coady-rangel/vault-doctor/issues/new?template=01-beta-feedback.md); use the separate [bug report](https://github.com/coady-rangel/vault-doctor/issues/new?template=02-bug-report.md) for a specific failure.

Issues are public: **never upload private notes or sensitive vault contents**. Redact paths and screenshots, and use invented examples. Orphan findings are candidates, not proof that files are unused. This beta focuses on desktop; mobile remains unverified.

## Manual beta installation

Requires **Obsidian 1.13.7 or later**. Start with a disposable vault or a copy of your vault. Mobile behavior has not been verified.

1. Download `main.js`, `manifest.json`, and `styles.css` from the [v0.1.0 release assets](https://github.com/coady-rangel/vault-doctor/releases/tag/v0.1.0). GitHub's automatic source ZIP does not contain `main.js`. You can also build from source using the development instructions below.
2. Close Obsidian, then create `<vault>/<configuration-directory>/plugins/vault-doctor/`. Use your vault's actual configuration directory (normally `.obsidian`, but it can be customized).
3. Copy the three plugin files into that folder. Do not copy `node_modules`, tests, or the source repository into your vault. Retain the supplied license notices when redistributing the files.
4. Reopen Obsidian. In **Settings → Community plugins**, enable community plugins if needed, then enable **Vault Doctor**.
5. Wait for vault indexing to finish. Open the command palette and run **Vault Doctor: Scan vault**.

Read the category summaries and detailed findings. Click a source path to open the existing file, or click **Copy report as Markdown** to copy the report. Configure exclusions in **Settings → Vault Doctor** if needed, then run a new scan. Updating a manual installation uses the same three-file replacement with Obsidian closed; the plugin does not update itself.

## Local and read-only

- Entirely local operation: no network calls, telemetry, accounts, backend, AI calls, payments, advertising, or self-updates.
- Scans inventory files, read saved Markdown notes, and consult Obsidian's link resolver. Attachment bytes are not read; attachments are checked against references and inventory.
- No repair, delete, rename, move, or automatic source-file modifications. No report files are created. Reports exist in memory; copying Markdown is explicitly user-triggered.
- **Apply exclusions** saves only this plugin's preference via Obsidian's `saveData()`. This is an explicit configuration write, separate from the read-only scan. Scanning, loading defaults, and copying reports do not save settings. Obsidian itself can persist workspace state when navigating.
- Export includes vault-relative paths, link targets, and diagnostic messages, which may contain private information. Copy only when you intend to place this information on the system clipboard; OS clipboard history/sync remains outside the plugin's control.

Development dependency installation and `npm audit` use npm's network services; the installed plugin does not.

## Report and Markdown copy

The report shows the scan start time, elapsed scan duration (excluding rendering), note/attachment totals, exclusions, skipped unsupported files, category counts, and concise findings.

- **Healthy**: at least one supported file inspected, no findings or scan errors, and no detected incomplete reference coverage. Always limited to supported checks.
- **Needs attention**: orphan candidates, incomplete coverage, read errors, or no supported files inspected.
- **Issues found**: broken internal links, missing attachments, or invalid frontmatter detected.

The overall status and category headings identify detected issues without repeating status labels in each section. Orphan summary cards retain **Review · candidate**, or **Review · provisional candidate** when reference coverage is incomplete. The full coverage caveat appears below the summary and copy action. These are qualitative indicators, not probability scores. Categories with zero findings say so explicitly. An empty or fully excluded vault is not labeled healthy. The Markdown export also includes category indicators.

Click **Copy report as Markdown** to copy the current snapshot, including version, ISO timestamp, duration, inspected totals, exclusions, all counts/findings, and coverage warnings. If clipboard access fails, a read-only text area allows manual selection/copy. No vault file is created. Paths are plain escaped text in export; source paths in the report UI remain clickable. Each category initially renders up to 100 findings. A **Show next** button appears only while additional findings remain; export always includes every finding.

Closing the report cancels an active scan at the next note boundary. Disabling the plugin cancels scanning and closes its report. Cancellation cannot interrupt parsing of a single large note. Repeated scans produce the same findings for unchanged files/resolution; timestamps and durations naturally differ.

## Supported checks

| Category | Rule |
| --- | --- |
| Broken internal note links | Supported links unresolved by Obsidian's `metadataCache.getFirstLinkpathDest(target, sourcePath)`, or absent from the initial full-vault inventory. Extensionless and `.md` targets are checked. Unknown-suffix wikilinks are treated as note names because note names may contain dots. |
| Missing attachments | An unresolved link/embed with a supported attachment suffix, including ordinary links to assets. Extensionless embeds are treated as note transclusions. |
| Orphan attachment candidates | Supported attachments with no resolved reference in included Markdown notes. **Not proof of non-use, and never a deletion recommendation.** |
| Invalid frontmatter | First-line `---` frontmatter with missing closing delimiter, YAML syntax errors (including duplicate keys), or unresolved YAML aliases. BOM/CRLF work. No property schema/style validation. |

Supported syntax includes `[[Note|display alias]]`, `![[Note#Heading]]`, `[[Note#^block]]`, embeds with size/display suffixes, relative Markdown links/images, and reference-style Markdown links. Encoded paths, nested folders, spaces, and Unicode filenames are supported. Duplicate basenames are resolved by Obsidian using source context; Vault Doctor does not invent a tie-breaker. Bare YAML alias names receive no additional lookup; use the actual target with a display alias.

Fragments are removed before file resolution: heading/block existence is **not** checked. Same-note fragments are ignored. External URI schemes (`https:`, `mailto:`, `obsidian:`, `file:`, `data:`, etc.) and protocol-relative URLs are ignored without contacting them. Code fences, indented/inline code, escaped wikilinks, HTML comments, and `%%` comments within one Markdown paragraph are ignored.

Valid YAML string values containing supported link syntax count as references, including nested lists/maps. Plain paths such as `cover: assets/photo.png` do not. YAML aliases are checked without recursive expansion; parser warnings/custom tags are not treated as syntax errors. Malformed frontmatter with a closing delimiter still permits body scanning. Read/parse errors are reported separately and scanning continues.

Repeated unresolved references to the same target in one note produce one finding per category; different source notes produce separate findings. Frontmatter errors produce one finding per note.

Supported attachment suffixes (case-insensitive):

```text
avif bmp gif jpeg jpg png svg webp
flac m4a mp3 ogg wav webm
3gp mkv mov mp4 ogv
pdf
```

Other files, including `.canvas`, `.zip`, `.docx`, `.heic`, and `.txt`, are skipped and counted. Unknown-suffix unresolved Markdown destinations are skipped. Notes use `.md`, case-insensitively. Inventory comes from `vault.getFiles()`, not a filesystem crawl; only files Obsidian exposes are available. The plugin makes no assumptions about configuration-directory names.

## Excluded folders

Open **Settings → Vault Doctor**. Enter one vault-relative folder per line and click **Apply exclusions**, then scan again. Default is empty: all supported files in Obsidian's inventory are included.

For example, `Archive/Old` excludes notes and attachments anywhere under that folder, including nested folders. It does not exclude `Archive/Older`, `Archive/Old.md`, or `archive/Old`. Matching is case-sensitive. Wildcards have no special meaning. Nonexistent folders match nothing; exclusions are not a general rules engine.

Whitespace around each line, duplicate separators, trailing separators, backslashes, and `./` segments are normalized. Duplicate/redundant nested exclusions collapse. Absolute paths, drive/URI paths, `..`, root-only entries, and control characters are rejected. Clear the input and Apply to restore the default. Corrupt/unreadable saved exclusions block scanning until settings are explicitly reapplied; they never silently broaden a scan.

Excluded notes are not read; excluded attachments are not checked or reported. Existing excluded destinations remain available to link resolution, so links from included notes into excluded folders are not falsely marked broken. Excluded notes can hide references to included attachments: when any notes are excluded, orphan candidates are **provisional**. Reports capture the exclusion configuration used for that scan.

## Known limitations

- Canvas, HTML asset references, CSS, plugin-generated links, plain property paths, and references inside non-Markdown assets are not inspected. All orphan findings remain candidates even without the extra incomplete-coverage warning.
- This is not the entire Obsidian Markdown dialect: math blocks, multi-paragraph `%%` comments, and plugin-specific syntax are not specially parsed. YAML syntax follows the bundled parser, not the property editor's schema.
- No ambiguity diagnosis, anchor validation, case-portability checks, or custom YAML-alias destination resolution.
- The scan is not atomic. Concurrent file edits/moves or an unsettled metadata cache can affect results; wait and rerun. Unsaved editor buffers are not scanned.
- Reads are sequential and parsing runs on the UI thread, yielding every 100 notes. Very large individual notes, huge numbers of scan errors, or pathological inputs may still stall the UI. No worker or background scanning.
- File buttons navigate to existing files, not an exact line. Preview support varies by file type/platform.
- Desktop smoke tests have been performed in Obsidian 1.13.7, and the published v0.1.0 package has been independently smoke-tested from downloaded release assets. This does not establish coverage for every vault or platform. Mobile, pop-out-window, and clipboard fallback coverage is not yet confirmed. The manifest allows mobile loading, but mobile behavior remains unverified.

## Development and validation

Use Node.js 22+ and npm (recorded benchmarks used Node 26.8.1). Runtime dependencies are `markdown-it` and `yaml`, bundled with required transitives; `obsidian` is host-provided. The npm lockfile pins exact versions. [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) records licenses for bundled dependencies. The build embeds both these notices and Vault Doctor's MIT license in `main.js`.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run benchmark
npm audit
```

Build includes TypeScript validation and produces `main.js`; `npm run dev` watches source changes. Reload the plugin after rebuilding. Generated bundles, test output, and dependencies are gitignored. Tests cover parsing, resolution delegation, exclusions, Markdown escaping, status semantics, cancellation, deterministic stress scans, and source-file safety. The filesystem test compares paths, SHA-256 hashes, sizes, modes, and modification times over repeated scans, including exclusions. A capability-guard test restricts the production adapter to inventory/read/resolve operations. Tests do not launch Obsidian or prove its UI behavior.

Report rendering tests exercise zero-pagination and page-boundary cases using a small Obsidian UI stub, without adding runtime dependencies. Development requires the full dependency set; `npm ci --omit=dev` cannot build the plugin.

`npm run benchmark` creates deterministic **in-memory** fixtures at 100, 1,000, and 10,000 notes, with approximately one attachment per ten notes, nested/Unicode names, valid wiki/relative links, fragments, and ignored external URLs. Each size has exactly three broken links, two missing attachments, two orphan candidates, and two malformed-frontmatter findings. It asserts these counts and prints JSON with elapsed scan time and approximate heap/RSS metrics. It runs each size in a fresh Node process, with fixture construction and pre-scan GC outside timing. It uses an indexed fixture resolver, not Obsidian's metadata cache. No vault is created. See [BENCHMARKS.md](BENCHMARKS.md) for measured results and limits.

## Manual smoke tests for this build

1. Build, then copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/<configuration-directory>/plugins/vault-doctor/` in a **temporary copy** of `tests/fixtures/vault`. Use the vault's actual configured directory. Enable Vault Doctor in Obsidian 1.13.7 or later and wait for indexing.
2. With exclusions empty, run **Vault Doctor: Scan vault**. Expect **Issues found**, **3 notes**, **2 attachments**, **4 findings**: one broken `Does Not Exist` link and one missing `assets/missing.png` in `Welcome.md`, orphan `assets/orphan.svg`, and invalid `Malformed.md`. Confirm provisional warning, four category counts, timestamp/duration, and version 0.1.0.
3. Click source paths: open the existing note/attachment. Confirm clicking never creates the missing target. Scan again; findings should be identical.
4. Copy Markdown and paste into an external text editor. Verify timestamp, duration, inspected totals, counts, all four findings, provisional warning, and version; no vault report file should appear. If clipboard access is unavailable, verify the selectable fallback. Exercise copying from a pop-out window as well.
5. In a second temporary vault with one valid note and no links, expect **Healthy**, zero counts and a scope-qualified success message. Add an unreferenced SVG: expect **Needs attention** and a candidate. An empty or fully excluded vault should say **Needs attention** and no supported files inspected.
6. In that second vault create `Archive/Old/Deep/Hidden.md` containing `[[Missing]]`, an SVG alongside it, and `Archive/Older/Keep.md` containing `[[Missing]]`. Apply `Archive\\Old/` as an exclusion. Verify it displays as `Archive/Old` on reopening settings, skips the nested note/SVG, retains the finding in `Archive/Older`, and marks orphan candidates provisional. Link from an included note to the excluded note/SVG and confirm neither existing target is reported missing.
7. Restart Obsidian: exclusions should persist. Clear and Apply: the hidden finding should return on the next scan. Try `/Archive`, `../Archive`, and `.`; expect validation messages without replacing the saved configuration.
8. Create `One/Same.md`, `Two/Same.md`, source notes in both folders linking to `[[Same|display]]`, and a nested note linking relatively to `雪 note.md` using `%20`. Compare resolution with Obsidian's own links. Test heading/block fragments and external URLs; only target-file existence is checked.
9. On a larger disposable vault, invoke Scan twice while running (one scan only), close mid-scan, then rerun. Disable/re-enable during scanning: no stale report or duplicate command should remain. With over 100 findings in a category, check Show next and confirm the copy contains all findings.
10. Check keyboard navigation, light/dark themes, narrow/mobile screens, Android/iOS clipboard and fallback, and pop-out windows. Record platform/app versions and any console errors; mobile remains unverified until this is done.
11. Record a source-file inventory and SHA-256 hashes before and after repeated scanning/copying/navigation. Verify identical note/attachment paths and bytes. Separately expect only explicit Apply to change the plugin's settings data; Obsidian's normal workspace/config writes are not source-file mutations.

## License

MIT License. Copyright (c) 2026 Coady Rangel. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
