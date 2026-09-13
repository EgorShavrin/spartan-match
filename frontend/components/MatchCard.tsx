"use client";

/**
 * One ranked member on the project detail page.
 *
 * The top three are expanded by default; the rest collapse to a single row so
 * a club of forty members is still scannable. Expanding is the only motion in
 * the app, and it answers a click.
 */

import { useState } from "react";

import MatchBreakdown from "@/components/MatchBreakdown";
import SkillBadge from "@/components/SkillBadge";
import Tag from "@/components/Tag";
import type { MemberMatch } from "@/types";

/** Small check mark for reasons. An inline SVG, so no icon dependency. */
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 8.5l3.5 3.5L13 5" />
    </svg>
  );
}

/** Small dash for weaknesses. */
function GapIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 8h10" />
    </svg>
  );
}

export default function MatchCard({ match }: { match: MemberMatch }) {
  const { rank, member, scores } = match;
  const [expanded, setExpanded] = useState(rank <= 3);

  const isTopMatch = rank === 1;

  return (
    <article
      className={`rounded-lg border bg-white ${
        isTopMatch ? "border-slate-200 border-l-4 border-l-green-700" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="tabular mt-0.5 text-sm font-medium text-slate-400">
            #{rank}
          </span>
          <div>
            <h3 className="font-semibold tracking-tight text-slate-900">
              {member.name}
            </h3>
            <p className="text-sm text-slate-500">{member.major}</p>
            {isTopMatch && (
              <p className="mt-1 text-xs font-medium text-green-800">
                Best fit for this project
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="tabular text-2xl font-semibold tracking-tight text-slate-900">
            {Math.round(scores.total_score)}%
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs text-slate-500 underline hover:text-slate-900"
            aria-expanded={expanded}
          >
            {expanded ? "Hide breakdown" : "Show breakdown"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
          <MatchBreakdown scores={scores} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                Why they fit
              </h4>
              <ul className="mt-2 space-y-1.5">
                {scores.reasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-sm text-slate-700">
                    <CheckIcon />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                {scores.weaknesses.length > 0 ? "Gaps to cover" : "No gaps"}
              </h4>
              {scores.weaknesses.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {scores.weaknesses.map((weakness) => (
                    <li key={weakness} className="flex gap-2 text-sm text-slate-700">
                      <GapIcon />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Meets every requirement this project listed.
                </p>
              )}
            </div>
          </div>

          {scores.weak_or_missing_skills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                Skills below the requirement
              </h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {scores.weak_or_missing_skills.map((gap) => (
                  <SkillBadge
                    key={gap.skill}
                    skill={gap.skill}
                    level={gap.member_level}
                    gap
                  />
                ))}
              </div>
            </div>
          )}

          {member.interests.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-900">Interests</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {member.interests.map((interest) => (
                  <Tag
                    key={interest}
                    highlighted={scores.matched_interests.some(
                      (matched) => matched.toLowerCase() === interest.toLowerCase(),
                    )}
                  >
                    {interest}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
