---
title: "Настроить имя пользователя и email для репозитория Git"
description: "Локальная настройка автора коммитов только для текущего Git-репозитория."
slug: "git-config-local-user"
locale: "ru"
language: "git"
tags:
  - "git"
  - "config"
  - "identity"
  - "users"
  - "cli"
created: "2026-08-30T12:29:31+03:00"
updated: "2026-08-30"
---

# Настроить имя пользователя и email для репозитория Git

Укажите имя и email автора коммитов только для текущего репозитория. Локальные значения имеют приоритет над глобальной конфигурацией Git.

```bash
# Выполняйте команды из каталога нужного Git-репозитория.
git config --local user.name "Ваше Имя"
git config --local user.email "you@example.com"

# Проверить сохранённые локальные значения.
git config --local --get user.name
git config --local --get user.email
```

::: tip Где хранятся настройки
Команды записывают значения в файл `.git/config` текущего репозитория и не меняют настройки других проектов.
:::
