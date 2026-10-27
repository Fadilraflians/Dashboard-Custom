import React from "react";
import { createRoot, type Root } from "react-dom/client";
import Chatbot from "./Chatbot";
import "../styles.css";

const roots = new Map<Element, Root>();

export function mount(element: Element): void {
  if (!element) return;
  let root = roots.get(element);
  if (!root) {
    root = createRoot(element);
    roots.set(element, root);
  }
  root.render(<Chatbot />);
}

export function unmount(element: Element): void {
  const root = roots.get(element);
  if (!root) return;
  root.unmount();
  roots.delete(element);
}

export default { mount, unmount };