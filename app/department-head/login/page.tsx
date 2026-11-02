import { HoneypotField } from "@/components/honeypot-field";
import { PasswordField } from "@/app/(auth)/admin/login/password-field";
import { loginDepartmentHead } from "./actions";

type SearchParams = Promise<{
  error?: string | string[];
}>;

const takeString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getErrorMessage = (error: string | undefined) => {
  switch (error) {
    case "missing":
      return "Enter both email and password.";
    case "wrongPortal":
      return "Use a department-head account for this portal.";
    case "noDepartment":
      return "This department-head account is not assigned to a department.";
    case "invalid":
      return "Invalid department-head login details.";
    default:
      return "";
  }
};

export default async function DepartmentHeadLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(takeString(params.error));

  return (
    <main
      style={{
        alignItems: "center",
        display: "grid",
        justifyItems: "center",
        minHeight: "calc(100vh - 5rem)",
        padding: "32px",
        paddingTop: "7rem",
      }}
    >
      <section
        style={{
          background: "#fffdfa",
          border: "1px solid rgba(120, 11, 24, 0.12)",
          borderRadius: "24px",
          boxShadow: "0 18px 40px rgba(23, 23, 23, 0.08)",
          maxWidth: "460px",
          padding: "28px",
          width: "100%",
        }}
      >
        <p
          style={{
            color: "#6b1320",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          Department Head Portal
        </p>
        <h2 style={{ marginBottom: "10px" }}>Sign in</h2>
        <p style={{ color: "#5a544d", lineHeight: 1.5, marginTop: 0 }}>
          Submit your department service report.
        </p>

        {errorMessage ? (
          <div
            style={{
              background: "#fff1d9",
              borderRadius: "14px",
              color: "#8b5a00",
              fontWeight: 700,
              marginBottom: "16px",
              padding: "12px 14px",
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <form action={loginDepartmentHead} style={{ display: "grid", gap: "14px" }}>
          <HoneypotField />
          <label style={{ display: "grid", gap: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Email
            </span>
            <input
              name="email"
              style={{
                border: "1px solid rgba(23, 23, 23, 0.16)",
                borderRadius: "12px",
                boxSizing: "border-box",
                padding: "12px 14px",
                width: "100%",
              }}
              type="email"
            />
          </label>

          <PasswordField />

          <button
            style={{
              background: "#780b18",
              border: "1px solid #780b18",
              borderRadius: "999px",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              marginTop: "6px",
              padding: "12px 18px",
            }}
            type="submit"
          >
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
