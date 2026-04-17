import type { Metadata } from "next";
import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Power Inside Data Academy",
    template: "%s | Power Inside Data Academy",
  },
  description:
    "Formez-vous aux métiers de la Data, l'IA et le Cloud avec des experts terrain. Formations certifiantes, accompagnement personnalisé.",
  keywords: ["data", "IA", "machine learning", "formation", "data engineering", "power bi", "cloud"],
  authors: [{ name: "Power Inside Data Academy" }],
  creator: "Power Inside Data Academy",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://powerinsidedata.com",
    siteName: "Power Inside Data Academy",
    title: "Power Inside Data Academy",
    description: "Formez-vous aux métiers de la Data, l'IA et le Cloud avec des experts terrain.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Power Inside Data Academy",
    description: "Formez-vous aux métiers de la Data, l'IA et le Cloud avec des experts terrain.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
