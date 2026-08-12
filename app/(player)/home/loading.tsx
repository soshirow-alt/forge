import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageLoadingSkeleton lines={6} />
    </div>
  );
}
