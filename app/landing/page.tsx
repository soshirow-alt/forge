import { redirect } from "next/navigation";

/** 旧確認用 URL — 正本は `/` */
export default function LandingRoute() {
  redirect("/");
}
