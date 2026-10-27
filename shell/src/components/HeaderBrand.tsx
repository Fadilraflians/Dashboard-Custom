"use client";

import { LayoutDashboard } from "lucide-react";
import { useAppChrome } from "@/context/AppChromeContext";
import "./header-brand.css";

/**
 * Header brand slot. Inside an application it shows the selected app's identity
 * (icon + name + organization), REPLACING the GovTech logo. On the landing page
 * (no appBrand) it falls back to the BNI GovTech logo.
 */
export default function HeaderBrand() {
  const { appBrand } = useAppChrome();

  if (appBrand) {
    return (
      <div className="headerAppBrand">
        <span className="headerAppIcon">
          {appBrand.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={appBrand.icon}
              alt={appBrand.name}
              width={24}
              height={24}
            />
          ) : (
            <LayoutDashboard size={20} />
          )}
        </span>
        <span className="headerAppText">
          <span className="headerAppName">{appBrand.name}</span>
          {appBrand.org && (
            <span className="headerAppOrg">{appBrand.org}</span>
          )}
        </span>
      </div>
    );
  }

  // Default: BNI GovTech logo.
  return (
    <span className="headerLogoPill">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-bni.webp"
        alt="BNI"
        className="headerLogoImg"
        width={40}
        height={28}
      />
      <span className="headerLogoDivider" />
      <span className="headerLogoText">
        <span className="headerLogoTop">GovTech</span>
        <span className="headerLogoSub">Access Service</span>
      </span>
    </span>
  );
}
