export const HONEYPOT_FIELD_NAME = "companyWebsite";

export const isHoneypotTriggered = (formData: FormData) => {
  const value = formData.get(HONEYPOT_FIELD_NAME);
  return typeof value === "string" && value.trim().length > 0;
};
