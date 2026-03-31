const PUBLIC_BASE_URL = "https://mobile.api.crpt.ru/mobile";
const AUTH_BASE_URL = "https://markirovka.crpt.ru/api/v4";
const TIMEOUT = 10_000;
const MAX_RETRIES = 3;

function getToken(): string | undefined {
  return process.env.CHESTNYZNAK_TOKEN;
}

export function getAuthBaseUrl(): string {
  return process.env.CHESTNYZNAK_BASE_URL ?? AUTH_BASE_URL;
}

async function request(
  url: string,
  method: "GET" | "POST",
  body: unknown | undefined,
  token?: string,
): Promise<unknown> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) return response.json();

      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw new Error(`Честный ЗНАК HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      clearTimeout(timer);
      if (
        error instanceof DOMException &&
        error.name === "AbortError" &&
        attempt < MAX_RETRIES
      )
        continue;
      throw error;
    }
  }
  throw new Error("Честный ЗНАК: все попытки исчерпаны");
}

/** Public API (no auth) */
export async function crptPost(path: string, body: unknown): Promise<unknown> {
  return request(`${PUBLIC_BASE_URL}${path}`, "POST", body);
}

/** Authenticated API */
export async function crptAuthGet(path: string): Promise<unknown> {
  const token = getToken();
  if (!token) throw new Error("CHESTNYZNAK_TOKEN не задан. Установите переменную окружения.");
  return request(`${getAuthBaseUrl()}${path}`, "GET", undefined, token);
}

export async function crptAuthPost(path: string, body: unknown): Promise<unknown> {
  const token = getToken();
  if (!token) throw new Error("CHESTNYZNAK_TOKEN не задан. Установите переменную окружения.");
  return request(`${getAuthBaseUrl()}${path}`, "POST", body, token);
}

export function hasToken(): boolean {
  return !!getToken();
}
