"use client";

/**
 * One small hook shared by every page that loads data.
 *
 * Each page needs the same three pieces of state (data, loading, error) plus
 * a way to retry. Writing that out four times invites four slightly different
 * versions of it, so it lives here once.
 */

import { useCallback, useEffect, useState } from "react";

export interface ApiData<T> {
  data: T | null;
  loading: boolean;
  /** Human-readable message, already unwrapped from ApiError. */
  error: string | null;
  /** Run the request again, for the "Try again" button. */
  reload: () => void;
}

export function useApiData<T>(
  load: () => Promise<T>,
  dependencies: unknown[] = [],
): ApiData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Re-create the loader only when the caller's dependencies change, so the
  // effect below does not re-run on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const runLoad = useCallback(load, dependencies);

  useEffect(() => {
    // Guards against setting state after the component has been unmounted.
    let active = true;

    setLoading(true);
    setError(null);

    runLoad()
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Something went wrong.",
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [runLoad, attempt]);

  return {
    data,
    loading,
    error,
    reload: () => setAttempt((previous) => previous + 1),
  };
}
