import { redirect } from "next/navigation";

/** Old Studio profile URL → canonical /mypage/profile */
export default function StudioProfileRoute() {
  redirect("/mypage/profile");
}
