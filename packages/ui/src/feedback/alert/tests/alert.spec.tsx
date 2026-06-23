import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Alert, type AlertVariant } from "../alert.js";

const VARIANTS: AlertVariant[] = ["success", "error", "warning", "info"];

describe("Alert", () => {
  afterEach(() => cleanup());

  it("maps every TailAdmin-compatible variant", () => {
    for (const variant of VARIANTS) {
      const { container, unmount } = render(
        <Alert
          message="Everything is wired."
          title="Ready"
          variant={variant}
        />,
      );
      expect(
        container.querySelector(".ui-alert")?.getAttribute("data-variant"),
      ).toBe(variant);
      unmount();
    }
  });

  it("renders the optional link with default text", () => {
    const { container } = render(
      <Alert
        message="Read the docs."
        showLink
        title="Heads up"
        variant="info"
      />,
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("#");
    expect(link?.textContent).toBe("Learn more");
  });
});
