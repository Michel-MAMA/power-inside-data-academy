/** Logo réseau de neurones Power Inside Data Academy. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden>
      <circle cx="48" cy="14" r="4.5" fill="#1561FF" opacity="0.9" />
      <circle cx="76" cy="30" r="3.5" fill="#1561FF" opacity="0.75" />
      <circle cx="76" cy="66" r="4.5" fill="#1561FF" opacity="0.85" />
      <circle cx="48" cy="82" r="3.5" fill="#1561FF" opacity="0.68" />
      <circle cx="20" cy="66" r="4.5" fill="#1561FF" opacity="0.8" />
      <circle cx="20" cy="30" r="3.5" fill="#1561FF" opacity="0.7" />
      <line x1="48" y1="18" x2="48" y2="41" stroke="#1561FF" strokeWidth="0.8" opacity="0.5" />
      <line x1="73" y1="32" x2="53" y2="45" stroke="#1561FF" strokeWidth="0.8" opacity="0.5" />
      <line x1="73" y1="64" x2="53" y2="51" stroke="#1561FF" strokeWidth="0.8" opacity="0.5" />
      <line x1="48" y1="78" x2="48" y2="55" stroke="#1561FF" strokeWidth="0.8" opacity="0.5" />
      <line x1="23" y1="64" x2="43" y2="51" stroke="#1561FF" strokeWidth="0.8" opacity="0.5" />
      <line x1="23" y1="32" x2="43" y2="45" stroke="#1561FF" strokeWidth="0.8" opacity="0.5" />
      <circle cx="48" cy="48" r="9" fill="rgba(21,97,255,0.15)" />
      <circle cx="48" cy="48" r="5.5" fill="#1561FF" />
      <circle cx="48" cy="48" r="2.5" fill="white" opacity="0.9" />
    </svg>
  );
}

export function LogoText({ light = false }: { light?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span
        className={`font-[family-name:var(--font-jakarta)] text-[12px] font-bold uppercase tracking-[0.18em] ${
          light ? 'text-white' : 'text-slate-900'
        }`}
      >
        Power Inside Data
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-blue-600">
        Academy
      </span>
    </span>
  );
}
