import { DevlogNewPage } from "@/components/devlog-new-page";

export default async function NewDevlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DevlogNewPage projectId={id} />;
}
