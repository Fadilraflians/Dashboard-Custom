import SlicedDataPage from "./index";
import { DOWNLOAD_FILE_PAGE_CONFIG } from "./portalPages";
import type { ReactNode } from "react";

export function SharedCardBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default function DownloadFilePage() {
  return <SlicedDataPage config={DOWNLOAD_FILE_PAGE_CONFIG} />;
}
