import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
    title: "Power Inside Data Academy — LangChain & LLMs",
    description: "Landing moderne pour la formation LangChain & LLMs en production, avec contact et formulaire intégré.",
    openGraph: {
        title: "Power Inside Data Academy",
        description: "Landing moderne pour la formation LangChain & LLMs en production.",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr">
            <body>{children}</body>
        </html>
    );
}
