jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

describe('storage', () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: localStorageMock },
      configurable: true,
    });
  });

  it('uses localStorage on web', async () => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'web' } }));
    const { storage } = await import('../storage');
    localStorageMock.getItem.mockReturnValue('value');

    await expect(storage.getItem('k')).resolves.toBe('value');
    await storage.setItem('k', 'v');

    expect(localStorageMock.getItem).toHaveBeenCalledWith('k');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('k', 'v');
  });

  it('uses AsyncStorage on native', async () => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default as unknown as {
      getItem: jest.Mock;
      setItem: jest.Mock;
    };
    AsyncStorage.getItem.mockResolvedValue('native');
    const { storage } = await import('../storage');

    await expect(storage.getItem('k')).resolves.toBe('native');
    await storage.setItem('k', 'v');

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('k');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('k', 'v');
  });
});
