import { HONEYPOT_FIELD_NAME } from "@/lib/security/honeypot";

export function HoneypotField() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 1,
        left: "-10000px",
        overflow: "hidden",
        position: "absolute",
        top: "auto",
        width: 1,
      }}
    >
      <label htmlFor={HONEYPOT_FIELD_NAME}>Leave this field empty</label>
      <input
        autoComplete="off"
        id={HONEYPOT_FIELD_NAME}
        name={HONEYPOT_FIELD_NAME}
        tabIndex={-1}
        type="text"
      />
    </div>
  );
}
