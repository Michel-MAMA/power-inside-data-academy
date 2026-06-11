import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import DomainsSection from '@/components/landing/DomainsSection';
import FormationsSection from '@/components/landing/FormationsSection';
import ParcoursSection from '@/components/landing/ParcoursSection';
import MethodSection from '@/components/landing/MethodSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import FAQSection from '@/components/landing/FAQSection';
import PremiumFooter from '@/components/landing/PremiumFooter';

// ISR : les sections dynamiques (formations, parcours, FAQ — Supabase)
// se régénèrent toutes les 5 minutes.
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <HeroSection />
        <DomainsSection />
        <FormationsSection />
        <ParcoursSection />
        <MethodSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </main>
      <PremiumFooter />
    </>
  );
}
