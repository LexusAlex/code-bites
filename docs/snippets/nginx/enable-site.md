---
title: "Включить сайт в Nginx"
description: "Включение конфигурации сайта через символическую ссылку с проверкой и перезагрузкой Nginx."
slug: "enable-site"
locale: "ru"
language: "nginx"
tags:
  - "nginx"
  - "linux"
  - "configuration"
  - "cli"
  - "web-server"
  - "symlink"
  - "systemd"
requirements:
  - "sudo"
  - "linux"
risk: "caution"
created: "2026-08-30T10:29:14+03:00"
updated: "2026-08-30"
---

# Включить сайт в Nginx

Создаёт символическую ссылку на конфигурацию сайта, проверяет конфигурацию Nginx и применяет её без остановки сервера.

```bash
# Включить сайт
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/example.com

# Проверить конфигурацию Nginx
sudo nginx -t

# Применить конфигурацию, если проверка завершилась успешно
sudo systemctl reload nginx
```

Каталоги `sites-available` и `sites-enabled` обычно используются в Debian и Ubuntu. Перед выполнением замените `example.com` на имя файла конфигурации своего сайта.
