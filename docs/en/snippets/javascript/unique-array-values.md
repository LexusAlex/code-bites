---
title: "Unique array values"
description: "Remove duplicate array items while preserving their original order."
slug: "unique-array-values"
locale: "en"
language: "javascript"
tags:
  - "javascript"
  - "arrays"
  - "collections"
updated: "2026-08-20"
---

# Unique array values

`Set` keeps the first occurrence of each value, and the spread operator converts the collection back to an array.

```js
const uniqueValues = (values) => [...new Set(values)]
```

## Example

```js
uniqueValues(['draft', 'ready', 'draft'])
// ['draft', 'ready']
```

Objects are compared by reference rather than by their contents.
