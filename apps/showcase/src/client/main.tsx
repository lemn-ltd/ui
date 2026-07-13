import { createRoot } from "react-dom/client";
import { getTheme, setTheme } from "@appranks/ui";
import "@appranks/ui/styles.css";
import "@appranks/showcase-kit/styles.css";
import "./styles.css";
import { UiShowcaseApp } from "./ui-showcase-app";

// A first visit is light by default. Once a visitor uses the theme control,
// their explicit light/dark choice remains authoritative.
if (getTheme() === "system") setTheme("light");

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(<UiShowcaseApp />);
