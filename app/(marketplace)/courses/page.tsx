import { redirect } from "next/navigation";

/** Ancienne page mockee - remplacee par le catalogue connecte a Supabase. */
export default function CoursesPage() {
  redirect("/formations");
}
