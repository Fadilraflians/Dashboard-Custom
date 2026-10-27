"use client";

import React, { ReactNode } from "react";
import { SidebarProvider } from "./SidebarContext";
import { ToastProvider } from "./ToastContext";

interface ContextProviderProps {
  children: ReactNode;
}

export default function ContextProvider({
  children,
}: Readonly<ContextProviderProps>) {
  return (
    <SidebarProvider>
      <ToastProvider>{children}</ToastProvider>
    </SidebarProvider>
  );
}
