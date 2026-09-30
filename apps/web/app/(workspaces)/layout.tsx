import type { ReactNode } from "react";
import { Shell } from "@/components/shell/Shell";

// Studio, Performance and Handover share one design and one top bar.
export default function WorkspacesLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
