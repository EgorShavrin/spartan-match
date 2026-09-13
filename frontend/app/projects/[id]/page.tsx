"use client";

/**
 * Project detail and match results at /projects/[id].
 *
 * This is the page the whole application exists for. It makes two requests:
 *
 *   GET /projects/{id}           the project itself
 *   GET /projects/{id}/matches   every member, scored and already ranked
 *
 * The ranking and the explanations both come from the backend. This page does
 * not compute any part of a score; it only draws what the matcher returned.
 * That is deliberate: one implementation of the rules, on the server, where
 * the tests can reach it.
 *
 * The `[id]` folder name makes this a dynamic route. Next.js passes whatever
 * is in that position of the URL in as `params.id`, always as a string.
 */

import Link from "next/link";
import { useParams } from "next/navigation";

import MatchCard from "@/components/MatchCard";
import SkillBadge from "@/components/SkillBadge";
import Tag from "@/components/Tag";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { getProject, getProjectMatches } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import type { MemberMatch, Project } from "@/types";

interface ProjectPageData {
  project: Project;
  matches: MemberMatch[];
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);

  const { data, loading, error, reload } = useApiData<ProjectPageData>(
    async () => {
      const [project, matches] = await Promise.all([
        getProject(projectId),
        getProjectMatches(projectId),
      ]);
      return { project, matches };
    },
    [projectId],
  );

  if (loading) {
    return <LoadingState label="Scoring members against this project" />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState message={error} onRetry={reload} />
        <Link
          href="/projects"
          className="inline-block text-sm font-medium text-green-800 underline hover:text-green-900"
        >
          Back to all projects
        </Link>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { project, matches } = data;
  const requirements = Object.entries(project.required_skills).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  return (
    <div className="space-y-8">
      <Link
        href="/projects"
        className="inline-block text-sm text-slate-500 underline hover:text-slate-900"
      >
        Back to all projects
      </Link>

      {/* Project summary: what the matcher scored everyone against. */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {project.name}
        </h1>
        <p className="mt-2 max-w-prose text-slate-600">{project.description}</p>

        <div className="mt-6 space-y-5">
          <div>
            <h2 className="text-xs font-semibold text-slate-900">Required skills</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {requirements.length > 0 ? (
                requirements.map(([skill, level]) => (
                  <SkillBadge key={skill} skill={skill} level={level} requirement />
                ))
              ) : (
                <span className="text-sm text-slate-500">None listed</span>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Topics</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.topics.map((topic) => (
                  <Tag key={topic}>{topic}</Tag>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Technologies</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.technologies.map((technology) => (
                  <Tag key={technology}>{technology}</Tag>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Open roles</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.roles.map((role) => (
                  <Tag key={role}>{role}</Tag>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The ranking. */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Recommended members
          </h2>
          <p className="text-sm text-slate-500">
            {matches.length} member{matches.length === 1 ? "" : "s"} scored, best fit
            first
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No members to rank"
              description="Add members to the club and they will be scored against this project automatically."
              actionHref="/members/new"
              actionLabel="Add a member"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {matches.map((match) => (
              <MatchCard key={match.member.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
