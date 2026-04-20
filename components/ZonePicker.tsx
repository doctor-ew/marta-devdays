'use client';

import type { Zone } from '@/types';
import { ZONE_LABELS } from '@/types';

interface Props {
  selected: Zone | null;
  onSelect: (zone: Zone) => void;
}

const ZONES: Zone[] = ['downtown', 'midtown', 'airport', 'decatur', 'dunwoody'];

export default function ZonePicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Where are you starting?
      </h2>
      <div className="flex flex-col gap-1" role="radiogroup" aria-label="Departure zone">
        {ZONES.map((zone) => {
          const isSelected = selected === zone;
          return (
            <label
              key={zone}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isSelected
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700',
              ].join(' ')}
            >
              <input
                type="radio"
                name="zone"
                value={zone}
                checked={isSelected}
                onChange={() => onSelect(zone)}
                className="sr-only"
              />
              {ZONE_LABELS[zone]}
            </label>
          );
        })}
      </div>
    </div>
  );
}
