---
title: "Debounce для функции"
description: "Откладывает выполнение функции, пока не закончится серия частых вызовов."
slug: "debounce-function"
locale: "ru"
language: "typescript"
tags:
  - "typescript"
  - "functions"
  - "performance"
updated: "2026-08-20"
---

# Debounce для функции

Подходит для поиска по мере ввода, изменения размера окна и других частых событий.

```ts
export function debounce<T extends (...args: never[]) => void>(
  callback: T,
  delay = 250,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>

  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => callback(...args), delay)
  }
}
```

Создавайте обёртку один раз и переиспользуйте её, иначе каждый вызов получит отдельный таймер.
