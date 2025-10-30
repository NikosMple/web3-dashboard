import "../styles/globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Web3 Auth Dashboard",
  description: "Sign-In With Ethereum example using NestJS + Next.js",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#f9fafb",
          color: "#111827",
        }}
      >
        {children}
      </body>
    </html>
  );
}
