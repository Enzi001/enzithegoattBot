import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indra Cyber Institute – Messenger Bot",
  description: "Facebook Messenger AI sales chatbot for Indra Cyber Institute",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
