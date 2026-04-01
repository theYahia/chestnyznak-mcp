import { z } from "zod";
import { crptPost } from "../client.js";
import type { CrptCheckResponse } from "../types.js";

export const checkBatchSchema = z.object({
  codes: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe("Массив кодов маркировки (до 50 штук) для пакетной проверки"),
});

export async function handleCheckBatch(
  params: z.infer<typeof checkBatchSchema>,
): Promise<string> {
  const results = await Promise.allSettled(
    params.codes.map(async (code) => {
      const result = (await crptPost("/check", { code })) as CrptCheckResponse;
      return {
        code,
        found: result.codeFounded ?? false,
        valid: result.isValid ?? false,
        status: result.status ?? "unknown",
        productName: result.productName ?? null,
      };
    }),
  );

  const output = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      code: params.codes[i],
      found: false,
      valid: false,
      status: "error",
      error: r.reason?.message ?? "Неизвестная ошибка",
    };
  });

  return JSON.stringify(
    { total: output.length, results: output },
    null,
    2,
  );
}
