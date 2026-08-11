import { redirect } from "next/navigation";

/** Compatibility: former Studio community surface now shares Player conversations. */
export default function Page() {
  redirect("/studio/messages");
}
