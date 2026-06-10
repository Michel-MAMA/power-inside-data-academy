import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/services/dashboard';
import ProfileForm from '@/components/dashboard/ProfileForm';

export const metadata = { title: 'Mon profil | PIDA' };

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ces informations apparaissent sur vos certificats et factures.
        </p>
      </header>
      <ProfileForm profile={profile} />
    </main>
  );
}
