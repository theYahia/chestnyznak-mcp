# @theyahia/chestnyznak-mcp

MCP-сервер для Честный ЗНАК API — проверка маркировки товаров. **5 инструментов.** Публичные проверки без авторизации, расширенный поиск с токеном.

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
# Endpoint: POST http://localhost:3000/mcp
# Health:   GET  http://localhost:3000/health
```

## Переменные окружения

| Переменная | Обязательна | Описание |
|-----------|-------------|----------|
| `CHESTNYZNAK_TOKEN` | Нет | Токен API для расширенных инструментов (search, CIS info) |
| `CHESTNYZNAK_BASE_URL` | Нет | Базовый URL авторизованного API (по умолчанию `https://markirovka.crpt.ru/api/v4`) |

## Инструменты (5)

### Публичные (без авторизации)

| Инструмент | Описание |
|------------|----------|
| `check_marking_code` | Проверка подлинности товара по коду маркировки |
| `get_product_info` | Подробная информация о товаре: название, производитель, бренд |
| `check_batch` | Пакетная проверка до 50 кодов маркировки за один запрос |

### Авторизованные (CHESTNYZNAK_TOKEN)

| Инструмент | Описание |
|------------|----------|
| `search_products` | Поиск товаров по названию, бренду или GTIN |
| `get_cis_info` | Полная информация о CIS (коде идентификации) |

## Примеры
```
Проверь код маркировки 0104600702028445
Расскажи подробнее о товаре с кодом 010460070202844521
Проверь пачку кодов: 0104600702028445, 0104600702028446
Найди молоко Простоквашино
Информация о CIS 0104600702028445
```

## Skills

| Skill | Триггер |
|-------|---------|
| `skill-check-product` | "Проверь маркировку товара по коду" |
| `skill-search` | "Найди товар по названию" |

## API

- **Публичный:** `https://mobile.api.crpt.ru/mobile/check` (POST, без авторизации)
- **Авторизованный:** `https://markirovka.crpt.ru/api/v4/` (Bearer token)

## Лицензия
MIT
