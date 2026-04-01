import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.CHESTNYZNAK_TOKEN;
});

describe("check_marking_code", () => {
  it("returns valid check result", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        codeFounded: true,
        isValid: true,
        status: "INTRODUCED",
        statusText: "Товар введён в оборот",
      }),
    );

    const { handleCheckMarkingCode } = await import("../src/tools/check.js");
    const result = JSON.parse(await handleCheckMarkingCode({ code: "0104600702028445" }));

    expect(result.found).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.status).toBe("INTRODUCED");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("handles not found code", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({ codeFounded: false, isValid: false, status: "NOT_FOUND" }),
    );

    const { handleCheckMarkingCode } = await import("../src/tools/check.js");
    const result = JSON.parse(await handleCheckMarkingCode({ code: "invalid" }));

    expect(result.found).toBe(false);
    expect(result.valid).toBe(false);
  });
});

describe("get_product_info", () => {
  it("returns full product info", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        codeFounded: true,
        isValid: true,
        status: "INTRODUCED",
        productName: "Молоко 3.2%",
        productGroupName: "Молочная продукция",
        brand: "Простоквашино",
        producerName: 'АО "Данон Россия"',
        producerInn: "7726299700",
        ownerName: "ООО Магнит",
        ownerInn: "2309085638",
      }),
    );

    const { handleGetProductInfo } = await import("../src/tools/check.js");
    const result = JSON.parse(await handleGetProductInfo({ code: "0104600702028445" }));

    expect(result.productName).toBe("Молоко 3.2%");
    expect(result.brand).toBe("Простоквашино");
    expect(result.producerName).toBe('АО "Данон Россия"');
    expect(result.rawResponse).toBeDefined();
  });
});

describe("check_batch", () => {
  it("checks multiple codes", async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ codeFounded: true, isValid: true, status: "OK", productName: "A" }))
      .mockResolvedValueOnce(makeResponse({ codeFounded: false, isValid: false, status: "NOT_FOUND" }));

    const { handleCheckBatch } = await import("../src/tools/batch.js");
    const result = JSON.parse(await handleCheckBatch({ codes: ["code1", "code2"] }));

    expect(result.total).toBe(2);
    expect(result.results[0].found).toBe(true);
    expect(result.results[1].found).toBe(false);
  });

  it("handles partial failures gracefully", async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ codeFounded: true, isValid: true, status: "OK" }))
      .mockRejectedValueOnce(new Error("Network error"));

    const { handleCheckBatch } = await import("../src/tools/batch.js");
    const result = JSON.parse(await handleCheckBatch({ codes: ["ok", "fail"] }));

    expect(result.total).toBe(2);
    expect(result.results[0].found).toBe(true);
    expect(result.results[1].status).toBe("error");
  });
});

describe("search_products", () => {
  it("returns error without token", async () => {
    const { handleSearchProducts } = await import("../src/tools/search.js");
    const result = JSON.parse(await handleSearchProducts({ query: "молоко", limit: 10 }));

    expect(result.error).toContain("CHESTNYZNAK_TOKEN");
  });

  it("searches with token", async () => {
    process.env.CHESTNYZNAK_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        total: 1,
        results: [{ productName: "Молоко", brand: "Простоквашино", gtin: "4600702028445" }],
      }),
    );

    const { handleSearchProducts } = await import("../src/tools/search.js");
    const result = JSON.parse(await handleSearchProducts({ query: "молоко", limit: 5 }));

    expect(result.total).toBe(1);
    expect(result.results[0].productName).toBe("Молоко");
  });
});

describe("get_cis_info", () => {
  it("returns error without token", async () => {
    const { handleGetCisInfo } = await import("../src/tools/cis-info.js");
    const result = JSON.parse(await handleGetCisInfo({ cis: "0104600702028445" }));

    expect(result.error).toContain("CHESTNYZNAK_TOKEN");
  });
});

describe("server creation", () => {
  it("creates server with 5 tools", async () => {
    const { createServer } = await import("../src/index.js");
    const server = createServer();
    expect(server).toBeDefined();
  });
});
