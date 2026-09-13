/**
 * One project on the /projects page. A Server Component: it only renders the
 * data it is handed and has no state of its own.
 */

import Link from "next/link";

import SkillBadge from "@/components/SkillBadge";
import Tag from "@/components/Tag";
import type { Project } from "@/types";

export default function ProjectCard({ project }: { project: Project }) {
  const requirements = Object.entries(project.required_skills).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="font-semibold tracking-tight text-slate-900">{project.name}</h3>
      <p className="mt-1 max-w-prose text-sm text-slate-600">{project.description}</p>

      {requirements.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-900">Required skills</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {requirements.map(([skill, level]) => (
              <SkillBadge key={skill} skill={skill} level={level} requirement />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold text-slate-900">Topics</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.topics.map((topic) => (
              <Tag key={topic}>{topic}</Tag>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-900">Technologies</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.technologies.map((technology) => (
              <Tag key={technology}>{technology}</Tag>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold text-slate-900">Open roles</h4>
        <p className="mt-1 text-sm text-slate-600">
          {project.roles.join(", ") || "Not set"}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-green-800 underline hover:text-green-900"
        >
          View recommended members
        </Link>
      </div>
    </article>
  );
}
