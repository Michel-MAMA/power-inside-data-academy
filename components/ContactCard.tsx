type ContactCardProps = {
    title: string;
    value: string;
    icon: string;
};

export default function ContactCard({ title, value, icon }: ContactCardProps) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-1 hover:border-sky-500/30 hover:bg-slate-900 shadow-glow">
            <div className="mb-4 text-3xl">{icon}</div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{title}</p>
            <p className="mt-3 text-base font-semibold text-white">{value}</p>
        </div>
    );
}
