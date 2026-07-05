"use client";

import { useEffect, useState } from "react";

type PublicXUsernameResponse =
  | { ok: true; xUsername: string | null }
  | { ok: false; message?: string };

async function fetchPublicXUsername(url: string): Promise<string | null> {
  const response = await fetch(url);
  const body = (await response.json()) as PublicXUsernameResponse;

  if (!response.ok || !body.ok) {
    return null;
  }

  return body.xUsername?.trim() || null;
}

export function useProjectAuthorXUsername(projectId: string | null | undefined) {
  const [xUsername, setXUsername] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!projectId);

  useEffect(() => {
    if (!projectId) {
      setXUsername(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    void fetchPublicXUsername(
      `/api/projects/${encodeURIComponent(projectId)}/public-author-x`,
    ).then((username) => {
      if (cancelled) {
        return;
      }
      setXUsername(username);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { xUsername, loaded };
}

export function useCreatorPublicXUsername(routeId: string | null | undefined) {
  const [xUsername, setXUsername] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!routeId);

  useEffect(() => {
    if (!routeId) {
      setXUsername(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    void fetchPublicXUsername(
      `/api/creators/${encodeURIComponent(routeId)}/public-x`,
    ).then((username) => {
      if (cancelled) {
        return;
      }
      setXUsername(username);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  return { xUsername, loaded };
}
