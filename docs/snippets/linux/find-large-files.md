---
title: "Найти большие файлы"
description: "Поиск файлов больше заданного размера с сортировкой по объёму."
slug: "find-large-files"
locale: "ru"
language: "linux"
tags:
  - "linux"
  - "filesystem"
  - "cli"
updated: "2026-08-22"
---

# Найти большие файлы

Быстрый способ найти, что занимает место в каталоге, с сортировкой по размеру.

```bash
find . -type f -size +100M -exec du -h {} + | sort -rh | head -20
```

`-size +100M` — порог размера, `sort -rh` сортирует читаемые значения (К, М, Г) по убыванию.
