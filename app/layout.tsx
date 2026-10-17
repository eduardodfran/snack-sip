import type { Metadata, Viewport } from "next";
import { Chango, Montserrat } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const chango = Chango({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-chango",
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
  themeColor: "#0d4fa3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${chango.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
