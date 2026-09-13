"use client";

/**
 * Create project form at /projects/new.
 *
 * Same shape as the member form. On success it sends you to the new project's
 * detail page, so you immediately see the ranking it produced.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ChipSelector from "@/components/ChipSelector";
import SkillPicker from "@/components/SkillPicker";
import { createProject } from "@/lib/api";
import { ROLE_OPTIONS, TECHNOLOGY_OPTIONS, TOPIC_OPTIONS } from "@/lib/options";
import type { SkillLevels } from "@/types";

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<SkillLevels>({});
  const [topics, setTopics] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [technologies, setTechnologies] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError("Enter the project name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await createProject({
        name: name.trim(),
        description: description.trim(),
        required_skills: requiredSkills,
        topics,
        roles,
        technologies,
      });

      // Straight to the ranking for the project that was just created.
      router.push(`/projects/${created.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The project could not be saved.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/projects"
          className="text-sm text-slate-500 underline hover:text-slate-900"
        >
          Back to projects
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Create a project
        </h1>
        <p className="mt-1 text-slate-600">
          Every field here becomes part of the score. Required skills carry 60 of the
          100 points.
        </p>
      </div>

      <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-900">Project name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="AI Study Planner"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-900">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="What the project does and who it is for."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <SkillPicker
          label="Required skills"
          hint="The minimum level you would like someone to have. Members below it lose points proportionally."
          value={requiredSkills}
          onChange={setRequiredSkills}
          requirement
        />

        <ChipSelector
          label="Topics"
          hint="Matched against member interests. Worth 20 points."
          options={TOPIC_OPTIONS}
          selected={topics}
          onChange={setTopics}
        />

        <ChipSelector
          label="Open roles"
          hint="A member whose preferred role appears here earns all 10 role points."
          options={ROLE_OPTIONS}
          selected={roles}
          onChange={setRoles}
        />

        <ChipSelector
          label="Technologies"
          hint="Matched against what members want to learn. Worth 10 points."
          options={TECHNOLOGY_OPTIONS}
          selected={technologies}
          onChange={setTechnologies}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:bg-slate-300"
        >
          {saving ? "Saving..." : "Create project"}
        </button>
        <Link
          href="/projects"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
