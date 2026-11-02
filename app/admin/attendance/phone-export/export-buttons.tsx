"use client";

import { useState } from "react";
import styles from "../page.module.css";

type Contact = { fullName: string; departmentName: string; phone: string; whatsapp: string; email: string };
const csvCell = (value: string) => `"${(/^[=+@\-\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;

export function ExportButtons({ rows, numbers, filename }: { rows: Contact[]; numbers: string; filename: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const download = (content: string, extension: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${extension}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className={styles.actions}>
      <button className={styles.primaryButton} type="button" onClick={() => {
        const data = [["Member", "Department", "Phone", "WhatsApp", "Email"], ...rows.map((row) => [row.fullName, row.departmentName, row.phone, row.whatsapp, row.email])];
        download("\uFEFF" + data.map((row) => row.map(csvCell).join(",")).join("\r\n"), "csv", "text/csv;charset=utf-8");
      }}>Download CSV</button>
      <button className={styles.secondaryButton} type="button" onClick={() => download(numbers, "txt", "text/plain;charset=utf-8")}>Download numbers</button>
      <button className={styles.secondaryButton} type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(numbers); setCopied(true); setCopyError(false); }
        catch { setCopyError(true); }
      }}>{copied ? "Copied!" : "Copy numbers"}</button>
      {copyError ? <span role="alert">Copy from the number boxes below or download the numbers.</span> : null}
    </div>
  );
}
