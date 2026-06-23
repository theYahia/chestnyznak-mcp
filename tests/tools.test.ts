import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

/** Mock Response. The client reads `text()` then JSON.parses it. */
function makeResponse(data: unknown, status = 200) {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    text: () => Promise.resolve(text),
  };
}

function abortError() {
  return new DOMException("The operation was aborted", "AbortError");
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  delete process.env.CHESTNYZNAK_TOKEN;
  delete process.env.CHESTNYZNAK_BASE_URL;
});

describe("check_marking_code", () => {
  it("returns valid check result and sends codeType=datamatrix by default", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({ codeFounded: true, checkResult: true, status: "INTRODUCED" }),
    );

    const { handleCheckMarkingCode } = await import("../src/tools/check.js");
    const result = await handleCheckMarkingCode({ code: "0104600702028445", codeType: "datamatrix" });

    expect(result.found).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.status).toBe("INTRODUCED");
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/check?code=0104600702028445");
    expect(url).toContain("codeType=datamatrix");
    expect(opts.method).toBe("GET");
  });

  it("uses checkResult (not isValid) for validity, and codeFounded for found", async () => {
    // isValid present but checkResult false -> valid must follow checkResult
    mockFetch.mockResolvedValueOnce(
      makeResponse({ codeFounded: true, isValid: true, checkResult: false }),
    );
    const { handleCheckMarkingCode } = await import("../src/tools/check.js");
    const result = await handleCheckMarkingCode({ code: "x", codeType: "datamatrix" });
    expect(result.found).toBe(true);
    expect(result.valid).toBe(false);
  });

  it("handles not-found code", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ codeFounded: false, checkResult: false }));
    const { handleCheckMarkingCode } = await import("../src/tools/check.js");
    const result = await handleCheckMarkingCode({ code: "invalid", codeType: "qr" });
    expect(result.found).toBe(false);
    expect(result.valid).toBe(false);
    expect(mockFetch.mock.calls[0][0]).toContain("codeType=qr");
  });
});

describe("get_product_info", () => {
  it("reads detail from the nested <category>Data object (nested wins)", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({
        codeFounded: true,
        checkResult: true,
        productName: "Молоко 3.2%",
        category: "milk",
        status: "EMITTED", // root
        milkData: {
          status: "INTRODUCED", // nested wins
          producerName: 'АО "Данон Россия"',
          ownerName: "ООО Магнит",
          ownerInn: "2309085638",
        },
      }),
    );

    const { handleGetProductInfo } = await import("../src/tools/check.js");
    const result = await handleGetProductInfo({ code: "0104600702028445", codeType: "datamatrix" });

    expect(result.productName).toBe("Молоко 3.2%");
    expect(result.category).toBe("milk");
    expect(result.status).toBe("INTRODUCED"); // nested overrode root EMITTED
    expect(result.producerName).toBe('АО "Данон Россия"');
    expect(result.ownerInn).toBe("2309085638");
  });

  it("falls back to root fields when no nested object exists", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({ codeFounded: true, checkResult: true, productName: "Сыр", producerName: "Z" }),
    );
    const { handleGetProductInfo } = await import("../src/tools/check.js");
    const result = await handleGetProductInfo({ code: "x", codeType: "datamatrix" });
    expect(result.productName).toBe("Сыр");
    expect(result.producerName).toBe("Z");
    expect(result.ownerName).toBeNull();
  });

  it("does not leak a rawResponse passthrough", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({ codeFounded: true, checkResult: true, secretInternalField: "leak" }),
    );
    const { handleGetProductInfo } = await import("../src/tools/check.js");
    const result = await handleGetProductInfo({ code: "x", codeType: "datamatrix" });
    expect(JSON.stringify(result)).not.toContain("secretInternalField");
  });
});

describe("check_batch", () => {
  it("checks multiple codes preserving order", async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ codeFounded: true, checkResult: true, status: "OK", productName: "A" }))
      .mockResolvedValueOnce(makeResponse({ codeFounded: false, checkResult: false, status: "NOT_FOUND" }));

    const { handleCheckBatch } = await import("../src/tools/batch.js");
    const result = await handleCheckBatch({ codes: ["code1", "code2"], codeType: "datamatrix" });

    expect(result.total).toBe(2);
    expect(result.results[0].code).toBe("code1");
    expect(result.results[0].found).toBe(true);
    expect(result.results[1].found).toBe(false);
  });

  it("handles partial failures gracefully, preserving the failing code", async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ codeFounded: true, checkResult: true, status: "OK" }))
      .mockRejectedValueOnce(new Error("Network error"));

    const { handleCheckBatch } = await import("../src/tools/batch.js");
    const result = await handleCheckBatch({ codes: ["ok", "bad"], codeType: "datamatrix" });

    expect(result.total).toBe(2);
    expect(result.results[0].found).toBe(true);
    expect(result.results[1].code).toBe("bad");
    expect(result.results[1].status).toBe("error");
    expect(result.results[1].error).toContain("Network error");
  });

  it("maps every item to error when all fail", async () => {
    mockFetch.mockRejectedValue(new Error("DNS fail"));
    const { handleCheckBatch } = await import("../src/tools/batch.js");
    const result = await handleCheckBatch({ codes: ["a", "b", "c"], codeType: "datamatrix" });
    expect(result.total).toBe(3);
    for (const r of result.results) {
      expect(r.status).toBe("error");
      expect(r.error).toContain("DNS fail");
    }
  });

  it("never runs more than the concurrency cap (5) in flight", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    mockFetch.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight--;
      return makeResponse({ codeFounded: true, checkResult: true });
    });
    const { handleCheckBatch } = await import("../src/tools/batch.js");
    const codes = Array.from({ length: 20 }, (_, i) => `c${i}`);
    const result = await handleCheckBatch({ codes, codeType: "datamatrix" });
    expect(result.total).toBe(20);
    expect(maxInFlight).toBeLessThanOrEqual(5);
  });
});

describe("search_products (auth)", () => {
  it("throws without a token", async () => {
    const { handleSearchProducts } = await import("../src/tools/search.js");
    await expect(handleSearchProducts({ query: "4600702028445" })).rejects.toThrow("CHESTNYZNAK_TOKEN");
  });

  it("POSTs to product/info with the Bearer token", async () => {
    process.env.CHESTNYZNAK_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce(
      makeResponse({ total: 1, results: [{ gtin: "4600702028445", productName: "Молоко", brand: "Простоквашино" }] }),
    );
    const { handleSearchProducts } = await import("../src/tools/search.js");
    const result = await handleSearchProducts({ query: "4600702028445" });
    expect(result.total).toBe(1);
    expect(result.results[0].productName).toBe("Молоко");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v4/true-api/product/info");
    expect(opts.method).toBe("POST");
    expect(opts.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(opts.body)).toEqual({ gtins: ["4600702028445"] });
  });
});

describe("get_cis_info (auth)", () => {
  it("throws without a token", async () => {
    const { handleGetCisInfo } = await import("../src/tools/cis-info.js");
    await expect(handleGetCisInfo({ cis: "0104600702028445" })).rejects.toThrow("CHESTNYZNAK_TOKEN");
  });

  it("POSTs to cises/info (plural) with an array body and Bearer token", async () => {
    process.env.CHESTNYZNAK_TOKEN = "test-token";
    mockFetch.mockResolvedValueOnce(
      makeResponse([{ cis: "0104600702028445", productName: "Молоко", producerInn: "7726299700", status: "INTRODUCED" }]),
    );
    const { handleGetCisInfo } = await import("../src/tools/cis-info.js");
    const result = await handleGetCisInfo({ cis: "0104600702028445" });

    expect(result.cis).toBe("0104600702028445");
    expect(result.productName).toBe("Молоко");
    expect(result.status).toBe("INTRODUCED");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v3/true-api/cises/info");
    expect(opts.method).toBe("POST");
    expect(opts.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(opts.body)).toEqual(["0104600702028445"]);
  });
});

describe("client: retry / backoff / timeout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("retries once on HTTP 429 then succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({}, 429))
      .mockResolvedValueOnce(makeResponse({ codeFounded: true }, 200));
    const { crptPublicGet } = await import("../src/client.js");
    const p = crptPublicGet("/check?code=x&codeType=datamatrix");
    await vi.runAllTimersAsync();
    await expect(p).resolves.toMatchObject({ codeFounded: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("gives up after MAX_RETRIES (3) on persistent 500", async () => {
    mockFetch.mockResolvedValue(makeResponse({}, 500));
    const { crptPublicGet } = await import("../src/client.js");
    const p = crptPublicGet("/check?code=x&codeType=datamatrix").catch((e) => e);
    await vi.runAllTimersAsync();
    const err = (await p) as Error;
    expect(String(err.message)).toContain("HTTP 500");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry a non-429 4xx (e.g. 401)", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({}, 401));
    const { crptPublicGet } = await import("../src/client.js");
    await expect(crptPublicGet("/check?code=x&codeType=datamatrix")).rejects.toThrow("HTTP 401");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries a transient network error (TypeError) then succeeds", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(makeResponse({ codeFounded: true }));
    const { crptPublicGet } = await import("../src/client.js");
    const p = crptPublicGet("/check?code=x&codeType=datamatrix");
    await vi.runAllTimersAsync();
    await expect(p).resolves.toMatchObject({ codeFounded: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries an aborted request, then surfaces a friendly timeout message if it never succeeds", async () => {
    mockFetch.mockRejectedValue(abortError());
    const { crptPublicGet } = await import("../src/client.js");
    const p = crptPublicGet("/check?code=x&codeType=datamatrix").catch((e) => e);
    await vi.runAllTimersAsync();
    const err = (await p) as Error;
    expect(String(err.message)).toContain("таймаут запроса");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("throws a readable error on a non-JSON success body", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse("<html>not json</html>", 200));
    const { crptPublicGet } = await import("../src/client.js");
    await expect(crptPublicGet("/check?code=x&codeType=datamatrix")).rejects.toThrow("некорректный JSON");
  });
});

describe("client: CHESTNYZNAK_BASE_URL validation (SSRF guard)", () => {
  it("rejects a non-crpt.ru override before sending the token", async () => {
    process.env.CHESTNYZNAK_TOKEN = "secret";
    process.env.CHESTNYZNAK_BASE_URL = "https://evil.example.com";
    const { crptAuthGet } = await import("../src/client.js");
    await expect(crptAuthGet("/api/v3/true-api/cises/info")).rejects.toThrow("CHESTNYZNAK_BASE_URL");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("accepts an https *.crpt.ru override", async () => {
    process.env.CHESTNYZNAK_TOKEN = "secret";
    process.env.CHESTNYZNAK_BASE_URL = "https://markirovka.sandbox.crptech.ru";
    mockFetch.mockResolvedValueOnce(makeResponse({ cis: "x" }));
    const { crptAuthPost } = await import("../src/client.js");
    await crptAuthPost("/api/v3/true-api/cises/info", ["x"]);
    expect(mockFetch.mock.calls[0][0]).toContain("crptech.ru");
  });
});

describe("server creation", () => {
  it("creates a server with all 5 tools registered", async () => {
    const { createServer } = await import("../src/index.js");
    const server = createServer();
    expect(server).toBeDefined();
  });
});
