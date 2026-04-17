import Link from "next/link";

const links = [
    { href: "/", label: "Accueil" },
    { href: "/contact", label: "Contact" },
];

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
                <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-white">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">PIDA</span>
                    Power Inside Data
                </Link>
                <nav className="flex items-center gap-4 text-sm text-slate-300">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} className="transition hover:text-white">
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}
