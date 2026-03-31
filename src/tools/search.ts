import { z } from "zod";
import { crptAuthGet, hasToken } from "../client.js";
import type { CrptAuthSearchResponse } from "../types.js";

export const searchProductsSchema = z.object({
  query: z.string().describe("Название товара, бренд или GTIN для поиска"),
  limit: z.number().min(1).max(100).default(10).describe("Количество результатов (по умолчанию 10)"),
});

export async function handleSearchProducts(
  params: z.infer<typeof searchProductsSchema>,
): Promise<string> {
  if (!hasToken()) {
    return JSON.stringify({
      error: "CHESTNYZNAK_TOKEN не задан. Поиск доступен только с авторизацией.",
      hint: "Установите переменную окружения CHESTNYZNAK_TOKEN.",
    }, null, 2);
  }

  const encoded = encodeURIComponent(params.query);
  const result = (await crptAuthGet(
    `/true-api/true-api/product/info?query=${encoded}&limit=${params.limit}`,
  )) as CrptAuthSearchResponse;

  const items = (result.results ?? []).map((item) => ({
    cis: item.cis ?? null,
    gtin: item.gtin ?? null,
    productName: item.productName ?? null,
    producerName: item.producerName ?? null,
    brand: item.brand ?? null,
    status: item.status ?? null,
  }));

  return JSON.stringify(
    { total: result.total ?? items.length, results: items },
    null,
    2,
  );
}
