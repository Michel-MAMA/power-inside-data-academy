import InfoShell from '@/components/landing/InfoShell';
import CertificateChecker from '@/components/landing/CertificateChecker';

export const metadata = { title: 'Vérifier un certificat' };

export default function VerificationCertificatPage() {
  return (
    <InfoShell
      eyebrow="Certification"
      title="Vérifier un certificat."
      intro="Recruteurs, employeurs : saisissez le code figurant sur le certificat (format PIDA-AAAA-XXXXXXXX) pour en vérifier l'authenticité en temps réel."
    >
      <CertificateChecker />
    </InfoShell>
  );
}
