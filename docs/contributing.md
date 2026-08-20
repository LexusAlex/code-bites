---
title: Как добавить сниппет
description: Git/CLI-процесс добавления, перевода и удаления сниппетов.
---

# Как добавить сниппет

Контент хранится в Git как Markdown. Русские версии находятся в `docs/snippets`, английские — в `docs/en/snippets`.

## Создание

```bash
npm run snippet:new
```

CLI последовательно запросит локаль, slug, язык, несколько тегов и код. Для автоматизации передавайте параметры:

```bash
npm run snippet:new -- \
  --locale ru \
  --slug array-chunks \
  --language typescript \
  --tags "typescript,arrays" \
  --title "Разбить массив на части" \
  --description "Разделение массива на блоки" \
  --code-file ./snippet.ts \
  --code-language ts
```

## Организация

Первый уровень каталога — язык или технология. Несколько независимых признаков задаются тегами, поэтому глубокое дерево категорий не требуется.

```text
docs/snippets/<language>/<slug>.md
docs/en/snippets/<language>/<slug>.md
```

Локализованные версии используют одинаковый `slug`, язык и набор технических тегов.

## Проверка и удаление

```bash
npm run snippets:validate
npm run snippets:list
npm run snippet:remove -- --locale ru --slug array-chunks
```

Перед pull request запустите `npm test`, `npm run typecheck` и `npm run build`.
