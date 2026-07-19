import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
const telemetryAllowed = !["/auth/callback"].includes(
  window.location.pathname,
);

if (!root) {
  throw new Error("Cumulus could not find the application root.");
}

createRoot(root).render(
  <StrictMode>
    <App />
    {telemetryAllowed ? (
      <>
        <Analytics />
        <SpeedInsights />
      </>
    ) : null}
  </StrictMode>,
);
