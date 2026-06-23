import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button, type ButtonVariant } from "../button.js";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "ghost",
  "outline",
  "danger",
  "ghost-danger",
];

describe("Button", () => {
  afterEach(() => cleanup());

  it("defaults to the primary variant and button type", () => {
    const { container } = render(<Button>Save</Button>);
    const button = container.querySelector("button");
    expect(button?.getAttribute("data-variant")).toBe("primary");
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.className).toContain("ui-button");
  });

  it("maps every variant to data-variant", () => {
    for (const variant of VARIANTS) {
      const { container, unmount } = render(
        <Button variant={variant}>Action</Button>,
      );
      expect(
        container.querySelector("button")?.getAttribute("data-variant"),
      ).toBe(variant);
      unmount();
    }
  });

  it("forwards disabled", () => {
    const { container } = render(<Button disabled>Save</Button>);
    expect(container.querySelector("button")?.disabled).toBe(true);
  });

  it("supports TailAdmin-compatible size and icon props", () => {
    const { container } = render(
      <Button
        endIcon={<span data-testid="end" />}
        size="sm"
        startIcon={<span data-testid="start" />}
      >
        Save
      </Button>,
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("data-size")).toBe("sm");
    expect(container.querySelector('[data-testid="start"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="end"]')).not.toBeNull();
  });
});
