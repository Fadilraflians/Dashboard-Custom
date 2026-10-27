import React from "react";
import { createRoot, type Root } from "react-dom/client";
import CustomDashboardPage from "./custom-dashboard/page";
import "../global.css";

const roots = new Map<Element, Root>();

export interface MountProps {
  sharedUrl?: string;
  shellUrl?: string;
  [key: string]: unknown;
}

export function mount(el: Element, _props?: MountProps): void {
  if (!el) return;
  let root = roots.get(el);
  if (!root) {
    root = createRoot(el);
    roots.set(el, root);
  }
  root.render(<CustomDashboardPage />);
}

export function unmount(el: Element): void {
  const root = roots.get(el);
  if (!root) return;
  root.unmount();
  roots.delete(el);
}

export default { mount, unmount };
