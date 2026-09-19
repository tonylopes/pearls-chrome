# Pearls

A Chrome extension that automatically highlights a saved set of keywords on the pages you
visit, so you don't have to re-run a find on every page load.

Keywords ("pearls") are stored in three scopes — **Global** (every page), **Domain** (one
site), and **Page** (one URL) — and all three are highlighted together, each keyword in its
own colour. The popup shows a live match count per keyword, and Next/Previous step through
every match in reading order.

Reload your open pages after installing.

## Development

```bash
npm install
npm test
```

To run locally: open `chrome://extensions`, enable **Developer Mode**, click **Load
unpacked**, and select the `pearls/` directory — not the repository root, as the manifest
lives one level down.

## Documentation

Design documents, plans, and the task backlog live in the
**[Pearls project in Notion](https://app.notion.com/p/3dfdc052afb181fba993e4faca331597)**.
This repository holds code only.

## Last update — 1.0.9.4

Migrated to Chrome Manifest V3.
