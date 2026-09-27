"use client";

import { useFormStatus } from "react-dom";

export function ReportSubmitButton({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Submitting…" : "Submit Report"}
    </button>
  );
}
