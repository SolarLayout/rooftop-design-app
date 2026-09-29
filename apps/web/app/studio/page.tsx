import { redirect } from "next/navigation";
import { FIRST_LENS, pathOfLens } from "@/lib/routes";

// The Studio is always at a lens.
export default function StudioPage() {
  redirect(pathOfLens(FIRST_LENS));
}
