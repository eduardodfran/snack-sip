import type { Metadata, Viewport } from "next";
import { Archivo, Courier_Prime } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Snack & Sip",
    template: "%s · Snack & Sip",
  },
  description:
    "Pre-order your Techno Fair snacks — flying saucer, siomai, siopao, waffle, and palamig. Pay with GCash, claim with QR.",
};

export const viewport: Viewport = {
  themeColor: "#ffce00",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${courierPrime.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
