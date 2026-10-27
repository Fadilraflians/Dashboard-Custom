import SlicedDataPage from "./index";
import { CHECK_DUPLIKASI_RPD_PAGE_CONFIG } from "./portalPages";
import type { ReactNode } from "react";

export function SharedCardBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default function CheckDuplikasiRpdPage() {
  return <SlicedDataPage config={CHECK_DUPLIKASI_RPD_PAGE_CONFIG} />;
}
