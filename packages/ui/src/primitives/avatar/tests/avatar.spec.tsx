import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Avatar, type AvatarColor, AvatarGroup } from "../avatar.js";

const COLORS: AvatarColor[] = [
  "teal",
  "purple",
  "amber",
  "blue",
  "pink",
  "red",
];

describe("Avatar", () => {
  afterEach(() => cleanup());

  it("defaults to size 32 and the teal color, rendering initials", () => {
    const { container } = render(<Avatar>AL</Avatar>);
    const avatar = container.querySelector(".ui-avatar");
    expect(avatar?.getAttribute("data-size")).toBe("32");
    expect(avatar?.getAttribute("data-color")).toBe("teal");
    expect(avatar?.textContent).toBe("AL");
  });

  it("maps the smaller size to data-size", () => {
    const { container } = render(<Avatar size={24}>AL</Avatar>);
    expect(
      container.querySelector(".ui-avatar")?.getAttribute("data-size"),
    ).toBe("24");
  });

  it("maps every color to data-color", () => {
    for (const color of COLORS) {
      const { container, unmount } = render(<Avatar color={color}>AL</Avatar>);
      expect(
        container.querySelector(".ui-avatar")?.getAttribute("data-color"),
      ).toBe(color);
      unmount();
    }
  });

  it("supports TailAdmin-compatible image size and status props", () => {
    const { container } = render(
      <Avatar
        alt="Avery Quinn"
        size="large"
        src="/avatar.png"
        status="online"
      />,
    );
    const avatar = container.querySelector(".ui-avatar");
    expect(avatar?.getAttribute("data-size")).toBe("large");
    expect(avatar?.getAttribute("data-status")).toBe("online");
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Avery Quinn",
    );
    expect(container.querySelector(".ui-avatar__status")).not.toBeNull();
  });
});

describe("AvatarGroup", () => {
  afterEach(() => cleanup());

  it("clamps to five avatars and renders an overflow chip", () => {
    const { container } = render(
      <AvatarGroup>
        {Array.from({ length: 9 }, (_, index) => (
          <Avatar key={index}>{`U${index}`}</Avatar>
        ))}
      </AvatarGroup>,
    );
    expect(container.querySelectorAll(".ui-avatar")).toHaveLength(5);
    const overflow = container.querySelector(".ui-avatar-group__overflow");
    expect(overflow?.textContent).toBe("+4");
  });

  it("omits the overflow chip when within the max", () => {
    const { container } = render(
      <AvatarGroup>
        {Array.from({ length: 5 }, (_, index) => (
          <Avatar key={index}>{`U${index}`}</Avatar>
        ))}
      </AvatarGroup>,
    );
    expect(container.querySelectorAll(".ui-avatar")).toHaveLength(5);
    expect(container.querySelector(".ui-avatar-group__overflow")).toBeNull();
  });
});
