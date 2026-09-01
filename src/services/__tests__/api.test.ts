import { fetchJson, parseNdjsonPayload, sanitizeUrl } from "../api";

describe("sanitizeUrl", () => {
  it("trims whitespace and strips trailing slashes", () => {
    expect(sanitizeUrl("  https://example.com///  ")).toBe(
      "https://example.com",
    );
  });

  it("prepends http when scheme is missing", () => {
    expect(sanitizeUrl("example.com/path/")).toBe("http://example.com/path");
  });

  it("returns empty string for blank input", () => {
    expect(sanitizeUrl("   ")).toBe("");
  });
});

describe("fetchJson", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns parsed json and sets default json headers", async () => {
    const json = { ok: true };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(json),
    } as any);

    await expect(
      fetchJson<typeof json>("https://example.com"),
    ).resolves.toEqual(json);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("uses response.json when no text is available", async () => {
    const json = { ok: true };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: jest.fn().mockReturnValue("application/json") },
      json: jest.fn().mockResolvedValue(json),
      text: undefined,
    } as any);

    await expect(fetchJson("https://example.com")).resolves.toEqual(json);
  });

  it("returns an empty object when the server responds with no content", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: jest.fn().mockReturnValue("text/plain") },
      text: jest.fn().mockResolvedValue("   "),
      json: jest.fn(),
    } as any);

    await expect(fetchJson("https://example.com")).resolves.toEqual({});
  });

  it("throws a clear error for invalid JSON or malformed NDJSON payloads", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: jest.fn().mockReturnValue("application/json") },
      text: jest.fn().mockResolvedValue("not-json"),
      json: jest.fn(),
    } as any);

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "Invalid JSON response from server: not-json",
    );

    expect(() => parseNdjsonPayload("not-json")).toThrow(
      "Invalid JSON response from server: not-json",
    );
  });

  it("throws server error text on failed response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue("Boom"),
    } as any);

    await expect(fetchJson("https://example.com")).rejects.toThrow("Boom");
  });

  it("prefers parsed error fields when a failed response contains JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('{"message":"From JSON"}'),
    } as any);

    await expect(fetchJson("https://example.com")).rejects.toThrow("From JSON");
  });

  it("falls back to status message when error text is empty", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue(""),
    } as any);

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "Request failed with status 404",
    );
  });

  it("parses ndjson payloads from streaming responses", async () => {
    const payload =
      '{"message":{"content":"Hel"}}\n{"message":{"content":"lo"}}\n';

    expect(parseNdjsonPayload(payload)).toEqual({ message: { content: "lo" } });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: jest.fn().mockReturnValue("application/x-ndjson") },
      text: jest.fn().mockResolvedValue(payload),
    } as any);

    await expect(fetchJson("https://example.com")).resolves.toEqual({
      message: { content: "lo" },
    });
  });
});
