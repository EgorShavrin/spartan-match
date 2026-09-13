/**
 * A skill with its level, shown as five dots.
 *
 * Used in three places: a member's own skills, a project's requirements
 * ("Python 3+"), and the gaps listed on a match card.
 */

import { SKILL_LEVEL_LABELS } from "@/lib/options";

interface SkillBadgeProps {
  skill: string;
  level: number;
  /** Renders as a requirement ("3+") rather than an ability. */
  requirement?: boolean;
  /** Renders in amber, for a requirement the member does not meet. */
  gap?: boolean;
}

export default function SkillBadge({
  skill,
  level,
  requirement = false,
  gap = false,
}: SkillBadgeProps) {
  const border = gap ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white";
  const text = gap ? "text-amber-900" : "text-slate-700";
  const dotOn = gap ? "bg-amber-500" : "bg-green-700";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${border} ${text}`}
      title={`${skill}: ${SKILL_LEVEL_LABELS[level] ?? "level " + level}`}
    >
      <span className="font-medium">{skill}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((dot) => (
          <span
            key={dot}
            className={`h-1.5 w-1.5 rounded-full ${dot <= level ? dotOn : "bg-slate-200"}`}
          />
        ))}
      </span>
      <span className="tabular text-slate-500">
        {requirement ? `${level}+` : level}
      </span>
    </span>
  );
}
