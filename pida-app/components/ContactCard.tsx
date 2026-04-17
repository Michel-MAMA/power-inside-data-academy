import { cn } from "@/lib/utils";

interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
  variant?: "blue" | "emerald" | "amber" | "purple";
  href?: string;
}

const variantMap = {
  blue: "bg-blue-dim border-blue-border text-blue",
  emerald: "bg-emerald-dim border-emerald/30 text-emerald",
  amber: "bg-amber-dim border-amber/30 text-amber",
  purple: "bg-purple-dim border-purple/30 text-purple",
};

export default function ContactCard({
  icon,
  title,
  value,
  sub,
  variant = "blue",
  href,
}: ContactCardProps) {
  const inner = (
    <div className="group flex items-start gap-4 p-5 bg-graphite border border-border rounded-xl hover:border-blue-border hover:translate-x-1 transition-all duration-200 cursor-pointer">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border", variantMap[variant])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-white-35 mb-1">{title}</p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
        {sub && <p className="text-xs text-white-35 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  }

  return inner;
}
