"use client";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { changeWords } from "@/lib/equipment/card-words";
import type { Kind } from "@/lib/equipment/catalog";
import { useEquipmentCatalog } from "./use-equipment-catalog";

/** Change on an equipment card (D75): it opens the picker; its tooltip on desktop says what the library holds. */
export function ChangeButton({ kind, onChange }: { kind: Kind; onChange: () => void }) {
  const { catalog } = useEquipmentCatalog();
  return (
    <Tooltip words={changeWords(kind, catalog ? catalog[kind].length : null)}>
      <Button size="s" aria-haspopup="dialog" onClick={onChange}>
        Change
      </Button>
    </Tooltip>
  );
}
