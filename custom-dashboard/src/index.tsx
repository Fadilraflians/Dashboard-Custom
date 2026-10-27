import { createRoot } from "react-dom/client";
import CustomDashboardPage from "./app/custom-dashboard/page";
import "./global.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<CustomDashboardPage />);
}
