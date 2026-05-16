export function TeamCrest({ short, color }: { short: string; color: string }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 text-xs font-bold shadow-inner"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: getContrast(color),
      }}
    >
      {short}
    </div>
  );
}

function getContrast(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#fff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#0b0f17" : "#ffffff";
}
