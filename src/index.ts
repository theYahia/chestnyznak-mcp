#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  checkMarkingCodeSchema,
  handleCheckMarkingCode,
  getProductInfoSchema,
  handleGetProductInfo,
} from "./tools/check.js";
import { checkBatchSchema, handleCheckBatch } from "./tools/batch.js";
import { searchProductsSchema, handleSearchProducts } from "./tools/search.js";
import { getCisInfoSchema, handleGetCisInfo } from "./tools/cis-info.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "chestnyznak-mcp",
    version: "1.1.0",
  });

  // --- Public tools (no auth) ---

  server.tool(
    "check_marking_code",
    "Проверка подлинности товара по коду маркировки Честный ЗНАК.",
    checkMarkingCodeSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleCheckMarkingCode(params) }],
    }),
  );

  server.tool(
    "get_product_info",
    "Подробная информация о товаре по коду маркировки: название, производитель, бренд.",
    getProductInfoSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetProductInfo(params) }],
    }),
  );

  server.tool(
    "check_batch",
    "Пакетная проверка до 50 кодов маркировки за один запрос.",
    checkBatchSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleCheckBatch(params) }],
    }),
  );

  // --- Auth-required tools (CHESTNYZNAK_TOKEN) ---

  server.tool(
    "search_products",
    "Поиск товаров по названию, бренду или GTIN. Требует CHESTNYZNAK_TOKEN.",
    searchProductsSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleSearchProducts(params) }],
    }),
  );

  server.tool(
    "get_cis_info",
    "Полная информация о CIS (коде идентификации) из CRPT API. Требует CHESTNYZNAK_TOKEN.",
    getCisInfoSchema.shape,
    async (params) => ({
      content: [{ type: "text", text: await handleGetCisInfo(params) }],
    }),
  );

  return server;
}

async function main() {
  const args = process.argv.slice(2);
  const httpMode = args.includes("--http");
  const port = parseInt(
    args.find((a) => a.startsWith("--port="))?.split("=")[1] ?? "3000",
    10,
  );

  const server = createServer();

  if (httpMode) {
    const { StreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );
    const http = await import("node:http");

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
    await server.connect(transport);

    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);

      if (url.pathname === "/mcp" && (req.method === "POST" || req.method === "GET" || req.method === "DELETE")) {
        await transport.handleRequest(req, res);
        return;
      }

      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", tools: 5 }));
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    });

    httpServer.listen(port, () => {
      console.error(`[chestnyznak-mcp] HTTP server on port ${port}. 5 tools. POST /mcp`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[chestnyznak-mcp] Сервер запущен (stdio). 5 инструментов.");
  }
}

main().catch((error) => {
  console.error("[chestnyznak-mcp] Ошибка:", error);
  process.exit(1);
});
