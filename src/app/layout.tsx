import type { Metadata, Viewport } from "next";
import { Geist_Mono, Lora, Source_Sans_3 } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "SendaLore – Geschichten, die deinen Weg begleiten",
  description:
    "Audiotouren für Natur, Kultur und kleine Abenteuer. Die Geschichten starten automatisch dort, wo du gerade stehst. Ohne App.",
  appleWebApp: { title: "SendaLore" },
};

export const viewport: Viewport = {
  themeColor: "#b6672a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${sourceSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
