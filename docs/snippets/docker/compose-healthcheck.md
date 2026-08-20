---
title: "Healthcheck сервиса в Docker Compose"
description: "Ожидание готовности HTTP-сервиса перед запуском зависимого контейнера."
slug: "compose-healthcheck"
locale: "ru"
language: "docker"
tags:
  - "docker"
  - "compose"
  - "devops"
  - "healthcheck"
updated: "2026-08-20"
---

# Healthcheck сервиса в Docker Compose

Условие `service_healthy` проверяет готовность приложения, а не только факт запуска контейнера.

```yaml
services:
  api:
    build: .
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

  worker:
    build: .
    depends_on:
      api:
        condition: service_healthy
```

Команда проверки должна присутствовать внутри образа проверяемого сервиса.
