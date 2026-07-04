"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { studioOverviewEditHref } from "@/lib/studio-edit-url";

export function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (editId) {
      router.replace(studioOverviewEditHref(editId, "basic-info"));
      return;
    }
    router.replace("/studio/submit");
  }, [editId, router]);

  return null;
}
