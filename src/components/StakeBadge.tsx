import type { StakeType } from "@/data/leagues";

const CONFIG: Record<StakeType, { label: string; icon: string; cls: string }> = {
  relegation: {
    label: "Relegation Battle",
    icon: "🔴",
    cls: "bg-relegation/15 text-relegation border-relegation/40",
  },
  title: {
    label: "Title / Promotion Race",
    icon: "🟡",
    cls: "bg-title/15 text-title border-title/40",
  },
  continental: {
    label: "Continental Spot",
    icon: "🔵",
    cls: "bg-continental/15 text-continental border-continental/40",
  },
};

export function StakeBadge({ type, label }: { type: StakeType; label?: string }) {
  const cfg = CONFIG[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}
    >
      <span>{cfg.icon}</span>
      <span>{label ?? cfg.label}</span>
    </span>
  );
}
