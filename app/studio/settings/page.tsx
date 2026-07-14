import { redirect } from "next/navigation";

/** Old Studio settings URL → canonical /settings */
export default function StudioSettingsRoute() {
  redirect("/settings");
}
