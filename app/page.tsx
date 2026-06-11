import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import DomainsSection from '@/components/landing/DomainsSection';
import FormationsSection from '@/components/landing/FormationsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PremiumFooter from '@/components/landing/PremiumFooter';

// ISR : la landing (dont les formations phares) se régénère toutes les 5 min.
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <HeroSection />
        <DomainsSection />
        <FormationsSection />
        <TestimonialsSection />
      </main>
      <PremiumFooter />
    </>
  );
}
