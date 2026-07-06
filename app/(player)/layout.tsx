import { PlayerShellLayout } from "@/components/player-shell-layout";

export default function PlayerRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlayerShellLayout>{children}</PlayerShellLayout>;
}
