import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import '@/styles/globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        template: '%s | Power Inside Data Academy',
        default: 'Power Inside Data Academy — Formations Data · IA · Cloud · BI',
    },
    description:
        "Former les leaders de la Data, de l'IA et du Cloud. Formations certifiantes conçues par des experts terrain : Machine Learning, Data Engineering, Power BI, Azure.",
    keywords: ['Data', 'IA', 'Cloud', 'Power BI', 'Formation', 'Machine Learning', 'Data Engineering'],
    openGraph: {
        title: 'Power Inside Data Academy',
        description: "Former les leaders de la Data, de l'IA et du Cloud.",
        type: 'website',
        url: 'https://power-inside-data-academy.vercel.app',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" className={`${inter.variable} ${jakarta.variable}`}>
            <body className="bg-white font-[family-name:var(--font-inter)] text-slate-900 antialiased">
                <AuthProvider>
                    <ToastProvider />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
