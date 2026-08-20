---
title: "Upsert в PostgreSQL"
description: "Создание записи или обновление существующей через ON CONFLICT."
slug: "postgres-upsert"
locale: "ru"
language: "sql"
tags:
  - "sql"
  - "postgresql"
  - "database"
updated: "2026-08-20"
---

# Upsert в PostgreSQL

Для `ON CONFLICT` нужен уникальный индекс или ограничение по указанным столбцам.

```sql
INSERT INTO user_settings (user_id, theme, updated_at)
VALUES (:user_id, :theme, NOW())
ON CONFLICT (user_id)
DO UPDATE SET
  theme = EXCLUDED.theme,
  updated_at = EXCLUDED.updated_at
RETURNING *;
```

`EXCLUDED` содержит значения строки, которую PostgreSQL пытался вставить.
