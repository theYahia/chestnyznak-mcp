import { z } from "zod";
import { crptAuthGet, hasToken } from "../client.js";

export const getCisInfoSchema = z.object({
  cis: z.string().describe("CIS (код идентификации) для получения полной информации из CRPT API"),
});

export async function handleGetCisInfo(
  params: z.infer<typeof getCisInfoSchema>,
): Promise<string> {
  if (!hasToken()) {
    return JSON.stringify({
      error: "CHESTNYZNAK_TOKEN не задан. CIS-запросы доступны только с авторизацией.",
      hint: "Установите переменную окружения CHESTNYZNAK_TOKEN.",
    }, null, 2);
  }

  const encoded = encodeURIComponent(params.cis);
  const result = await crptAuthGet(`/true-api/true-api/cis/info?cis=${encoded}`);

  return JSON.stringify(result, null, 2);
}
