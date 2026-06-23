# @theyahia/chestnyznak-mcp

MCP-сервер для API «Честный ЗНАК» / ЦРПТ — проверка маркировки товаров. **5 инструментов.** Публичные проверки без авторизации, информация из True API с токеном.

[![npm](https://img.shields.io/npm/v/@theyahia/chestnyznak-mcp)](https://www.npmjs.com/package/@theyahia/chestnyznak-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Часть серии [Russian API MCP](https://github.com/theYahia/russian-mcp) (50 серверов) by [@theYahia](https://github.com/theYahia).

## Установка

### Claude Desktop
```json
{
  "mcpServers": {
    "chestnyznak": {
      "command": "npx",
      "args": ["-y", "@theyahia/chestnyznak-mcp"]
    }
  }
}
```

### Claude Desktop (с авторизацией)
```json
{
  "mcpServers": {
    "chestnyznak": {
      "command": "npx",
      "args": ["-y", "@theyahia/chestnyznak-mcp"],
      "env": {
        "CHESTNYZNAK_TOKEN": "ваш-токен"
      }
    }
  }
}
```

### Claude Code
```bash
claude mcp add chestnyznak -- npx -y @theyahia/chestnyznak-mcp

# С авторизацией
CHESTNYZNAK_TOKEN=ваш-токен claude mcp add chestnyznak -- npx -y @theyahia/chestnyznak-mcp
```

### Streamable HTTP
```bash
npx @theyahia/chestnyznak-mcp --http --port=3000
# Endpoint: POST http://127.0.0.1:3000/mcp
# Health:   GET  http://127.0.0.1:3000/health
```

По умолчанию HTTP-сервер слушает только `127.0.0.1` и проверяет заголовок `Host`
(защита от DNS-rebinding). Чтобы открыть наружу — `--host=0.0.0.0` (на свой риск,
аутентификации на `/mcp` нет).

## Переменные окружения

| Переменная | Обязательна | Описание |
|-----------|-------------|----------|
| `CHESTNYZNAK_TOKEN` | Нет | Токен True API для инструментов `search_products`, `get_cis_info`. См. «Авторизация». |
| `CHESTNYZNAK_BASE_URL` | Нет | Origin авторизованного API (по умолчанию `https://markirovka.crpt.ru`). Допускаются только `https` хосты `*.crpt.ru` / `*.crptech.ru`. |
| `CHESTNYZNAK_PUBLIC_BASE_URL` | Нет | Базовый URL публичного API (по умолчанию `https://mobile.api.crpt.ru/mobile`). Удобно для моков в тестах. |

## Инструменты (5)

### Публичные (без авторизации)

| Инструмент | Аргументы | Описание |
|------------|-----------|----------|
| `check_marking_code` | `code`, `codeType?` | Проверка подлинности по коду маркировки |
| `get_product_info` | `code`, `codeType?` | Подробная информация: название, группа, производитель, владелец |
| `check_batch` | `codes[]`, `codeType?` | Пакетная проверка до 50 кодов (параллелизм ограничен) |

`codeType` — `datamatrix` (по умолчанию), `qr` или `ean13`.

### Авторизованные (CHESTNYZNAK_TOKEN)

| Инструмент | Аргументы | Описание |
|------------|-----------|----------|
| `search_products` | `query` (GTIN) | Информация о товаре по GTIN из True API |
| `get_cis_info` | `cis` | Информация о CIS (коде идентификации) из True API |

> Поиск по названию/бренду — это Национальный каталог (`nk.crpt.ru`), отдельный API; здесь не поддерживается. `search_products` работает по GTIN.

## Формат ответа

`check_marking_code`:
```json
{ "code": "0104600702028445", "found": true, "valid": true, "status": "INTRODUCED" }
```

`get_product_info` (поля `producer`/`owner`/`status` берутся из вложенного объекта группы товара, при отсутствии — `null`):
```json
{
  "code": "0104600702028445",
  "found": true,
  "valid": true,
  "status": "INTRODUCED",
  "productName": "Молоко 3.2%",
  "category": "milk",
  "producerName": "АО \"Данон Россия\"",
  "ownerName": "ООО Магнит",
  "ownerInn": "2309085638"
}
```

`status` — строковый enum: `EMITTED` / `APPLIED` / `INTRODUCED` / `RETIRED` / `WRITTEN_OFF` / `DISAGGREGATION` и др.

Каждый инструмент дополнительно возвращает `structuredContent` (типизированный объект по `outputSchema`), помимо текстового JSON.

## Примеры
```
Проверь код маркировки 0104600702028445
Расскажи подробнее о товаре с кодом 010460070202844521
Проверь пачку кодов: 0104600702028445, 0104600702028446
Информация о товаре с GTIN 04600702028445
Информация о CIS 0104600702028445
```

## Авторизация (True API)

⚠️ Важно: у True API (ГИС МТ) **нет статичного «вечного» токена**. Токен получают по
схеме «запрос-подпись» сертификатом УКЭП (ГОСТ):

1. `GET /api/v3/true-api/auth/key` → `{ uuid, data }`
2. Подписать `data` сертификатом УКЭП (CAdES-BES, base64).
3. `POST /api/v3/true-api/auth/simpleSignIn` `{ uuid, data: <подпись> }` → токен.
4. Срок жизни токена — **не более ~10 часов**, далее повторная авторизация.

Этот сервер использует `CHESTNYZNAK_TOKEN` как **уже полученный** таким образом токен
(он отправляется как `Authorization: Bearer`). Подпись УКЭП выполняется вне сервера
(например, через КриптоПро) — встроенного ГОСТ-подписания здесь нет. Регистрация
доступна юрлицам/ИП на [markirovka.crpt.ru](https://markirovka.crpt.ru).

> Эндпоинты/методы авторизованной части (пути, тело запроса) выверены по официальной
> документации и открытым клиентам, но **не проверены против живого токена** из-за
> требования УКЭП. Если ЦРПТ изменит контракт — поправьте через `CHESTNYZNAK_BASE_URL`.

## Skills

| Skill | Триггер |
|-------|---------|
| `skill-check-product` | «Проверь маркировку товара по коду» |
| `skill-search` | «Найди товар по GTIN» |

## Troubleshooting

| Симптом | Причина / решение |
|---|---|
| `CHESTNYZNAK_TOKEN не задан` | Инструменты `search_products`/`get_cis_info` требуют токен (см. «Авторизация»). |
| `таймаут запроса` / `все попытки исчерпаны` | Сеть/недоступность API; сервер делает до 3 попыток с backoff. Публичный API может не отвечать с не-РФ IP. |
| `HTTP 401` / `HTTP 403` | Токен невалиден или истёк (~10ч) — получите заново. |
| `HTTP 429` | Рейт-лимит; сервер повторяет автоматически. Для batch уменьшите размер пачки. |
| `CHESTNYZNAK_BASE_URL отклонён` | Override должен быть `https` и хостом `*.crpt.ru`/`*.crptech.ru`. |

## API

- **Публичный (без авторизации):** `GET https://mobile.api.crpt.ru/mobile/check?code=<код>&codeType=<тип>` — недокументированный эндпоинт мобильного приложения.
- **Авторизованный (Bearer):** `https://markirovka.crpt.ru/api/v3/true-api/...` — True API (ГИС МТ).

## Разработка

```bash
npm ci
npm run typecheck   # tsc --noEmit (src + tests)
npm test            # vitest
npm run build       # tsc -> dist/
npm run dev         # tsx watch (stdio)
npm run dev:http    # tsx watch (HTTP)
```

## Лицензия
MIT
