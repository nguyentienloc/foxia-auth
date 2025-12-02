import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "antd/dist/reset.css";
import { AppProviders } from "./providers/AppProviders";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
);
