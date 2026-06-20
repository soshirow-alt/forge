import { redirect } from "next/navigation";

/** 旧トップ廃止 — v0 発見ホームへ */
export default function RootPage() {
  redirect("/home");
}
