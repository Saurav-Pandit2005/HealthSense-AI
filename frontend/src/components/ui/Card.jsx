export function Card({ title, eyebrow, icon: Icon, actions, children, className = "" }) {
  return (
    <div className={`bg-surface rounded-2xl shadow-card border border-black/[0.04] p-6 ${className}`}>
      {(title || Icon) && (
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            {eyebrow && <p className="text-[11px] font-mono tracking-wider uppercase text-brand-400 mb-1">{eyebrow}</p>}
            {title && (
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                {Icon && <Icon size={19} className="text-brand-500" strokeWidth={2.2} />}
                {title}
              </h2>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

const statTones = {
  brand: { text: "text-brand-600", bg: "bg-brand-50", ring: "ring-brand-100" },
  mint: { text: "text-mint-600", bg: "bg-mint-50", ring: "ring-mint-100" },
  coral: { text: "text-coral-500", bg: "bg-coral-50", ring: "ring-coral-100" },
  amber: { text: "text-amber-500", bg: "bg-amber-50", ring: "ring-amber-100" },
};

export function StatCard({ label, value, unit, icon: Icon, tone = "brand", sub }) {
  const t = statTones[tone] || statTones.brand;
  return (
    <div className="bg-surface rounded-xl border border-black/[0.04] shadow-card p-4 flex items-center gap-3 animate-fadeUp">
      <div className={`w-10 h-10 rounded-lg ${t.bg} ${t.text} flex items-center justify-center shrink-0 ring-1 ${t.ring}`}>
        {Icon && <Icon size={18} strokeWidth={2.2} />}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted uppercase tracking-wide truncate">{label}</p>
        <p className="font-mono text-xl font-bold text-ink leading-tight">
          {value ?? "—"}
          {unit && value !== null && value !== undefined && <span className="text-xs font-normal text-muted ml-1">{unit}</span>}
        </p>
        {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const badgeTones = {
  low: "bg-mint-50 text-mint-600 border-mint-100",
  moderate: "bg-amber-50 text-amber-500 border-amber-100",
  high: "bg-coral-50 text-coral-500 border-coral-100",
  neutral: "bg-brand-50 text-brand-600 border-brand-100",
};

export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeTones[tone] || badgeTones.neutral}`}>
      {children}
    </span>
  );
}
