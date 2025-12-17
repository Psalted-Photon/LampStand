import type { Metadata } from "next";
import { Milonga, Libre_Baskerville, Cinzel } from "next/font/google";
import "./globals.css";

const milonga = Milonga({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-milonga",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-baskerville",
});

const cinzel = Cinzel({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "Lampstand",
  description: "News & Bible Explorer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${milonga.variable} ${libreBaskerville.variable} ${cinzel.variable} antialiased`}
        style={{ fontFamily: 'var(--font-baskerville)' }}
      >
        {children}
      </body>
    </html>
  );
}
