"use client";

/**
 * Builds the skills object: { "Python": 4, "React": 2 }.
 *
 * Used by the member form (skills a person has) and the project form (the
 * minimum level a project wants), which is why the labels are props.
 */

import { useState } from "react";

import SkillBadge from "@/components/SkillBadge";
import { SKILL_LEVEL_LABELS, SKILL_OPTIONS } from "@/lib/options";
import type { SkillLevels } from "@/types";

interface SkillPickerProps {
  label: string;
  hint?: string;
  value: SkillLevels;
  onChange: (next: SkillLevels) => void;
  /** Show levels as "3+" when the picker describes a requirement. */
  requirement?: boolean;
}

export default function SkillPicker({
  label,
  hint,
  value,
  onChange,
  requirement = false,
}: SkillPickerProps) {
  const [skill, setSkill] = useState<string>(SKILL_OPTIONS[0]);
  const [level, setLevel] = useState<number>(3);

  function addSkill() {
    // Re-adding an existing skill just updates its level.
    onChange({ ...value, [skill]: level });
  }

  function removeSkill(name: string) {
    const next = { ...value };
    delete next[name];
    onChange(next);
  }

  const chosen = Object.entries(value);

  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-900">{label}</legend>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Skill</span>
          <select
            value={skill}
            onChange={(event) => setSkill(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {SKILL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">
            {requirement ? "Minimum level" : "Level"}
          </span>
          <select
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {[1, 2, 3, 4, 5].map((option) => (
              <option key={option} value={option}>
                {option} - {SKILL_LEVEL_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={addSkill}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Add skill
        </button>
      </div>

      {chosen.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chosen.map(([name, chosenLevel]) => (
            <li key={name} className="flex items-center gap-1">
              <SkillBadge skill={name} level={chosenLevel} requirement={requirement} />
              <button
                type="button"
                onClick={() => removeSkill(name)}
                className="rounded px-1 text-xs text-slate-400 hover:text-slate-900"
                aria-label={`Remove ${name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No skills added yet.</p>
      )}
    </fieldset>
  );
}
