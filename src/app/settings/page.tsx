import { redirect } from "next/navigation";

export default function GlobalSettings() {
  redirect("/dashboard/system");
}
