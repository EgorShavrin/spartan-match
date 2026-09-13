"use client";

/**
 * Dashboard at /.
 *
 * Loads members and projects together so it can show real counts instead of
 * placeholder numbers, then lists the projects as entry points into the
 * matching page.
 */

import Link from "next/link";

import { ErrorState, LoadingState } from "@/components/States";
import { getMembers, getProjects } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import type { Member, Project } from "@/types";

interface DashboardData {
  members: Member[];
  projects: Project[];
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="tabular text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useApiData<DashboardData>(async () => {
    // Both requests go out at once rather than one after the other.
    const [members, projects] = await Promise.all([getMembers(), getProjects()]);
    return { members, projects };
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Match members to the right project
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          SpartanMatch scores every member of the club against a project&apos;s
          requirements and shows the reasoning behind each score. Skills count for
          60 points, interests 20, an available preferred role 10, and the chance to
          learn something new 10.
        </p>
      </section>

      {loading && <LoadingState label="Loading club data" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard value={data.members.length} label="Members" />
            <StatCard value={data.projects.length} label="Active projects" />
            <StatCard
              value={data.members.length * data.projects.length}
              label="Member-project scores available"
            />
          </section>

          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Active projects
              </h2>
              <Link
                href="/projects"
                className="text-sm font-medium text-green-800 underline hover:text-green-900"
              >
                All projects
              </Link>
            </div>

            {data.projects.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No projects yet. Create one to start matching members.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {data.projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"
                    >
                      <span>
                        <span className="block font-medium text-slate-900">
                          {project.name}
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-500">
                          {Object.keys(project.required_skills).length} required skills,{" "}
                          {project.roles.length} open roles
                        </span>
                      </span>
                      <span className="text-sm text-slate-500">See matches</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-wrap gap-3">
            <Link
              href="/projects/new"
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Create a project
            </Link>
            <Link
              href="/members/new"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Add a member
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
