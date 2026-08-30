const originalDebug = console.debug;

beforeEach(() => {
  console.debug = jest.fn();
});

afterEach(() => {
  console.debug = originalDebug;
});
