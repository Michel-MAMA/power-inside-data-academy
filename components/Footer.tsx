export default function Footer() {
    return (
        <footer className="border-t border-slate-800 bg-slate-950/90 px-6 py-10 sm:px-8 lg:px-12">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} Power Inside Data Academy. Tous droits réservés.</p>
                <p>Next.js · TypeScript · Tailwind · Formulaire API</p>
            </div>
        </footer>
    );
}
