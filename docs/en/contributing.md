---
title: How to add a snippet
description: The Git and CLI workflow for adding, translating, and removing snippets.
---

# How to add a snippet

Content lives in Git as Markdown. Russian pages are stored in `docs/snippets`; English pages live in `docs/en/snippets`.

## Create

```bash
npm run snippet:new
```

The CLI prompts for the locale, slug, language, multiple tags, and code. Pass flags for automation:

```bash
npm run snippet:new -- \
  --locale en \
  --slug array-chunks \
  --language typescript \
  --tags "typescript,arrays" \
  --title "Split an array into chunks" \
  --description "Split an array into fixed-size chunks" \
  --code-file ./snippet.ts \
  --code-language ts
```

On creation, the CLI automatically records a `created` frontmatter field with the exact date, time, and timezone. The `updated` field stores only the last modification date and is maintained separately.

## Organization

The first catalog level is a language or technology. Independent dimensions use multiple tags, avoiding a deep category tree.

```text
docs/snippets/<language>/<slug>.md
docs/en/snippets/<language>/<slug>.md
```

Localized versions share the same `slug`, language, and technical tags.

## Validate and remove

```bash
npm run snippets:validate
npm run snippets:list
npm run snippet:remove -- --locale en --slug array-chunks
```

Run `npm test`, `npm run typecheck`, and `npm run build` before opening a pull request.
