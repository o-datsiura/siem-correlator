import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/index.css";

import { App } from "@/App";

console.info(
  `%c SIEM Correlator %c v${__APP_VERSION__} `,
  "background: #06b6d4; color: #020617; font-weight: 700; padding: 2px 6px; border-radius: 3px 0 0 3px;",
  "background: #0f172a; color: #22d3ee; font-weight: 700; padding: 2px 6px; border-radius: 0 3px 3px 0; border: 1px solid #06b6d4;",
);

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
