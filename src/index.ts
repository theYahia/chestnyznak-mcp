#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { checkMarkingCodeSchema, handleCheckMarkingCode, getProductInfoSchema, handleGetProductInfo } from "./tools/check.js";

const server = new McpServer({ name: "chestnyznak-mcp", version: "1.0.0" });

server.tool("check_marking_code", "Проверка подлинности товара по коду маркировки Честный ЗНАК.", checkMarkingCodeSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCheckMarkingCode(params) }] }));

server.tool("get_product_info", "Подробная информация о товаре по коду маркировки: название, производитель, бренд.", getProductInfoSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetProductInfo(params) }] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[chestnyznak-mcp] Сервер запущен. 2 инструмента.");
}

main().catch((error) => { console.error("[chestnyznak-mcp] Ошибка:", error); process.exit(1); });
