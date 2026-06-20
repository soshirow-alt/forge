import { redirect } from "next/navigation";

export default function BookmarksRoute() {
  redirect("/mypage?tab=saved");
}
