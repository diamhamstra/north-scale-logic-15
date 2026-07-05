import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

const POSITIONS = ["Quantitative Trader", "Financial Accountant"];

export default function ApplicationForm({ selectedPosition, onBack, onSubmitSuccess }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    linkedin_url: "",
    position: selectedPosition || "",
    cv_file: null,
    consent_given: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.last_name.trim()) e.last_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.position) e.position = "Required";
    if (!form.cv_file) e.cv_file = "CV upload required";
    if (!form.linkedin_url.trim()) e.linkedin_url = "Required";
    if (!form.consent_given) e.consent_given = "Required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    
    setSubmitting(true);
    setErrors(p => ({ ...p, submit: "" }));
    try {
      const cvReader = new FileReader();
      cvReader.onload = async (event) => {
        try {
          const cvArray = new Uint8Array(event.target.result);
          const blob = new Blob([cvArray], { type: "application/pdf" });
          const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });

          const year = new Date().getFullYear();
          const appNum = String(Math.floor(Math.random() * 900) + 100);
          const applicationId = `APP-${year}-${appNum}`;

          await base44.entities.JobApplication.create({
            application_id: applicationId,
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: "",
            linkedin_url: form.linkedin_url,
            location: "",
            position: form.position,
            cv_url: file_url,
            cover_letter: "",
            additional_info: "",
            consent_given: form.consent_given,
            status: "Applied",
            submitted_at: new Date().toISOString(),
          });

          await base44.functions.invoke("submitJobApplication", {
            application_id: applicationId,
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            position: form.position,
          });

          setSubmitted(true);
        } catch (err) {
          console.error("Upload failed:", err);
          setErrors(p => ({ ...p, submit: "Something went wrong while submitting your application. Please try again." }));
        }
        setSubmitting(false);
      };
      cvReader.onerror = () => {
        console.error("CV file read failed:", cvReader.error);
        setErrors(p => ({ ...p, submit: "We couldn't read your CV file. Please try a different file." }));
        setSubmitting(false);
      };
      cvReader.readAsArrayBuffer(form.cv_file);
    } catch (err) {
      console.error("Submission failed:", err);
      setErrors(p => ({ ...p, submit: "Something went wrong while submitting your application. Please try again." }));
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <div className="border border-border p-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-6">
            Application Received
          </p>
          <h2 className="font-heading text-4xl text-foreground mb-6">
            Thank you for your application.
          </h2>
          <p className="font-mono text-xs leading-7 text-muted-foreground mb-8 max-w-lg mx-auto">
            Your application has been submitted successfully. Our team will review it and contact you if your profile matches our requirements.
          </p>
          <div className="inline-flex items-center gap-3 border border-border px-6 py-3 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Status: Under Review
            </span>
          </div>
          <button
            onClick={onSubmitSuccess}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Return to Careers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8">
      <button
        onClick={onBack}
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground hover:text-foreground transition-colors mb-8 flex items-center gap-2"
      >
        ← Back to Positions
      </button>

      <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-4">
        Application
      </p>
      <h2 className="font-heading text-4xl text-foreground mb-3">
        Submit Application
      </h2>
      <p className="font-mono text-xs leading-7 text-muted-foreground mb-10 max-w-xl">
        Please complete the form below. All applications are reviewed confidentially.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
              First Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => { set("first_name", e.target.value); setErrors(p => ({...p, first_name: ""})); }}
              className={`w-full border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none transition-colors ${errors.first_name ? "border-red-400" : "border-border focus:border-foreground"}`}
              placeholder="First name"
            />
            {errors.first_name && <p className="mt-1 font-mono text-[10px] text-red-400">{errors.first_name}</p>}
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
              Last Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => { set("last_name", e.target.value); setErrors(p => ({...p, last_name: ""})); }}
              className={`w-full border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none transition-colors ${errors.last_name ? "border-red-400" : "border-border focus:border-foreground"}`}
              placeholder="Last name"
            />
            {errors.last_name && <p className="mt-1 font-mono text-[10px] text-red-400">{errors.last_name}</p>}
          </div>
        </div>

        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => { set("email", e.target.value); setErrors(p => ({...p, email: ""})); }}
            className={`w-full border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none transition-colors ${errors.email ? "border-red-400" : "border-border focus:border-foreground"}`}
            placeholder="your@email.com"
          />
          {errors.email && <p className="mt-1 font-mono text-[10px] text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            LinkedIn Profile <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            value={form.linkedin_url}
            onChange={(e) => { set("linkedin_url", e.target.value); setErrors(p => ({...p, linkedin_url: ""})); }}
            className={`w-full border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none transition-colors ${errors.linkedin_url ? "border-red-400" : "border-border focus:border-foreground"}`}
            placeholder="https://linkedin.com/in/..."
          />
          {errors.linkedin_url && <p className="mt-1 font-mono text-[10px] text-red-400">{errors.linkedin_url}</p>}
        </div>

        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            Position Applying For <span className="text-red-400">*</span>
          </label>
          <select
            value={form.position}
            onChange={(e) => { set("position", e.target.value); setErrors(p => ({...p, position: ""})); }}
            className={`w-full border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none transition-colors ${errors.position ? "border-red-400" : "border-border focus:border-foreground"}`}
          >
            <option value="">Select position</option>
            {POSITIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.position && <p className="mt-1 font-mono text-[10px] text-red-400">{errors.position}</p>}
        </div>

        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
            CV (PDF) <span className="text-red-400">*</span>
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => { set("cv_file", e.target.files[0]); setErrors(p => ({...p, cv_file: ""})); }}
            className={`w-full border bg-background px-4 py-3 font-mono text-xs text-foreground focus:outline-none transition-colors ${errors.cv_file ? "border-red-400" : "border-border focus:border-foreground"}`}
          />
          {errors.cv_file && <p className="mt-1 font-mono text-[10px] text-red-400">{errors.cv_file}</p>}
          <p className="font-mono text-[10px] leading-5 text-muted-foreground/60 mt-1">
            PDF format only. Maximum 10MB.
          </p>
        </div>

        <div>
          <label className="flex items-start gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.consent_given}
              onChange={(e) => { set("consent_given", e.target.checked); setErrors(p => ({...p, consent_given: ""})); }}
              className="mt-0.5 flex-shrink-0 w-4 h-4 border border-border bg-background accent-foreground cursor-pointer"
            />
            <span className="font-mono text-[10px] leading-5 text-muted-foreground group-hover:text-foreground transition-colors">
              I consent to the processing of my personal data for recruitment purposes.
              {errors.consent_given && <span className="text-red-400 ml-2">Required</span>}
            </span>
          </label>
        </div>

        {errors.submit && <p className="font-mono text-[10px] text-red-400">{errors.submit}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-10 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}