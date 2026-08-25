---
title: Как добавить кодобайт
description: Git/CLI-процесс добавления, перевода и удаления кодобайтов.
---

# Как добавить кодобайт

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

При создании CLI автоматически записывает в frontmatter поле `created` с точной датой, временем и часовым поясом. Дату и время обновления вручную менять не нужно: при сборке сайта они берутся из последнего Git-коммита файла. До первого коммита используется значение `created`.

## Организация

Первый уровень каталога — язык или технология. Несколько независимых признаков задаются тегами, поэтому глубокое дерево категорий не требуется.

```text
docs/snippets/<language>/<slug>.md
docs/en/snippets/<language>/<slug>.md
```

Локализованные версии используют одинаковый `slug`, язык и набор технических тегов.

## Именование

Slug отвечает на вопрос «что делает», а не «который по счёту». Если хочется назвать `foo-2` — это сигнал, что либо различие не сформулировано (сформулируйте: `foo-batch`, `foo-async`), либо это правка старого кодобайта (отредактируйте его).

Title может быть человеческим и с уточнением: «Debounce для функции», «Debounce с первым вызовом» — а slug у них `debounce-function` и `debounce-immediate`.

## Проверка и удаление

```bash
npm run snippets:validate
npm run snippets:list
npm run snippet:remove -- --locale ru --slug array-chunks
```

Перед pull request запустите `npm test`, `npm run typecheck` и `npm run build`.
