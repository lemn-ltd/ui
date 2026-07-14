import { beforeEach } from 'vitest';

import { installLocalStorageStub } from './tests/helpers/local-storage';
import { installResizeObserverStub } from './tests/helpers/resize-observer';

// Install a fresh in-memory localStorage before every test so component mounts
// that persist state (theme runtime, ScreenShell dock) get an isolated store.
beforeEach(() => {
  installLocalStorageStub();
  installResizeObserverStub();
});
