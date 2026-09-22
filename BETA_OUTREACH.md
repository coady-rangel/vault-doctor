# Beta outreach drafts

Ready-to-paste drafts for Coady to review and post personally. Nothing here has been posted. Start with one suitable community, then use another only if more volunteers are needed for the first five. Templates must reach the repository's default branch before the feedback links open the prepared templates.

## A. Official Obsidian forum

Suggested title: **Looking for 5 desktop testers: Vault Doctor, a local read-only vault check**

Hi, I'm building Vault Doctor and looking for five people to try the v0.1.0 desktop beta on their own vaults.

It checks four things: broken internal note links, missing attachments, orphan attachment candidates, and malformed frontmatter. The installed plugin runs locally with no telemetry or network calls. Scanning is read-only: it doesn't repair, delete, move, or rewrite notes or attachments. You can copy the report as Markdown and exclude folders; explicitly applying exclusions saves that plugin preference.

This is an early desktop beta for Obsidian 1.13.7+, installed manually, not an officially approved community-directory plugin. Orphans are candidates, not proof that files are unused: Canvas, HTML references, and plain property paths aren't inspected. It checks target files, not whether headings or block anchors exist. Large-vault responsiveness still needs real-world feedback.

If you'd try a scan, I'd like to hear about false positives, missed cases, performance issues, or confusing results—and whether the report was useful enough to keep installed. A scan with no problems is useful feedback too. Start with a copy of your vault.

[Repository and installation instructions](https://github.com/coady-rangel/vault-doctor) · [v0.1.0 release](https://github.com/coady-rangel/vault-doctor/releases/tag/v0.1.0) · [Beta feedback](https://github.com/coady-rangel/vault-doctor/issues/new?template=01-beta-feedback.md)

Please include OS, Obsidian version, approximate note/attachment counts, scan duration, and finding counts. Issues are public: never upload private notes or sensitive vault contents; redact screenshots and paths, and use made-up examples.

## B. r/ObsidianMD

Suggested title: **I made a read-only vault health checker—looking for 5 desktop beta testers**

I'm the developer of Vault Doctor, and I'd like to find five people willing to try its first desktop beta.

v0.1.0 checks broken internal links, missing attachments, orphan attachment candidates, and malformed frontmatter. The plugin runs locally, makes no network calls, and has no telemetry. Scans don't change your notes or attachments; there are no repair/delete features. Applying folder exclusions saves only the plugin preference.

It's a manual install for Obsidian 1.13.7+, not an officially approved directory plugin. Mobile is unverified. Orphan candidates can still be in use: Canvas, HTML references, and plain property paths aren't covered. Heading/block existence isn't checked, and synthetic benchmarks don't establish how your vault will perform.

I'd appreciate a scan on a copy of your vault and feedback on false positives, missed cases, performance issues, or results that don't make sense. Did it find anything useful? Would you keep it installed? “Nothing wrong, nothing useful” is also an answer I want to hear.

[GitHub / installation](https://github.com/coady-rangel/vault-doctor) · [Beta feedback](https://github.com/coady-rangel/vault-doctor/issues/new?template=01-beta-feedback.md)

Include your OS, Obsidian version, approximate vault size, duration, and counts. Never upload private notes or sensitive vault contents to public issues. Use invented examples and redact filenames, paths, and screenshots.

## C. Short Discord/community message

I'm looking for 5 testers for **Vault Doctor v0.1.0**, an early desktop beta for Obsidian 1.13.7+ (manual install). It checks broken internal links, missing attachments, orphan attachment candidates, and malformed frontmatter. Scans are local/read-only, with no telemetry or network calls; applying exclusions only saves plugin preferences.

Orphans aren't proof of unused files: Canvas/HTML/plain property paths aren't covered, and heading/block existence isn't checked. Mobile is unverified.

Try a scan on a vault copy? I'd love false positives, missed cases, performance issues, confusing results, and whether it was useful. Never upload private notes or sensitive vault contents; redact examples/screenshots.

Repo/install: https://github.com/coady-rangel/vault-doctor
Feedback (OS/version, approximate vault size, duration, counts): https://github.com/coady-rangel/vault-doctor/issues/new?template=01-beta-feedback.md
