"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const formValues = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      const data = (await response.json()) as { message?: string };
      setStatus(data.message ?? "Thank you for contacting us.");
      event.currentTarget.reset();
    } catch {
      setStatus("Message could not be sent. Wire this route to your email provider.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {status ? <p className="form-status">{status}</p> : null}

      <div className="field-group">
        <label htmlFor="name">YOUR NAME *</label>
        <input className="input" id="name" name="name" required />
      </div>

      <div className="field-group">
        <label htmlFor="email">YOUR EMAIL *</label>
        <input className="input" id="email" name="email" required type="email" />
      </div>

      <div className="field-group">
        <label htmlFor="subject">SUBJECT *</label>
        <input className="input" id="subject" name="subject" required />
      </div>

      <div className="field-group">
        <label htmlFor="message">MESSAGE *</label>
        <textarea className="textarea" id="message" name="message" required />
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "SENDING..." : "SEND MESSAGE"}
        </button>
      </div>
    </form>
  );
}
