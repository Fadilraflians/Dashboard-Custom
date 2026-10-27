import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles/theme.css";

// Standalone preview only (http://localhost:9000). Consumers of this remote
// never load this file; they use the modules exposed in webpack.config.cjs.
// The gallery is a lazy chunk so it stays out of the entry bundle.
const Gallery = React.lazy(() => import("./preview/Gallery"));

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <Suspense
      fallback={
        <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>Shared UI</h1>
          <p style={{ color: "#667085", fontSize: 13 }}>Memuat galeri komponen…</p>
        </main>
      }
    >
      <Gallery />
    </Suspense>,
  );
}
