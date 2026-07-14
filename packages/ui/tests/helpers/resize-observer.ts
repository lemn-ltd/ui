export function installResizeObserverStub(width = 800, height = 320): void {
  class ResizeObserverStub implements ResizeObserver {
    readonly #callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.#callback = callback;
    }

    observe(target: Element): void {
      const size: ResizeObserverSize = { blockSize: height, inlineSize: width };
      const entry: ResizeObserverEntry = {
        borderBoxSize: [size],
        contentBoxSize: [size],
        contentRect: new DOMRectReadOnly(0, 0, width, height),
        devicePixelContentBoxSize: [size],
        target,
      };
      this.#callback([entry], this);
    }

    disconnect(): void {}
    unobserve(): void {}
  }

  globalThis.ResizeObserver = ResizeObserverStub;
}
