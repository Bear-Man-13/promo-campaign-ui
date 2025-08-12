// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

const iconSvg =
  '%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 viewBox%3D%220 0 32 32%22%3E%3Crect width%3D%2232%22 height%3D%2232%22 rx%3D%228%22 fill%3D%22%23111%22/%3E%3Ctext x%3D%2216%22 y%3D%2221%22 text-anchor%3D%22middle%22 font-family%3D%22Arial%2C%20sans-serif%22 font-size%3D%2216%22 fill%3D%22white%22%3EP%3C/text%3E%3C/svg%3E';

export const metadata: Metadata = {
  title: "Promo Builder Mock",
  icons: { icon: `data:image/svg+xml,${iconSvg}` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}