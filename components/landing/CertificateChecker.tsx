'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface VerifyResult {
  is_valid: boolean;
  student_name: string;
  formation_title: string;
  issued_at: string;
  expires_at: string | null;
  status: string;
}

/** Vérification publique d'un certificat via la fonction SQL verify_certificate. */
export default function CertificateChecker() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null | 'not_found'>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('verify_certificate', {
        p_code: code.trim(),
      });
      if (error) throw error;
      setResult((data?.[0] as VerifyResult) ?? 'not_found');
    } catch {
      setResult('not_found');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={check} className="flex gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="PIDA-2026-XXXXXXXX"
          className="h-12 flex-1 rounded-xl border border-slate-200 px-4 font-mono text-sm uppercase tracking-wider focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="h-12 rounded-xl bg-blue-600 px-6 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Vérifier'}
        </button>
      </form>

      {result === 'not_found' && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          ✕ Aucun certificat trouvé pour ce code. Vérifiez la saisie (format
          PIDA-AAAA-XXXXXXXX).
        </div>
      )}

      {result && result !== 'not_found' && (
        <div
          className={`mt-6 rounded-xl border p-6 ${
            result.is_valid
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p className={`text-sm font-bold ${result.is_valid ? 'text-emerald-700' : 'text-amber-700'}`}>
            {result.is_valid
              ? '✓ Certificat authentique et valide'
              : result.status === 'revoked'
              ? '⚠ Certificat révoqué'
              : '⚠ Certificat expiré'}
          </p>
          <dl className="mt-4 space-y-1.5 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Titulaire</dt>
              <dd className="font-semibold">{result.student_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Formation</dt>
              <dd className="font-semibold">{result.formation_title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Délivré le</dt>
              <dd>{new Date(result.issued_at).toLocaleDateString('fr-FR')}</dd>
            </div>
            {result.expires_at && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Expire le</dt>
                <dd>{new Date(result.expires_at).toLocaleDateString('fr-FR')}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
