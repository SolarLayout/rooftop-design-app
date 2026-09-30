import { redirect } from "next/navigation";
import { FIRST_ITEM, pathOfItem } from "@/lib/routes";

// Handover is always at one of its items.
export default function HandoverPage() {
  redirect(pathOfItem(FIRST_ITEM));
}
