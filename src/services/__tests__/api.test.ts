import { fetchJson, sanitizeUrl } from '../api';

describe('sanitizeUrl', () => {
  it('trims whitespace and strips trailing slashes', () => {
    expect(sanitizeUrl('  https://example.com///  ')).toBe('https://example.com');
  });

  it('prepends http when scheme is missing', () => {
    expect(sanitizeUrl('example.com/path/')).toBe('http://example.com/path');
  });

  it('returns empty string for blank input', () => {
    expect(sanitizeUrl('   ')).toBe('');
  });
});

describe('fetchJson', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns parsed json and sets default json headers', async () => {
    const json = { ok: true };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(json),
    } as any);

    await expect(fetchJson<typeof json>('https://example.com')).resolves.toEqual(json);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('throws server error text on failed response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('Boom'),
    } as any);

    await expect(fetchJson('https://example.com')).rejects.toThrow('Boom');
  });

  it('falls back to status message when error text is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue(''),
    } as any);

    await expect(fetchJson('https://example.com')).rejects.toThrow('Request failed with status 404');
  });
});
