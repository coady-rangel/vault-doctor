# First five beta testers

Question: does a local, read-only report help people understand real vault problems well enough to use it again? This is a small qualitative check, not a representative survey or a growth campaign.

## Minimal setup and recruitment

1. Review and, when ready, commit/push the six prepared documentation/template files to `main`. No product rebuild or new release is needed. Open [New issue](https://github.com/coady-rangel/vault-doctor/issues/new/choose) to preview both templates without submitting anything.
2. Personally post one draft from [BETA_OUTREACH.md](BETA_OUTREACH.md) in a suitable community that permits it. Use a second venue only if needed. Invite up to five volunteers who actually use Obsidian on desktop; seek different platforms/vault sizes when available without requiring quotas.
3. Give volunteers the [released assets](https://github.com/coady-rangel/vault-doctor/releases/tag/v0.1.0) and [README installation steps](https://github.com/coady-rangel/vault-doctor#manual-beta-installation). Ask for one scan on a copy of their vault, a spot-check of findings against Obsidian, and one [beta feedback issue](https://github.com/coady-rangel/vault-doctor/issues/new?template=01-beta-feedback.md), including zero-finding or unhelpful runs. A second scan is useful if something looks inconsistent. Don't ask them to manufacture problems in their real vault.
4. Ask for OS/versions, approximate note/attachment counts, duration, counts by category, false positives/missed cases, confusing results, performance trouble, usefulness, and whether they'd keep it installed. One scan is enough to start; don't request a full report or vault upload. Installation failures count as feedback rather than silently dropping that tester.
5. Log each response below. For a reproducible defect, link a [bug report](https://github.com/coady-rangel/vault-doctor/issues/new?template=02-bug-report.md); don't require duplicate reports when the feedback already explains it. Reply in the same thread only as needed. When there is enough evidence to decide, write the decision below and stop broadening recruitment for this round.

## Tracking (five slots only)

These are empty slots, not recruited people. Use T1–T5 or an already-public handle with permission, plus public issue links. This file may be public: never enter emails, private messages, vault names, private paths, or sensitive contents. Prefer maintaining the filled copy locally; use `git diff` before publishing any updates.

| tester | platform | vault size | scan result | useful? | issue found | feedback | keep installed? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T1 (unfilled) | — | — | — | — | — | — | — |
| T2 (unfilled) | — | — | — | — | — | — | — |
| T3 (unfilled) | — | — | — | — | — | — | — |
| T4 (unfilled) | — | — | — | — | — | — | — |
| T5 (unfilled) | — | — | — | — | — | — | — |

Record approximate notes/attachments for vault size. For scan result, record completed/failed, duration, and counts in broken/missing/orphan/frontmatter order, with any coverage caveat. Use yes/no/unsure plus a short reason for “useful?” and “keep installed?”; an intention is not evidence of later use. “Issue found” links a defect or says none noticed/unknown. “Feedback” links the scan report issue and its main takeaway. No response stays unknown, not a negative result.

## What would justify the next decision?

- **Continue:** independent testers can point to real, verified problems or saved investigation time, understand the caveats, and say they'd use the check again for a concrete reason. Reported defects look bounded and fixable. If someone later volunteers that they rescanned, record that separately from stated intent. Prioritize demonstrated correctness/clarity problems before new checks.
- **Change direction:** recurring confusion or false positives undermine an otherwise useful check, people value only a subset of results, or installation/performance prevents an honest trial. Describe the repeated problem and test a smaller scope, different wording, or lower-friction onboarding in a later authorized iteration. A request alone doesn't justify adding a feature.
- **Stop or pause:** after a fair trial, people can explain why the report adds no useful information over their current workflow and they don't want to use it again; or correctness/performance problems cannot be resolved within this small read-only product's scope. Any credible source-file modification report warrants pausing recruitment and investigating immediately. Slow recruitment or silence alone is inconclusive, not proof of product failure.

Use concrete examples and reasons, including contradictory evidence. Stars, downloads, raw finding totals, and praise aren't success criteria. Five responses cannot establish broad demand, safety, or accuracy, and no percentage threshold is being claimed.

Decision: **Pending real feedback.** Evidence/issue links: —. Next action: —.

## GitHub hygiene

Read-only repository check during preparation: public repository, default branch `main`, Issues enabled, Discussions disabled, zero open issues at the time checked. The published v0.1.0 release has `main.js`, `manifest.json`, and `styles.css`. The owner reports an independent smoke test of downloaded assets; this plan does not infer broader platform coverage from it.

GitHub Issues is sufficient for this round: one beta-feedback template for each scan experience, one bug template for a specific defect, and existing issue comments for follow-up. Title prefixes `[Beta]` and `[Bug]` work without provisioning labels or assignees. The local chooser config guides new reporters to those two paths. No Discussions, project board, automation, account collection, or additional service is needed. GitHub sign-in is needed to file an issue; the plugin itself requires no account. If a willing tester can't use Issues, they may reply in the recruitment thread with the same non-sensitive details, and the owner can summarize their feedback locally.

GitHub activates templates/config from the default branch; see [GitHub's template documentation](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository). Previewing the chooser after a later push is still required; local YAML checks cannot prove GitHub's rendered UI. No GitHub settings, issues, or discussions were changed during preparation.
