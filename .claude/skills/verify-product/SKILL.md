---
name: verify-product
description: Проверить подлинность товара по коду маркировки Честный ЗНАК
argument-hint: <код маркировки>
allowed-tools:
  - mcp__chestnyznak__check_marking_code
  - mcp__chestnyznak__get_product_info
---

# /verify-product — Проверка маркировки

## Алгоритм
1. Вызови `check_marking_code` с кодом (по умолчанию `codeType: datamatrix`).
2. Если нужны производитель/название — вызови `get_product_info`.
3. Покажи: найден ли код (`found`), пройдена ли проверка (`valid`), статус, название, производитель.

## Формат ответа
```
## Проверка маркировки
**Товар**: [productName]
**Производитель**: [producerName]
**Найден**: да / нет
**Проверка**: пройдена / не пройдена ([status])
```

## Примеры
```
/verify-product 010460406000600321CPGpRgR
```
