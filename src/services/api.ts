export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  const hasText = typeof response.text === 'function';
  const hasJson = typeof response.json === 'function';
  const text = hasText ? await response.text() : '';
  const trimmed = text.trim();

  console.debug('[HomeAI] fetchJson response', {
    url,
    ok: response.ok,
    status: response.status,
    contentType: response.headers?.get?.('content-type') ?? 'unknown',
    payloadPreview: trimmed.slice(0, 500),
  });

  if (!response.ok) {
    const parsedError = parseJsonPayload(trimmed);
    const serverMessage = typeof parsedError?.error === 'string'
      ? parsedError.error
      : typeof parsedError?.message === 'string'
        ? parsedError.message
        : typeof parsedError?.detail === 'string'
          ? parsedError.detail
          : trimmed || `Request failed with status ${response.status}`;
    throw new Error(serverMessage);
  }

  if (hasJson && !hasText) {
    return (await response.json()) as T;
  }

  if (!trimmed) {
    return {} as T;
  }

  const contentType = response.headers?.get?.('content-type') ?? '';
  if (/ndjson|x-ndjson|json-seq/i.test(contentType) || looksLikeNdjson(trimmed)) {
    return parseNdjsonPayload(trimmed) as T;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const snippet = trimmed.slice(0, 200);
    throw new Error(`Invalid JSON response from server: ${snippet}`);
  }
}

export function parseNdjsonPayload(raw: string): Record<string, unknown> | null {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: Record<string, unknown>[] = [];
  for (const line of lines) {
    try {
      const value = JSON.parse(line) as Record<string, unknown>;
      parsed.push(value);
    } catch {
      // Ignore partial or malformed NDJSON lines and keep the valid ones.
    }
  }

  if (!parsed.length) {
    throw new Error(`Invalid JSON response from server: ${raw.slice(0, 200)}`);
  }

  return parsed[parsed.length - 1] ?? null;
}

function looksLikeNdjson(raw: string): boolean {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return false;
  return lines.every((line) => line.startsWith('{') || line.startsWith('['));
}

function parseJsonPayload(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function sanitizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, '');
  return `http://${trimmed.replace(/\/+$/, '')}`;
}
