import { createRoot } from "react-dom/client";
import { applyTheme, getTheme, setTheme } from "@lemn-ltd/ui";
import "@lemn-ltd/ui/styles.css";
import "@lemn-ltd/showcase-kit/styles.css";
import "./styles.css";
import { UiShowcaseApp } from "./ui-showcase-app";

// A first visit is light by default. Once a visitor uses the theme control,
// their explicit light/dark choice remains authoritative.
const initialTheme = getTheme();
if (initialTheme === "system") setTheme("light");
else applyTheme(initialTheme);

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(<UiShowcaseApp />);
