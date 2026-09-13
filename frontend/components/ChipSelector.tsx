"use client";

/**
 * Multi-select from a fixed list of options, used by both forms for
 * interests, topics, roles and technologies.
 *
 * It holds no state itself: the parent form owns the selected array and
 * passes it back in. That is the standard React "controlled component"
 * pattern, and it keeps all of a form's data in one place.
 */

interface ChipSelectorProps {
  label: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function ChipSelector({
  label,
  hint,
  options,
  selected,
  onChange,
}: ChipSelectorProps) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-900">{label}</legend>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={isSelected}
              className={`rounded-md border px-2.5 py-1 text-sm ${
                isSelected
                  ? "border-green-700 bg-green-700 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
