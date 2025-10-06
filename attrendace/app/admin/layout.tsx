import type { Metadata } from "next";
import "../globals.css";
import Dashboard from "@/components/Dashboard";
import { ReactQueryProvider } from "@/lib/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { UserProvider } from "@/context/UserContext";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Attendace | Admin",
  description: "Attendances and leave management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const cookieStore = cookies();
  const access_token = (await cookieStore).get("access_token")?.value || "";

  return (
    <ReactQueryProvider pageProps={{}}>
      <AuthProvider>
        <UserProvider token={access_token}>
          <Dashboard>{children}</Dashboard>
        </UserProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
