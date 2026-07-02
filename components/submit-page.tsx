"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { projectStudioPath } from "@/lib/project-nurture-links";

export function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (editId) {
      router.replace(`${projectStudioPath(editId)}?edit=project`);
      return;
    }
    router.replace("/studio/submit");
  }, [editId, router]);

  return null;
}
