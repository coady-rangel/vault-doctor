# Synthetic scanner benchmark

Run `npm run benchmark` from the repository root after `npm ci`. The command compiles the test-only runner into ignored `.test-build/` and executes each size in a fresh Node process. It asserts the expected finding counts; no vault files are generated or modified.

Measured **2026-09-22 04:01 UTC** (2026-09-21 Pacific), Linux x64, Node **26.8.1**, Intel Core **i9-14900K**. One measured run per size, with no warmup, after the Day-2 scanner changes. These are observations, not guarantees or statistical percentiles.

| Notes | Attachments | Scan duration | Heap before | Heap after | Heap delta | RSS after / process peak | Findings |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 12 | 18.69 ms | 6.70 MiB | 9.03 MiB | +2.33 MiB | 68.41 / 68.41 MiB | 9 |
| 1,000 | 102 | 77.12 ms | 7.40 MiB | 13.14 MiB | +5.74 MiB | 78.70 / 78.70 MiB | 9 |
| 10,000 | 1,002 | 531.43 ms | 14.13 MiB | 40.32 MiB | +26.19 MiB | 127.24 / 127.24 MiB | 9 |

Every size produced **3 broken internal links, 2 missing attachments, 2 orphan candidates, 2 invalid frontmatter findings, and 0 scan errors**. Orphans were provisional because two notes had malformed YAML. Separate automated tests scan each size twice and compare findings and all fixture contents.

## Method and limits

- `tests/synthetic.ts` deterministically constructs N short Markdown notes in ten nested folders, with spaces/Unicode names, wiki/display-alias links, relative Markdown links, heading/block suffixes, valid SVG references, external URLs, and bounded deliberate faults. There are `ceil(N / 10)` referenced SVGs plus two orphan SVGs.
- The fixture and its indexed resolver are created before timing. `global.gc()` runs before the baseline heap sample. The scan duration is measured inside `scanVault()` with `performance.now()`, including inventory filtering, parsing, resolution, findings, and periodic yields.
- Notes are in memory. This excludes filesystem/storage reads, Obsidian adapter construction/indexing, its actual link resolver, mobile device behavior, DOM rendering, and clipboard export. These are **not Obsidian end-to-end measurements**.
- Heap measurements use `process.memoryUsage().heapUsed` immediately before/after; post-scan GC is not forced. Delta includes temporary garbage and is neither retained memory nor peak scanner memory. RSS is for the entire process. `process.resourceUsage().maxRSS` includes startup, imports, and fixture construction; it is not a scan-only peak.
- Results vary with JIT, GC, hardware, note length, link density, and background load. This fixture does not measure giant individual notes or a large number of findings/errors. No upper bound on supported real-vault size is claimed.
