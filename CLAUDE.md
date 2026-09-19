# Pearls Extension

A Chrome extension (Manifest V3) that automatically highlights a user-defined set of
keywords on web pages. Roughly 14k users on the Chrome Web Store.

## Where things live

This project is split across two systems. Check the right one before starting work.

| What | Where |
|---|---|
| **Code** | `https://github.com/tonylopes/pearls-chrome.git` (this repository) |
| **Documentation** | Notion — [Pearls](https://app.notion.com/p/3dfdc052afb181fba993e4faca331597) project |
| **Tasks / backlog** | Notion — [Tasks](https://app.notion.com/p/0ed57bf1aafe42078f1ea53e303a7af7) database in that project |

**Notion is the system of record for documentation and tasks.** The repository holds code
only. Do not create design documents, plans, or status notes as files in this repo — write
them to the Notion project instead. The `doc/` folder that once held local copies of these
documents has been deleted — do not recreate it.

Likewise, task state lives in the Notion Tasks database, not in TODO files or code comments.

## Documentation index

| Document | Purpose |
|---|---|
| [System Design](https://app.notion.com/p/3e0dc052afb181d094a4f10028ec71db) | The architecture as built: components, message API, storage schema |
| [Bug Fixing Plan](https://app.notion.com/p/3e0dc052afb1817e8c81f4dc72583cea) | Known defects (BUG-01 … BUG-16), root causes, proposed fixes |
| [UI & UX Upgrade Plan](https://app.notion.com/p/3e0dc052afb18117a18bcc8ca5cf0ae4) | Popup redesign, with per-feature implementation status |
| [Word Finding & Highlighting Engine Upgrade](https://app.notion.com/p/3e0dc052afb18194b59fcce95cd67092) | Planned rewrite onto the CSS Custom Highlight API |
| [Testing Guide](https://app.notion.com/p/3e0dc052afb18197b19bcfd945a8e86e) | Suite inventory, how to run it, known coverage gaps |
| [Deployment Guide](https://app.notion.com/p/3e0dc052afb1817f8e81cb210540634f) | Packaging and publishing to the Chrome Web Store |
| [Plan V2](https://app.notion.com/p/3dfdc052afb1815bbe02dd0673cf51df) | Product plan: naming, telemetry, donations, rollout |

Defects are referred to by their `BUG-nn` identifier throughout the code discussions; those
identifiers are defined in the Bug Fixing Plan, not in this repository.

## Repository layout

```
pearls/          the extension itself — everything that ships
__tests__/       Jest suites (9 jsdom + 1 Puppeteer E2E)
```

`pearls/manifest.json` is one level down from the repository root. Anything that needs the
extension directory — loading unpacked, `--load-extension`, packaging — must point at
`pearls/`, not at the root.

## Commands

```bash
npm install
npm test                                    # everything, including Puppeteer
npx jest --testPathIgnorePatterns e2e       # fast inner loop
npx jest __tests__/pearlscript.test.js      # one suite
```

## Committing

**Commit straight to `master`. Do not open pull requests and do not create feature
branches** — this is a single-maintainer repository and the review round trip buys nothing.
Commit directly onto the checked-out default branch.

Run `npx jest --testPathIgnorePatterns e2e` before committing; it is fast and catches the
regressions jsdom is able to see.

## Working notes

- **The Jest suite cannot see layout.** jsdom returns `0` for all geometry, so match
  ordering, `findPosXY`, and every scroll path are untested. Anything touching layout,
  scrolling, badges, or real message passing needs manual verification in Chrome.
- **`pearlsstyle.css` is injected into every page the user visits.** It must stay scoped to
  the `.pearl-hilighted-word` classes — no `html`/`body` selectors, no universal selectors,
  no fixed widths. Popup styling belongs in `popup.css`. A test guards this
  (`__tests__/css_isolation_and_formatting.test.js`); treat a failure there as a real leak.
- **Version numbers are duplicated** between `pearls/manifest.json` and `package.json` and
  are currently out of sync. Check both when releasing.
- When a change contradicts what the System Design document describes, update that Notion
  page as part of the same piece of work.
