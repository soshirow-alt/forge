import { Suspense } from "react";
import { HomePage } from "@/components/home-page";

export default function Home() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}
