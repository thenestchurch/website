"use client";

import { useState } from "react";

export function PasswordField() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label style={{ display: "grid", gap: "8px" }}>
      <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Password
      </span>
      <div style={{ position: "relative" }}>
        <input
          name="password"
          style={{
            border: "1px solid rgba(23, 23, 23, 0.16)",
            borderRadius: "12px",
            boxSizing: "border-box",
            padding: "12px 86px 12px 14px",
            width: "100%",
          }}
          type={showPassword ? "text" : "password"}
        />
        <button
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword((value) => !value)}
          style={{
            background: "transparent",
            border: 0,
            color: "#780b18",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 700,
            padding: "8px 10px",
            position: "absolute",
            right: "6px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
          type="button"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}
