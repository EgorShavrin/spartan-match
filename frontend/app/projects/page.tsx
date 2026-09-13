"use client";

/** Projects list at /projects. */

import Link from "next/link";

import ProjectCard from "@/components/ProjectCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { getProjects } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const { data, loading, error, reload } = useApiData<Project[]>(getProjects);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Projects
          </h1>
          <p className="mt-1 text-slate-600">
            Open the details page for any project to see its ranked members.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Create a project
        </Link>
      </div>

      {loading && <LoadingState label="Loading projects" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="Create a project and SpartanMatch will rank every member against it."
          actionHref="/projects/new"
          actionLabel="Create a project"
        />
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
