/**
 * The three screens that are not the happy path: loading, failed, and empty.
 *
 * Centralised so no page can accidentally render nothing at all. Empty states
 * take an action, because a blank list should tell you what to do next.
 */

import Link from "next/link";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
      <p className="text-sm text-slate-500">{label}...</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <h2 className="text-sm font-semibold text-amber-900">
        This page could not load
      </h2>
      <p className="mt-1 max-w-prose text-sm text-amber-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 inline-block rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
