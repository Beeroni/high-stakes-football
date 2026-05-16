import { LEAGUES, type League } from "@/data/leagues";
import { Check } from "lucide-react";

interface Props {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSetAll: (ids: string[]) => void;
}

export function LeagueSidebar({ selected, onToggle, onSetAll }: Props) {
  const regions: League["region"][] = ["Europe", "Latin America", "Asia"];
  const allIds = LEAGUES.map((l) => l.id);

  return (
    <aside className="hidden h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-border bg-card/40 lg:block">
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Leagues
          </h2>
          <div className="flex gap-1 text-[10px]">
            <button
              onClick={() => onSetAll(allIds)}
              className="rounded bg-secondary px-2 py-1 font-semibold text-secondary-foreground hover:bg-accent"
            >
              All
            </button>
            <button
              onClick={() => onSetAll([])}
              className="rounded bg-secondary px-2 py-1 font-semibold text-secondary-foreground hover:bg-accent"
            >
              None
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {selected.size} of {LEAGUES.length} selected
        </p>
      </div>

      <div className="px-3 py-3">
        {regions.map((region) => {
          const leagues = LEAGUES.filter((l) => l.region === region);
          return (
            <div key={region} className="mb-5">
              <h3 className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-primary/80">
                {region}
              </h3>
              <ul className="space-y-0.5">
                {leagues.map((l) => {
                  const checked = selected.has(l.id);
                  return (
                    <li key={l.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-accent/60">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background"
                          }`}
                        >
                          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(l.id)}
                          className="sr-only"
                        />
                        <span className="text-base leading-none">{l.flag}</span>
                        <span className="flex-1 truncate">{l.name}</span>
                        <span className="text-[10px] text-muted-foreground">{l.country}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
