"use client";

import Link from "next/link";
import { useGames } from "@/components/games-provider";

export function CreatorLink({
  name,
  className = "text-sm text-zinc-500 transition-colors hover:text-orange-400",
}: {
  name: string;
  className?: string;
}) {
  const { getCreatorIdForName } = useGames();
  const creatorId = getCreatorIdForName(name);

  return (
    <Link href={`/creators/${creatorId}`} className={className}>
      {name}
    </Link>
  );
}
