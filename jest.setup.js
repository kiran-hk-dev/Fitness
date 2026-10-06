// Shared test setup.
//
// AsyncStorage is a native module, so anything importing src/theme (which
// persists the chosen theme) crashes without this mock. Previously every test
// file carried its own copy of this; one global mock is the right home for it.
//
// The `mock` prefix is required: jest hoists jest.mock() above the imports and
// only allows out-of-scope variables whose names start with "mock".
const mockStore = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k) => (mockStore.has(k) ? mockStore.get(k) : null)),
    setItem: jest.fn(async (k, v) => {
      mockStore.set(k, v);
    }),
    removeItem: jest.fn(async (k) => {
      mockStore.delete(k);
    }),
    clear: jest.fn(async () => {
      mockStore.clear();
    }),
  },
}));

beforeEach(() => {
  mockStore.clear();
});