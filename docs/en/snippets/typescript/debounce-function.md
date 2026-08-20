---
title: "Debounce a function"
description: "Delay a function call until a burst of frequent calls has stopped."
slug: "debounce-function"
locale: "en"
language: "typescript"
tags:
  - "typescript"
  - "functions"
  - "performance"
updated: "2026-08-20"
---

# Debounce a function

Useful for search-as-you-type, window resize handlers, and other high-frequency events.

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

Create the wrapper once and reuse it, otherwise every call gets an independent timer.
