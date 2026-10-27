import React from "react";
import { createRoot } from "react-dom/client";
import Chatbot from "./app/Chatbot";
import "./styles.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <Chatbot />
    </React.StrictMode>,
  );
}