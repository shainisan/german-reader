import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "German Reader",
  description: "Read German articles bilingually with side-by-side translations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
