"use client";

/**
 * Add member form at /members/new.
 *
 * All the form data lives in React state in this component. Nothing is sent
 * until "Save member" is clicked, at which point createMember() POSTs the
 * whole object to FastAPI as JSON.
 *
 * There is no <form onSubmit> here: a plain button with onClick keeps the flow
 * explicit and avoids the browser's default page reload.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ChipSelector from "@/components/ChipSelector";
import SkillPicker from "@/components/SkillPicker";
import { createMember } from "@/lib/api";
import { ROLE_OPTIONS, TECHNOLOGY_OPTIONS, TOPIC_OPTIONS } from "@/lib/options";
import type { SkillLevels } from "@/types";

export default function NewMemberPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [skills, setSkills] = useState<SkillLevels>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!name.trim()) {
      setError("Enter the member's name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createMember({
        name: name.trim(),
        major: major.trim(),
        skills,
        interests,
        preferred_roles: preferredRoles,
        learning_goals: learningGoals,
      });

      setSaved(true);
      // Go to the members list so the new card is visible straight away.
      router.push("/members");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The member could not be saved.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/members"
          className="text-sm text-slate-500 underline hover:text-slate-900"
        >
          Back to members
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Add a member
        </h1>
        <p className="mt-1 text-slate-600">
          Skills, interests and roles are picked from set lists so that scores stay
          comparable between members.
        </p>
      </div>

      <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-900">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alex Johnson"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-900">Major</span>
            <input
              type="text"
              value={major}
              onChange={(event) => setMajor(event.target.value)}
              placeholder="Computer Science"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <SkillPicker
          label="Skills"
          hint="Pick a skill and the level this member is at, then add it."
          value={skills}
          onChange={setSkills}
        />

        <ChipSelector
          label="Interests"
          hint="Matched against a project's topics. Worth 20 points."
          options={TOPIC_OPTIONS}
          selected={interests}
          onChange={setInterests}
        />

        <ChipSelector
          label="Preferred roles"
          hint="Worth 10 points if the project has one of these roles open."
          options={ROLE_OPTIONS}
          selected={preferredRoles}
          onChange={setPreferredRoles}
        />

        <ChipSelector
          label="Wants to learn"
          hint="Matched against a project's technologies. Worth 10 points."
          options={TECHNOLOGY_OPTIONS}
          selected={learningGoals}
          onChange={setLearningGoals}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error}</p>
        </div>
      )}

      {saved && !error && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">Member saved. Opening the list...</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:bg-slate-300"
        >
          {saving ? "Saving..." : "Save member"}
        </button>
        <Link
          href="/members"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
