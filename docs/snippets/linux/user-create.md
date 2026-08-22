---
title: "Создать пользователя в linux"
description: "Создание пользователя Linux с домашним каталогом и оболочкой bash."
slug: "user-create"
locale: "ru"
language: "linux"
tags:
  - "linux"
  - "users"
  - "cli"
  - "create"
updated: "2026-08-22"
---

# Создать пользователя

Создаёт пользователя с домашним каталогом, оболочкой bash и комментарием (например, GECOS-описанием).

```bash
sudo useradd --create-home --shell /bin/bash --comment "crm8" crm8
```

`--create-home` создаёт `/home/crm8`, `--shell` задаёт оболочку входа, `--comment` — произвольное описание. Пароль задаётся отдельно: `sudo passwd crm8`.
