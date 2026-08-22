---
title: "Find large files"
description: "Locate files above a size threshold, sorted by disk usage."
slug: "find-large-files"
locale: "en"
language: "linux"
tags:
  - "linux"
  - "filesystem"
  - "cli"
updated: "2026-08-22"
---

# Find large files

A quick way to see what is eating space in a directory, sorted by size.

```bash
find . -type f -size +100M -exec du -h {} + | sort -rh | head -20
```

`-size +100M` sets the size threshold; `sort -rh` orders human-readable values (K, M, G) descending.
