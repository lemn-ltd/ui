import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Badge, type BadgeTone } from "../badge.js";

const TONES: BadgeTone[] = [
  "neutral",
  "accent",
  "accent2",
  "success",
  "warn",
  "danger",
  "info",
  "dim",
];

describe("Badge", () => {
  afterEach(() => cleanup());

  it("defaults to the neutral tone with the dot off", () => {
    const { container } = render(<Badge>Live</Badge>);
    const badge = container.querySelector(".ui-badge");
    expect(badge?.getAttribute("data-tone")).toBe("neutral");
    expect(badge?.getAttribute("data-dot")).toBe("off");
    expect(badge?.textContent).toBe("Live");
  });

  it("maps every tone to data-tone", () => {
    for (const tone of TONES) {
      const { container, unmount } = render(<Badge tone={tone}>Tone</Badge>);
      expect(
        container.querySelector(".ui-badge")?.getAttribute("data-tone"),
      ).toBe(tone);
      unmount();
    }
  });

  it("turns the dot on with showDot", () => {
    const { container } = render(<Badge showDot>Live</Badge>);
    expect(container.querySelector(".ui-badge")?.getAttribute("data-dot")).toBe(
      "on",
    );
  });

  it("defaults to the subtle variant", () => {
    const { container } = render(<Badge>Live</Badge>);
    expect(
      container.querySelector(".ui-badge")?.getAttribute("data-variant"),
    ).toBe("subtle");
  });

  it("maps the soft variant to data-variant", () => {
    const { container } = render(
      <Badge tone="success" variant="soft">
        Live
      </Badge>,
    );
    const badge = container.querySelector(".ui-badge");
    expect(badge?.getAttribute("data-variant")).toBe("soft");
    expect(badge?.getAttribute("data-tone")).toBe("success");
  });

  it("supports TailAdmin-compatible color, size, and icon props", () => {
    const { container } = render(
      <Badge
        color="warning"
        endIcon={<span data-testid="end" />}
        size="sm"
        startIcon={<span data-testid="start" />}
        variant="solid"
      >
        Pending
      </Badge>,
    );
    const badge = container.querySelector(".ui-badge");
    expect(badge?.getAttribute("data-tone")).toBe("warn");
    expect(badge?.getAttribute("data-size")).toBe("sm");
    expect(badge?.getAttribute("data-variant")).toBe("solid");
    expect(container.querySelector('[data-testid="start"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="end"]')).not.toBeNull();
  });
});
