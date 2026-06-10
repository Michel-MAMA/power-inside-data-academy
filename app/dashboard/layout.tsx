import Link from 'next/link';
import { signOutAction } from '@/app/actions/auth';

export const metadata = { title: 'Mon espace | PIDA' };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-bold uppercase tracking-widest text-slate-900">
            Power Inside <span className="text-blue-600">Data</span>
          </Link>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Tableau de bord
            </Link>
            <Link href="/formations" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Catalogue
            </Link>
            <Link href="/dashboard/profile" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Profil
            </Link>
            <form action={signOutAction}>
              <button className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
