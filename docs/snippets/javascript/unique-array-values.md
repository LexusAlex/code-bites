---
title: "Уникальные значения массива"
description: "Удаление повторяющихся элементов массива с сохранением исходного порядка."
slug: "unique-array-values"
locale: "ru"
language: "javascript"
tags:
  - "javascript"
  - "arrays"
  - "collections"
updated: "2026-08-20"
---

# Уникальные значения массива

`Set` оставляет только первое вхождение каждого значения, а оператор spread преобразует коллекцию обратно в массив.

```js
const uniqueValues = (values) => [...new Set(values)]
```

## Пример

```js
uniqueValues(['draft', 'ready', 'draft'])
// ['draft', 'ready']
```

Для объектов сравнение выполняется по ссылке, а не по содержимому.
