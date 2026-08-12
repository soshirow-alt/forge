import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageLoadingSkeleton lines={4} />
    </div>
  );
}
