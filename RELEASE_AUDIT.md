# Vault Doctor release-readiness audit

Audit date: **2026-09-21 Pacific** (validation 2026-09-22 UTC). Refreshed for **v0.1.0 GitHub beta preparation**, including the report-UX cleanup. This is a local engineering audit, not Obsidian approval. No git commit, push, publication, submission, account creation, release, or external message was performed. Dependency advisory queries and the attempted dependency installation used npm's registry.

## Official sources checked

Official pages were retrieved during the earlier Day-2 audit; legacy `Plugins/Releasing/...` URLs returned Not Found, so the routes below were used. They were not re-audited as part of this packaging-only pass.

- [Manifest schema](https://docs.obsidian.md/Reference/Manifest)
- [Submission requirements for plugins](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)
- [Developer policies](https://docs.obsidian.md/community-directory/developer-policies)
- [Submit your plugin](https://docs.obsidian.md/plugins/releasing/submit-plugin)
- [Official plugin self-critique checklist](https://docs.obsidian.md/oo/plugin)
- [Community directory FAQ](https://docs.obsidian.md/community-directory/faq)

The current official submission guide uses the Community directory website. Do not assume the older community-plugins.json pull-request workflow is current. Recheck these sources before any future submission.

## PASS — inspected evidence

| Area | Evidence and conclusion |
| --- | --- |
| Manifest structure | `manifest.json` has all required fields. ID `vault-doctor` meets the documented character/naming rules; version `0.1.0` is x.y.z; description is below 250 characters and ends in a period. Name is Vault Doctor, with no approval claim. Uniqueness is still unverified. |
| Minimum app declaration | `minAppVersion` remains 1.13.7, the host version from the user's successful V0 test. A later real-app Day-2 smoke test prompted the report-UX cleanup. Final cleanup acceptance remains pending; no new compatibility claim is made. |
| Package/lock consistency | `package.json`, lockfile root, and manifest all use 0.1.0. Declared dependency and devDependency maps match the lockfile. `npm ls --depth=0` succeeds. `private: true` prevents accidental npm publication and does not prevent an eventual Obsidian distribution. |
| Dependency necessity | Two direct runtime dependencies: `markdown-it` for token-aware links/ignored code, `yaml` for YAML syntax/alias checks. Existing parsers retained; no new runtime dependency. Installed lock versions: markdown-it 14.3.2, yaml 2.9.1. Tooling/API packages remain devDependencies. |
| Bundle contents | esbuild metafile inspection lists markdown-it, yaml, entities, linkify-it, mdurl, punycode.js, uc.micro; only external import is `obsidian`. argparse is installed for dependency tooling but not bundled. Node-only scripts/tests are outside the runtime entry graph. |
| Project license and authorship | Root `LICENSE` is MIT, copyright (c) 2026 Coady Rangel, as explicitly selected by the owner. Package and lockfile root license metadata say MIT; package/manifest author is Coady Rangel. The build embeds the project license in `main.js`. |
| Third-party notices | Full license texts for all seven bundled packages match their installed license files and locked versions, and are embedded in `main.js`. Bundled license types: MIT, ISC, BSD-2-Clause. All locked dependencies declare licenses: 48 MIT entries (including platform-specific tooling), one each Python-2.0, BSD-2-Clause, Apache-2.0, ISC. argparse (Python-2.0) and TypeScript (Apache-2.0) are not in the runtime bundle. Original notices remain intact; no dependencies or dependency versions changed. |
| Dependency advisory check | `npm audit --json` completed against npm's registry with **0 reported vulnerabilities** across production/development dependencies. This is a point-in-time advisory result, not proof that dependencies have no defects. |
| Browser/Obsidian APIs | `Modal`, `Notice`, `Plugin`, `PluginSettingTab`, `Setting`, `normalizePath`, inventory/read/cache resolution, and guarded existing-file opening use the installed public declarations. Browser build succeeds. No runtime fs, path, crypto, Electron, adapter casting, or platform-specific module import found. |
| Read-only scan boundary | `VaultReader` exposes only list/read/resolve. Production adapter capability-guard test passes. Source-file path/byte/SHA-256/size/mode/mtime snapshots remain identical over repeated scans including exclusions. No source write/create/delete/move/repair APIs exist. |
| Explicit configuration write | The only settings save is `Plugin.saveData()` after **Apply exclusions**. Load/default/scan/export never save settings. Save errors are shown. Invalid saved settings block scans until explicitly corrected. Preferences are not claimed to be zero-write. |
| Paths and exclusions | No hardcoded configuration or absolute vault path in runtime. Uses host inventory and plugin settings APIs. Exclusions are normalized/validated, case-sensitive descendant matches; notes and assets obey the same boundary. Full inventory remains available for destination resolution. Nested/similar-name tests pass. |
| Network, telemetry, privacy | No runtime networking/telemetry/analytics calls, accounts, payments, remote assets, or self-updates found in source/bundle review. Parser URL strings are parsing logic/comments, not requests. Export only writes the system clipboard on request. README discloses local behavior, configuration saves, and clipboard contents. |
| Safe rendering/export | Vault-controlled strings use native text setters/constructors, not HTML insertion. Markdown export escapes HTML/Markdown syntax; a rendered-export injection test verifies no injected image/link elements. No export creates a file. |
| Commands and lifecycle | Command ID `scan-vault`, name `Scan vault`, no duplicate plugin prefix or default hotkey. Plugin API owns command/settings registration. Modal close and `onunload` cancel the active scan; closed modals ignore late results. UI listeners belong to removed modal elements; no global listener or recurring timer. |
| CSS/theme scope | All CSS is scoped under `.vault-doctor-report`; colors, spacing, typography, radii use Obsidian variables. No theme override, external font/image, hardcoded color scheme, or JavaScript inline styling. Native buttons/settings retain host interaction styling. |
| Documentation | README describes actual checks, unsupported syntax, candidate semantics, exclusions, explicit settings writes, copy behavior, development commands, and specific manual smoke steps. No official approval claim. |
| Automated validation | **34 tests passed, 0 failed/skipped**, including report rendering and repeated scans of three synthetic sizes. TypeScript check/build passed. Historical benchmark measurements remain in `BENCHMARKS.md`; no new performance claim is made. |
| Artifact handling | `.gitignore` excludes generated bundles/test output, dependencies, release archives, caches, environment/credential files, disposable vaults, editor files, and local agent tooling. Required source, docs, LICENSE, notices, manifest, stylesheet, lockfile, scripts, and fixtures remain includable. `git ls-files` is empty; the initial commit is deliberately deferred. |
| Credential/diff checks | Common private-key/token/password patterns found no matches in non-ignored project files. This is a scoped pattern check, not a forensic guarantee. Final changes reviewed against a pre-edit snapshot with `git diff --no-index`, since ordinary `git diff` cannot show this all-untracked prototype. Whitespace checks pass. |

## BLOCKERS

1. **Final report-UX acceptance is pending.** The user performed a real Day-2 smoke test and reported UI issues; those issues were fixed with automated coverage. Confirm the resulting cleanup in real Obsidian and record any still-unverified README checklist items (including clipboard fallback/pop-outs and source-byte preservation for the final build) before distributing beta binaries.
2. **Mobile declaration needs evidence or narrowing.** `isDesktopOnly: false` remains unchanged. No Android/iOS smoke result has been supplied. Validate mobile before offering supported mobile use, or deliberately narrow a desktop beta's manifest/documentation. README prominently discloses the current unverified status.
3. **Clean-install validation remains incomplete.** A fresh temporary source copy was prepared. The initial `npm ci` was blocked by sandbox DNS; the approved retry reached the registry but failed with disk quota error 122. Only that temporary install/cache was removed. Existing-install tests/build pass; repeat `npm ci` and validation on an environment with sufficient disk quota before binary distribution.
4. **Initial commit and distribution are intentionally deferred.** The complete intended source set is reviewed but remains untracked and unstaged, as requested. Under a later instruction, create the reviewed initial revision and prepare/test its matching artifacts before publishing. No technical failure is implied by the absence of a commit in this preparation task.

## WARNINGS

- **No full Obsidian automated review/official ESLint run.** Public API declarations and source checks are useful evidence, not a compliance verdict. Installed Obsidian typings are 1.13.1; testing the declared 1.13.7 host still matters. The official FAQ recommends the official [ESLint plugin](https://github.com/obsidianmd/eslint-plugin) for local review checks.
- **Readable, unminified bundle.** The beta-preparation build is about 465 KiB including the project license and dependency notices. Minification is recommended by the earlier official checklist review, not asserted here as a submission blocker. Keep license notices if changing the build.
- **Repository metadata awaits its real URL.** Author and license are resolved. No repository, bugs, homepage, or contact URL was invented. Add the actual project/support URLs once chosen; directory name/ID uniqueness matters before an official submission, not this local preparation.
- **Benchmarks are synthetic scanner-only measurements.** They exclude real storage, Obsidian metadata/cache behavior, modal rendering, and clipboard costs. One run per size is not a performance guarantee. A single huge note cannot be interrupted during synchronous parsing; large error lists are not paginated.
- **Orphans cannot be confirmed as unused.** Unsupported reference forms and excluded/unreadable/malformed notes may hide uses. Candidate/provisional labels and scope warnings are retained in both UI and export.
- **Settings and clipboard have disclosed effects.** Apply writes plugin preferences; OS clipboard services may retain/sync the user's explicitly copied report. Neither behavior modifies source note/attachment bytes.
- **Secrets check is scoped.** No obvious credentials were found in project files; ignored/private files and historical objects were not audited for distribution. Only include the reviewed source and release artifacts.

## Manual checks still required

Use README's **Manual smoke tests for this build** to record the final build's acceptance, carrying forward previously completed checks where applicable. Record app/OS versions for desktop 1.13.7+, Android/iOS if supporting mobile, light/dark/narrow layouts, keyboard use, pop-out clipboard, unavailable-clipboard fallback, folder-boundary/persistence behavior, duplicate basenames, cancellation/unload, pagination, and before/after source SHA-256 inventories. Specifically verify that small reports show no pagination, the final page removes its button, repeated issue labels are absent, and the full caveat is readable without dominating the result.

## Exact steps before public beta

1. License/metadata/notices preparation is complete for 0.1.0. Preserve the root MIT LICENSE and bundled third-party notices in the eventual distribution.
2. Complete final report-UX acceptance and record outstanding smoke checks. Resolve failures and settle the supported platform scope.
3. On a machine with sufficient disk quota, run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `npm audit` from a clean source copy. Record results. The documented benchmark can be rerun if new performance measurements are needed.
4. Under a later explicit instruction, stage and commit the reviewed source/lockfile, then prepare the artifacts from that revision. Recheck credential patterns, diff, and exclusions. Do not track `main.js`. Official review lint remains recommended before directory submission, not a completed beta check.
5. Prepare only the tested `main.js`, matching `manifest.json`, and `styles.css` as installable plugin assets; retain included dependency notices and accompany distribution with the project's license. Verify these assets in a fresh disposable vault. Ensure version values agree; increment together if choosing a new beta version (manifest versions use x.y.z).
6. Have the owner separately authorize any public distribution. No release or upload is part of this task.

## Exact steps before official directory submission

After all beta blockers/checks above are resolved, and only under new authorization:

1. Recheck the official sources above and uniqueness of `vault-doctor` / Vault Doctor. Ensure README, LICENSE, and the accurate manifest are at the repository root.
2. Make the reviewed source available in its intended GitHub repository. Publish a release whose tag exactly matches manifest `version`, attaching `main.js`, `manifest.json`, and this plugin's `styles.css`.
3. Follow the current official Community directory guide: the owner signs in with an Obsidian account, connects their GitHub identity, adds the repository, and reviews the applicable policies. The default-branch manifest must match the intended release.
4. Examine automated manifest/release/source/build review results and resolve blocking feedback with corrected, incremented releases. Complete the directory's publication flow only after review is clear. Do not claim approval before that happens.

These are future instructions only. No external account, repository publication, release, submission, or announcement was created during this pass.
