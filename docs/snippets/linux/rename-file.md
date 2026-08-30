---
title: "Переименовать файл в Linux"
description: "Переименование файла командой mv с безопасными вариантами и примером для конфигурации Nginx."
slug: "rename-file"
locale: "ru"
language: "linux"
tags:
  - "linux"
  - "mv"
  - "rename"
  - "filesystem"
  - "cli"
requirements:
  - "linux"
risk: "caution"
created: "2026-08-30T10:32:49+03:00"
updated: "2026-08-30"
---

# Переименовать файл в Linux

Команда `mv` переименовывает файл, если исходный и новый пути находятся в одной файловой системе. Для файла в `/etc` обычно нужны права администратора:

```bash
sudo mv -- /etc/nginx/sites-available/site.test /etc/nginx/sites-available/site.test.conf
```

`--` завершает список параметров и защищает от ошибочной обработки имени файла, начинающегося с дефиса.

::: warning Осторожно
Обычный `mv` может без предупреждения перезаписать существующий файл назначения. Сначала проверьте, что `/etc/nginx/sites-available/site.test.conf` ещё не существует, либо используйте один из безопасных вариантов ниже.
:::

## Безопасные варианты `mv`

```bash
# Спросить подтверждение перед перезаписью существующего файла
sudo mv -i -- /etc/nginx/sites-available/site.test /etc/nginx/sites-available/site.test.conf

# Не перезаписывать существующий файл
sudo mv -n -- /etc/nginx/sites-available/site.test /etc/nginx/sites-available/site.test.conf
```

Ключи `-i` и `-n` нельзя использовать одновременно. В сценариях обычно удобнее `-n`, а при ручном запуске — `-i`.

## Команда `rename`

Для пакетного переименования нескольких файлов можно использовать `rename`. В Debian и Ubuntu часто доступна Perl-версия команды:

```bash
sudo rename 's/\.test$/.test.conf/' /etc/nginx/sites-available/site.test
```

У `rename` есть несколько несовместимых реализаций с разным синтаксисом, а сама команда может быть не установлена. Для одного файла `mv` проще и переносимее.

## Если сайт уже включён в Nginx

После переименования файла ссылка в `sites-enabled` может вести на старый путь. Проверьте её командой `readlink` и при необходимости пересоздайте:

```bash
readlink /etc/nginx/sites-enabled/site.test

# Удалить старый путь, только если это символическая ссылка
if [ -L /etc/nginx/sites-enabled/site.test ]; then
  sudo rm -- /etc/nginx/sites-enabled/site.test
fi

sudo ln -s -- /etc/nginx/sites-available/site.test.conf /etc/nginx/sites-enabled/site.test.conf

sudo nginx -t
sudo systemctl reload nginx
```

Команда `ln` не перезапишет уже существующий файл или ссылку `site.test.conf`. Перезагружайте Nginx только после успешной проверки `nginx -t`.
