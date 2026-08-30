---
title: "Запустить сайт в Apache"
description: "Включение конфигурации сайта, проверка синтаксиса и безопасная перезагрузка Apache."
slug: "apache-enable-site"
locale: "ru"
language: "apache"
tags:
  - "linux"
  - "apache"
  - "a2ensite"
  - "web-server"
  - "cli"
requirements:
  - "linux"
  - "sudo"
risk: "caution"
created: "2026-08-30T10:54:37+03:00"
updated: "2026-08-30"
---

# Запустить сайт в Apache

Включает виртуальный хост `mysite.conf`, проверяет конфигурацию Apache и применяет изменения без полной остановки сервера:

```bash
sudo a2ensite mysite.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Файл `mysite.conf` должен находиться в `/etc/apache2/sites-available/`. Команду `reload` выполняйте только после сообщения `Syntax OK` от `apache2ctl configtest`.
