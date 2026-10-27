import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getSession } from "@/lib/session";
import LandingContent from "./LandingContent";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  return <LandingContent userName={session?.name ?? "Pengguna"} />;
}
