---
title: "Docker Compose service healthcheck"
description: "Wait for an HTTP service to become ready before starting its dependent container."
slug: "compose-healthcheck"
locale: "en"
language: "docker"
tags:
  - "docker"
  - "compose"
  - "devops"
  - "healthcheck"
updated: "2026-08-20"
---

# Docker Compose service healthcheck

The `service_healthy` condition checks application readiness instead of merely checking whether the container started.

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

The healthcheck command must be available inside the image of the service being checked.
