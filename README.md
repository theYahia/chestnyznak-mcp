# @theyahia/chestnyznak-mcp

MCP-сервер для Честный ЗНАК API — проверка маркировки товаров. **2 инструмента.** Авторизация не требуется.

[![npm](https://img.shields.io/npm/v/@theyahia/chestnyznak-mcp)](https://www.npmjs.com/package/@theyahia/chestnyznak-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Часть серии [Russian API MCP](https://github.com/theYahia/russian-mcp) (50 серверов) by [@theYahia](https://github.com/theYahia).

## Установка

### Claude Desktop
```json
{ "mcpServers": { "chestnyznak": { "command": "npx", "args": ["-y", "@theyahia/chestnyznak-mcp"] } } }
```

### Claude Code
```bash
claude mcp add chestnyznak -- npx -y @theyahia/chestnyznak-mcp
```

Переменные окружения не требуются — публичный API не требует авторизации.

## Инструменты (2)

| Инструмент | Описание |
|------------|----------|
| `check_marking_code` | Проверка подлинности товара по коду маркировки |
| `get_product_info` | Подробная информация о товаре: название, производитель, бренд |

## Примеры
```
Проверь код маркировки 0104600702028445
Расскажи подробнее о товаре с кодом 010460070202844521
```

## API

Используется публичный endpoint: `https://mobile.api.crpt.ru/mobile/check` (POST, без авторизации).

Для расширенного доступа существует авторизованный API `https://markirovka.crpt.ru/api/v4/` (требует сертификат — не поддерживается в этой версии).

## Лицензия
MIT
