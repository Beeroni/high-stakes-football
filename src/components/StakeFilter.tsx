import type { StakeType } from "@/data/leagues";

export type StakeFilterValue = "all" | StakeType;

const OPTIONS: { value: StakeFilterValue; label: string; dot: string }[] = [
  { value: "all", label: "All Matches", dot: "bg-foreground" },
  { value: "relegation", label: "Relegation Battle", dot: "bg-relegation" },
  { value: "title", label: "Title / Promotion Race", dot: "bg-title" },
  { value: "continental", label: "Continental / European Spots", dot: "bg-continental" },
];

export function StakeFilter({
  value,
  onChange,
  counts,
}: {
  value: StakeFilterValue;
  onChange: (v: StakeFilterValue) => void;
  counts: Record<StakeFilterValue, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active
                ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--primary)]"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${o.dot}`} />
            {o.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[o.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
