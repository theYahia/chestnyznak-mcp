import { z } from "zod";
import { crptPost } from "../client.js";
import type { CrptCheckResponse } from "../types.js";

export const checkMarkingCodeSchema = z.object({
  code: z.string().describe("Код маркировки товара (DataMatrix, штрихкод и т.д.)"),
});

export async function handleCheckMarkingCode(params: z.infer<typeof checkMarkingCodeSchema>): Promise<string> {
  const result = await crptPost("/check", { code: params.code }) as CrptCheckResponse;

  const summary = {
    code: params.code,
    found: result.codeFounded ?? false,
    valid: result.isValid ?? false,
    status: result.status ?? "unknown",
    statusText: result.statusText ?? null,
  };

  return JSON.stringify(summary, null, 2);
}

export const getProductInfoSchema = z.object({
  code: z.string().describe("Код маркировки товара (DataMatrix, штрихкод и т.д.)"),
});

export async function handleGetProductInfo(params: z.infer<typeof getProductInfoSchema>): Promise<string> {
  const result = await crptPost("/check", { code: params.code }) as CrptCheckResponse;

  const info = {
    code: params.code,
    found: result.codeFounded ?? false,
    valid: result.isValid ?? false,
    status: result.status ?? "unknown",
    statusText: result.statusText ?? null,
    productName: result.productName ?? null,
    productGroup: result.productGroupName ?? null,
    brand: result.brand ?? null,
    producerName: result.producerName ?? null,
    producerInn: result.producerInn ?? null,
    ownerName: result.ownerName ?? null,
    ownerInn: result.ownerInn ?? null,
    rawResponse: result,
  };

  return JSON.stringify(info, null, 2);
}
