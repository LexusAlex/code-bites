---
title: "PostgreSQL upsert"
description: "Insert a row or update the existing one with ON CONFLICT."
slug: "postgres-upsert"
locale: "en"
language: "sql"
tags:
  - "sql"
  - "postgresql"
  - "database"
updated: "2026-08-20"
---

# PostgreSQL upsert

`ON CONFLICT` requires a unique index or constraint that covers the specified columns.

```sql
INSERT INTO user_settings (user_id, theme, updated_at)
VALUES (:user_id, :theme, NOW())
ON CONFLICT (user_id)
DO UPDATE SET
  theme = EXCLUDED.theme,
  updated_at = EXCLUDED.updated_at
RETURNING *;
```

`EXCLUDED` contains the values of the row PostgreSQL attempted to insert.
