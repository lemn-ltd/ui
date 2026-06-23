// happy-dom in this workspace does not ship a localStorage implementation, so
// tests install an in-memory stub (the pattern apps/app uses for its shell
// persistence specs). Components that read localStorage on mount — theme
// runtime, ScreenShell dock persistence — need this present before render.
export function installLocalStorageStub(): void {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
}
