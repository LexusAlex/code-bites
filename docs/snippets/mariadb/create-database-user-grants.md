---
title: "Создать базу данных и пользователя в MariaDB"
description: "Создание базы данных и пользователя, выдача и проверка прав доступа."
slug: "create-database-user-grants"
locale: "ru"
language: "mariadb"
tags:
  - "mariadb"
  - "sql"
  - "users"
  - "permissions"
  - "grants"
  - "create"
  - "database"
risk: "caution"
created: "2026-08-25T16:43:43+03:00"
updated: "2026-08-25"
---

# Создать базу данных и пользователя в MariaDB

Создаёт базу данных `site.test` в кодировке `utf8mb4`, добавляет пользователя `site`, выдаёт ему права на изменение данных и позволяет проверить результат.

::: warning Безопасность
Пользователь `'site'@'%'` может подключаться с любого хоста, а пустая строка в `IDENTIFIED BY ''` задаёт пустой пароль. Используйте этот вариант только в изолированной локальной среде. В остальных случаях укажите надёжный пароль и ограничьте допустимый хост.
:::

## Команды

```sql
-- Создать базу данных с кодировкой utf8mb4
CREATE DATABASE IF NOT EXISTS `site.test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Создать пользователя с доступом с любого хоста и пустым паролем
CREATE USER IF NOT EXISTS 'site'@'%' IDENTIFIED BY '';
-- Выдать права на чтение и изменение данных во всех таблицах базы
GRANT SELECT, INSERT, UPDATE, DELETE ON `site.test`.* TO 'site'@'%';
-- Проверить выданные пользователю права
SHOW GRANTS FOR 'site'@'%';
-- Перечитать таблицы привилегий
FLUSH PRIVILEGES;
```

После `CREATE USER` и `GRANT` команда `FLUSH PRIVILEGES` обычно не требуется: изменения прав применяются сразу. Она нужна после прямого изменения системных таблиц привилегий.
