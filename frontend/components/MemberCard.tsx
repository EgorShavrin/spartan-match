"use client";

/**
 * One member on the /members page.
 *
 * The "Show project fit" button is what uses GET /members/{id}/matches: the
 * reverse of the main matching endpoint, loaded on demand rather than for
 * every card on the page.
 */

import { useState } from "react";
import Link from "next/link";

import SkillBadge from "@/components/SkillBadge";
import Tag from "@/components/Tag";
import { getMemberMatches } from "@/lib/api";
import type { Member, ProjectMatch } from "@/types";

export default function MemberCard({ member }: { member: Member }) {
  const [matches, setMatches] = useState<ProjectMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strongest skills first, so the card leads with what this person is best at.
  const skills = Object.entries(member.skills).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  async function loadProjectFit() {
    if (matches) {
      setMatches(null); // second click collapses
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getMemberMatches(member.id);
      setMatches(result.slice(0, 3));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load matches.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h3 className="font-semibold tracking-tight text-slate-900">{member.name}</h3>
        <p className="text-sm text-slate-500">{member.major}</p>
      </div>

      {skills.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-900">Skills</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map(([skill, level]) => (
              <SkillBadge key={skill} skill={skill} level={level} />
            ))}
          </div>
        </div>
      )}

      {member.interests.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-900">Interests</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {member.interests.map((interest) => (
              <Tag key={interest}>{interest}</Tag>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold text-slate-900">Preferred roles</h4>
          <p className="mt-1 text-slate-600">
            {member.preferred_roles.join(", ") || "Not set"}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-900">Wants to learn</h4>
          <p className="mt-1 text-slate-600">
            {member.learning_goals.join(", ") || "Not set"}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={loadProjectFit}
          disabled={loading}
          className="text-sm font-medium text-green-800 underline hover:text-green-900 disabled:text-slate-400"
        >
          {loading
            ? "Loading project fit..."
            : matches
              ? "Hide project fit"
              : "Show project fit"}
        </button>

        {error && <p className="mt-2 text-sm text-amber-800">{error}</p>}

        {matches && matches.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">
            There are no projects to compare against yet.
          </p>
        )}

        {matches && matches.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {matches.map((match) => (
              <li
                key={match.project.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <Link
                  href={`/projects/${match.project.id}`}
                  className="text-slate-700 underline hover:text-slate-900"
                >
                  {match.project.name}
                </Link>
                <span className="tabular font-medium text-slate-900">
                  {Math.round(match.scores.total_score)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
