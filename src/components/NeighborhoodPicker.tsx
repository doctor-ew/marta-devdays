"use client";

type Zone = "Downtown" | "Midtown" | "Airport";

const ZONES: { id: Zone; label: string; description: string }[] = [
  {
    id: "Downtown",
    label: "Downtown",
    description: "Five Points · Centennial Park",
  },
  {
    id: "Midtown",
    label: "Midtown",
    description: "Arts Center · Peachtree",
  },
  {
    id: "Airport",
    label: "Airport",
    description: "College Park · MARTA spine",
  },
];

interface Props {
  selected: Zone | null;
  onSelect: (zone: Zone) => void;
}

export function NeighborhoodPicker({ selected, onSelect }: Props) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
        Where are you coming from?
      </h2>
      <div
        role="radiogroup"
        aria-label="Select your starting zone"
        className="flex flex-col gap-2"
      >
        {ZONES.map((zone) => {
          const isSelected = selected === zone.id;
          return (
            <button
              key={zone.id}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${zone.label} — ${zone.description}`}
              onClick={() => onSelect(zone.id)}
              className={[
                "flex flex-col items-start w-full px-4 py-5 rounded-lg border text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isSelected
                  ? "border-l-4 border-accent bg-surface"
                  : "border-border bg-surface hover:bg-border/30",
              ].join(" ")}
            >
              <span className="text-xl font-bold text-text">{zone.label}</span>
              <span className="text-sm text-muted mt-0.5">{zone.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
