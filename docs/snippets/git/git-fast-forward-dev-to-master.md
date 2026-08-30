---
title: "Безопасно перемотать ветку dev вперёд до master"
description: "Обновление dev до состояния origin/master только через fast-forward, без merge-коммита и переписывания истории."
slug: "git-fast-forward-dev-to-master"
locale: "ru"
language: "git"
tags:
  - "git"
  - "branches"
  - "merge"
  - "fast-forward"
  - "cli"
risk: "caution"
created: "2026-08-25T09:40:42+03:00"
updated: "2026-08-25"
---

# Безопасно перемотать ветку dev вперёд до master

Обновление ветки `dev` до состояния удалённой ветки `master` только через fast-forward. Git передвинет указатель `dev`, не создавая merge-коммит и не переписывая существующую историю.

```bash
# Проверить состояние проекта. В идеале вывод должен содержать:
# "nothing to commit, working tree clean"
git status

# Получить из GitLab свежую информацию о коммитах и ветках.
# Команда обновляет удалённые ссылки, но не изменяет файлы проекта.
git fetch origin

# Переключиться на ветку dev.
git switch dev

# Обновить dev до состояния origin/master.
# --ff-only запрещает merge-коммит и завершает команду ошибкой,
# если простая перемотка вперёд невозможна.
git merge --ff-only origin/master

# Отправить обновлённую ветку dev в GitLab.
git push origin dev
```

::: tip Почему используется origin/master
После `git fetch origin` ссылка `origin/master` указывает на актуальное состояние ветки `master` в GitLab. Локальная ветка `master` при этом может оставаться устаревшей.
:::

::: warning Когда команда остановится
Если в `dev` есть собственные коммиты, которых нет в `origin/master`, простая перемотка невозможна. Благодаря `--ff-only` Git ничего не объединит автоматически: сначала нужно проверить расхождение веток и выбрать подходящую стратегию.
:::
