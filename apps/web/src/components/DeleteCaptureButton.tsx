"use client";

import { useRouter } from "next/navigation";

export function DeleteCaptureButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        if (!confirm("Delete this capture and its review history?")) return;
        const res = await fetch(`/api/captures/${id}`, { method: "DELETE" });
        if (res.ok) {
          router.push("/app");
          router.refresh();
        }
      }}
      className="text-sm text-ink-faint underline underline-offset-4 hover:text-red"
    >
      Delete
    </button>
  );
}
