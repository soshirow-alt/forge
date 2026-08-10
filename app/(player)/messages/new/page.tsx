import { MessagesDraftRoom } from "@/components/messages-draft-room";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default async function MessagesNewPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; project?: string }>;
}) {
  const params = await searchParams;
  const counterpartId = typeof params.to === "string" ? params.to.trim() : "";
  const counterpartProjectId =
    typeof params.project === "string" && params.project.trim()
      ? params.project.trim()
      : null;

  if (!counterpartId) {
    return (
      <RegisteredAccountGuard>
        <p className="p-6 text-sm text-zinc-400">宛先が指定されていません。</p>
      </RegisteredAccountGuard>
    );
  }

  return (
    <RegisteredAccountGuard>
      <MessagesDraftRoom
        counterpartId={counterpartId}
        counterpartProjectId={counterpartProjectId}
      />
    </RegisteredAccountGuard>
  );
}
