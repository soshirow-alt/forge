import Link from "next/link";
import { getCreatorId } from "@/lib/creators";

export function CreatorLink({
  name,
  className = "text-sm text-zinc-500 transition-colors hover:text-orange-400",
}: {
  name: string;
  className?: string;
}) {
  return (
    <Link href={`/creators/${getCreatorId(name)}`} className={className}>
      {name}
    </Link>
  );
}
