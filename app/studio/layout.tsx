import { StudioAccessLayout } from "@/components/studio-access-layout";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioAccessLayout>{children}</StudioAccessLayout>;
}
