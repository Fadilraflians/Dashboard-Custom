import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import HomeButton from "@/components/HomeButton";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import HeaderBreadcrumb from "@/components/HeaderBreadcrumb";
import HeaderBrand from "@/components/HeaderBrand";
import { AppChromeProvider } from "@/context/AppChromeContext";
import "./layout.css";

export const dynamic = "force-dynamic";

/**
 * Protected layout — auth gate + header. No sidebar here; the sidebar is added
 * by the nested /app/ layout for MFE pages. Landing stays header-only.
 */
export default async function ProtectedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!session) {
    redirect("/login");
  }

  return (
    <AppChromeProvider>
      <div className="shell">
        <header className="header">
          <div className="headerLeft">
            <div className="headerBrand">
              <HeaderBrand />
            </div>
            <HeaderBreadcrumb />
          </div>
          <div className="headerUser">
            <HomeButton />
            <ThemeToggle />
            <UserMenu name={session.name} email={session.email} />
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </AppChromeProvider>
  );
}
