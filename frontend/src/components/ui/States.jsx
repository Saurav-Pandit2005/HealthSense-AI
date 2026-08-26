import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center animate-fadeUp">
      <Loader2 size={28} className="text-brand-400 animate-spin mb-3" />
      <p className="text-sm text-muted font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({ label = "Nothing here yet.", action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
      <Inbox size={28} className="mb-2 opacity-50" />
      <p className="text-sm max-w-[32ch] mb-3">{label}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex items-start gap-2.5 bg-coral-50 border border-coral-100 text-coral-500 rounded-lg px-3.5 py-3 text-sm">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function InlineSkeleton({ className = "" }) {
  return <div className={`animate-pulse bg-black/[0.06] rounded-lg ${className}`} />;
}
