import type { Metadata } from "next";
import "../globals.css";
import Dashboard from "@/components/Dashboard";
import { ReactQueryProvider } from "@/lib/react-query";
import { AuthProvider } from "@/context/AuthContext";
export const metadata: Metadata = {
  title: "Attendace | Worker",
  description: "Attendances and leave management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <html lang="en">
    //   <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
    <ReactQueryProvider  pageProps={{}}>
      <AuthProvider>
      <Dashboard>{children}</Dashboard>
      </AuthProvider>
    </ReactQueryProvider>

    //   </body>
    // </html>
  );
}
