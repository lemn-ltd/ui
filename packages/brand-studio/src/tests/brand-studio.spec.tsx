import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BrandProject } from "@lemn-ltd/brand-contract";
import { BrandStudio } from "../brand-studio.js";
import { createBrandFromPreset } from "../presets.js";
import type { BrandStudioIntent } from "../types.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BrandStudio", () => {
  it("renders a controlled, scoped preview without network or persistence ownership", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    function Harness() {
      const [value, setValue] = useState(() => createBrandFromPreset("aster-vault"));
      return <BrandStudio onChange={setValue} value={value} />;
    }
    const view = render(<Harness />);

    await waitFor(() => expect(view.container.querySelector("[data-lemn-brand-scope]")).not.toBeNull());
    expect(screen.getByRole("heading", { name: "Aster Vault" })).toBeTruthy();
    expect(screen.getByLabelText("Typography specimen").querySelector("code")?.textContent).toContain("appointment.status");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("selects a governed managed Body font, normalizes capabilities, and compiles the live specimen without fetching from Studio", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    let observed: BrandProject = createBrandFromPreset("aster-vault");

    function Harness() {
      const [value, setValue] = useState(observed);
      return <BrandStudio onChange={(next) => { observed = next; setValue(next); }} value={value} />;
    }

    const view = render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Typography/ }));
    fireEvent.change(screen.getByLabelText("Body font"), { target: { value: "managed.inter" } });

    await waitFor(() => expect(observed.profiles.core?.typography?.body).toMatchObject({
      source: "managed",
      ref: "managed.inter",
      fidelity: "preferred",
      emergencyFallbackRef: "system.ui",
      weights: [400, 500, 600],
      styles: ["normal"]
    }));
    const bodySettings = screen.getByLabelText("Body font settings");
    expect(bodySettings.textContent).toContain("OFL-1.1");
    expect(bodySettings.textContent).toContain("Copyright 2020 The Inter Project Authors");
    expect(bodySettings.querySelector("a[href*='/licenses/inter/']")?.getAttribute("href")).toBe(
      "https://fonts.ui.le-mn.com/v2/licenses/inter/5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57/OFL.txt"
    );
    expect(bodySettings.querySelector("a[href*='github.com/google/fonts/tree']")?.getAttribute("href")).toBe(
      "https://github.com/google/fonts/tree/0b58fb370093f9a9f4ff785d94405710b79de67c/ofl/inter"
    );
    expect(bodySettings.textContent).toMatch(/≈ \d+ KB/);

    fireEvent.change(screen.getByLabelText("Body fidelity"), { target: { value: "required" } });
    fireEvent.change(screen.getByLabelText("Body emergency fallback"), { target: { value: "system.serif" } });
    await waitFor(() => expect(observed.profiles.core?.typography?.body).toMatchObject({
      fidelity: "required",
      emergencyFallbackRef: "system.serif"
    }));

    await waitFor(() => {
      const criticalCss = view.container.querySelector("style[data-lemn-brand-critical='true']")?.textContent ?? "";
      expect(criticalCss).toContain("@font-face");
      expect(criticalCss).toContain("Lemn Managed Inter");
      expect(criticalCss).toContain("font-display: block");
    });
    expect(screen.getByLabelText("Typography specimen").querySelector("h2")).not.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps Heading inheritance explicit and stores typography once at profile level for light and dark", async () => {
    let observed: BrandProject = createBrandFromPreset("aster-vault");

    function Harness() {
      const [value, setValue] = useState(observed);
      return <BrandStudio onChange={(next) => { observed = next; setValue(next); }} value={value} />;
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Typography/ }));
    const heading = screen.getByLabelText("Heading font") as HTMLSelectElement;
    expect(heading.value).toBe("inherit.body");

    fireEvent.change(heading, { target: { value: "managed.lora" } });
    await waitFor(() => expect(observed.profiles.core?.typography?.heading).toMatchObject({
      source: "managed",
      ref: "managed.lora",
      weights: [600, 700],
      styles: ["normal"]
    }));
    expect(observed.profiles.core?.modes.light).not.toHaveProperty("typography");
    expect(observed.profiles.core?.modes.dark).not.toHaveProperty("typography");

    fireEvent.change(screen.getByLabelText("Heading font"), { target: { value: "inherit.body" } });
    await waitFor(() => expect(observed.profiles.core?.typography?.heading).toEqual({ source: "inherit", role: "body" }));
    expect(screen.getByText(/Same as Body · System UI/)).toBeTruthy();
  });

  it("applies a preset through onChange and emits typed publication intentions", async () => {
    const changes: string[] = [];
    const intents: BrandStudioIntent[] = [];
    function Harness() {
      const [value, setValue] = useState(() => createBrandFromPreset("aster-vault", { brandId: "demo-brand", name: "Demo Brand" }));
      return <BrandStudio
        hostStatus={{ state: "idle", expectedRevision: 3 }}
        onChange={(next) => { changes.push(next.profiles.core?.modes.light?.colors.accent ?? ""); setValue(next); }}
        onIntent={(intent) => { intents.push(intent); }}
        value={value}
      />;
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Starting point/ }));
    fireEvent.click(screen.getByRole("button", { name: /Verdant Ledger/ }));
    expect(changes.at(-1)).toBe("#087a55");

    await waitFor(() => expect(screen.getByRole("button", { name: "Plan publication" }).hasAttribute("disabled")).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Plan publication" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply approved plan" }));
    expect(intents.map((intent) => intent.type)).toEqual(["plan-publication", "apply-publication"]);
    expect(intents[1]).toMatchObject({ expectedRevision: 3 });
  });
});
