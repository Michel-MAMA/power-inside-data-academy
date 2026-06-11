import LandingNavbar from '@/components/landing/LandingNavbar';
import PremiumFooter from '@/components/landing/PremiumFooter';

export const metadata = { title: 'Formations' };

export default function FormationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LandingNavbar />
      {children}
      <PremiumFooter />
    </>
  );
}
