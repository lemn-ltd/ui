import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandStudio } from "../brand-studio.js";
import { createBrandFromPreset } from "../presets.js";
import type { BrandStudioIntent } from "../types.js";

afterEach(cleanup);

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
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
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
