"use client";

import { useTransition } from "react";
import { deleteGame } from "@/app/actions";

export function DeleteGameButton({ id, number }: { id: number; number: number }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(`Delete game ${number}? League standings will be recalculated.`)) return;
    startTransition(async () => {
      const res = await deleteGame(id);
      if ("error" in res) alert(res.error);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
