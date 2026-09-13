"use client";

/** Members list at /members. */

import Link from "next/link";

import MemberCard from "@/components/MemberCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { getMembers } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import type { Member } from "@/types";

export default function MembersPage() {
  const { data, loading, error, reload } = useApiData<Member[]>(getMembers);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Members
          </h1>
          <p className="mt-1 text-slate-600">
            Everyone in the club, with the skills and interests used for matching.
          </p>
        </div>
        <Link
          href="/members/new"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Add a member
        </Link>
      </div>

      {loading && <LoadingState label="Loading members" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.length === 0 && (
        <EmptyState
          title="No members yet"
          description="Add the first member to start matching people to projects."
          actionHref="/members/new"
          actionLabel="Add a member"
        />
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
