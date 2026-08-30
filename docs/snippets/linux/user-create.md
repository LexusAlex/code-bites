---
title: "Создать пользователя в Linux"
description: "Создание пользователя Linux командой useradd с домашним каталогом и оболочкой bash."
slug: "user-create"
locale: "ru"
language: "linux"
tags:
  - "linux"
  - "users"
  - "cli"
  - "create"
  - "useradd"
  - "passwd"
requirements:
  - "sudo"
  - "linux"
created: "2026-08-22T16:28:05+03:00"
updated: "2026-08-22"
---

# Создать пользователя в Linux

Создаёт пользователя с домашним каталогом, оболочкой bash и комментарием, затем задаёт пароль.

```bash
# создать пользователя с /home/crm8, bash и GECOS-описанием
sudo useradd --create-home --shell /bin/bash --comment "crm8" crm8

# задать пароль
sudo passwd crm8
```

`--create-home` создаёт `/home/crm8`, `--shell` задаёт оболочку входа, `--comment` — произвольное описание.
