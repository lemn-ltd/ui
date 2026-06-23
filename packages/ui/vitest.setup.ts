import { beforeEach } from 'vitest';

import { installLocalStorageStub } from './tests/helpers/local-storage';

// Install a fresh in-memory localStorage before every test so component mounts
// that persist state (theme runtime, ScreenShell dock) get an isolated store.
beforeEach(() => {
  installLocalStorageStub();
});
