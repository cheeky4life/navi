import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/app.css";

console.log("=== NAVI Loading ===");
console.log("React:", React);
console.log("Root element:", document.getElementById("root"));

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("❌ Root element not found!");
  } else {
    console.log("✅ Root element found, creating React root...");
    const root = createRoot(rootElement);
    console.log("✅ Rendering App component...");
    root.render(<App />);
    console.log("✅ App rendered successfully!");
  }
} catch (error) {
  console.error("❌ Error rendering app:", error);
  document.body.innerHTML = `<div style="color: white; padding: 20px; font-family: monospace; background: #ef4444;">
    <h1>Error Loading NAVI</h1>
    <pre>${error.message}\n${error.stack}</pre>
  </div>`;
}
