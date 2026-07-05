import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const COUNTRIES = [
  "United States", "United Kingdom", "Netherlands", "Germany",
  "Switzerland", "UAE", "Singapore", "Hong Kong", "Other"
];

const INQUIRY_TYPES = [
  { value: "prospective_investor", label: "Prospective Investor" },
  { value: "family_office", label: "Family Office" },
  { value: "institutional_investor", label: "Institutional Investor" },
  { value: "investment_consultant", label: "Investment Consultant" },
  { value: "quant_trader", label: "Quantitative Trader Application" },
  { value: "portfolio_manager", label: "Portfolio Manager Application" },
  { value: "broker_partnership", label: "Broker / Exchange Partnership" },
  { value: "technology_partnership", label: "Technology Partnership" },
  { value: "liquidity_provider", label: "Liquidity Provider" },
  { value: "media", label: "Media Inquiry" },
  { value: "general", label: "General Inquiry" },
  { value: "other", label: "Other" },
];

const INVESTOR_TYPES = ["prospective_investor", "family_office", "institutional_investor"];
const TRADER_TYPES = ["quant_trader", "portfolio_manager"];

function getPriorityTag(inquiry_type) {
  if (inquiry_type === "institutional_investor") return "institutional";
  if (inquiry_type === "family_office") return "family_office";
  if (inquiry_type === "prospective_investor") return "high_priority_investor";
  if (TRADER_TYPES.includes(inquiry_type)) return "trader_candidate";
  if (inquiry_type === "broker_partnership") return "broker_partner";
  if (inquiry_type === "technology_partnership") return "technology_partner";
  return "general";
}

const inputClass = "mt-2 w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-colors";
const labelClass = "block font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground";
const sectionClass = "pt-8 pb-8 border-b border-border space-y-5";

const Field = React.memo(function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 font-mono text-[10px] text-red-400">{error}</p>}
    </div>
  );
});

export default function ContactForm() {
  const [form, setForm] = useState({
    full_name: "", email: "", organization: "", country: "",
    inquiry_type: "", research_engine: "", allocation_size: "",
    accredited_status: "", trading_experience: "", primary_market: "",
    assets_managed: "", linkedin_profile: "", strategy_description: "",
    company_name: "", website: "", jurisdiction: "", partnership_type: "",
    partnership_proposal: "", tech_category: "", markets_covered: "",
    message: "", consent_info: false, consent_terms: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const set = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);

  const isInvestor = useMemo(() => INVESTOR_TYPES.includes(form.inquiry_type), [form.inquiry_type]);
  const isTrader = useMemo(() => TRADER_TYPES.includes(form.inquiry_type), [form.inquiry_type]);
  const isBroker = useMemo(() => form.inquiry_type === "broker_partnership", [form.inquiry_type]);
  const isTech = useMemo(() => form.inquiry_type === "technology_partnership", [form.inquiry_type]);
  const isLiquidity = useMemo(() => form.inquiry_type === "liquidity_provider", [form.inquiry_type]);

  const validate = useCallback(() => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.country) e.country = "Required";
    if (!form.inquiry_type) e.inquiry_type = "Required";
    if (isInvestor) {
      if (!form.research_engine) e.research_engine = "Required";
      if (!form.allocation_size) e.allocation_size = "Required";
      if (!form.accredited_status) e.accredited_status = "Required";
    }
    if (isTrader) {
      if (!form.trading_experience) e.trading_experience = "Required";
      if (!form.primary_market) e.primary_market = "Required";
      if (!form.strategy_description.trim()) e.strategy_description = "Required";
    }
    if (isBroker) {
      if (!form.company_name.trim()) e.company_name = "Required";
      if (!form.website.trim()) e.website = "Required";
      if (!form.jurisdiction.trim()) e.jurisdiction = "Required";
      if (!form.partnership_type) e.partnership_type = "Required";
      if (!form.partnership_proposal.trim()) e.partnership_proposal = "Required";
    }
    if (isTech) {
      if (!form.company_name.trim()) e.company_name = "Required";
      if (!form.website.trim()) e.website = "Required";
      if (!form.tech_category) e.tech_category = "Required";
      if (!form.strategy_description.trim()) e.strategy_description = "Required";
    }
    if (isLiquidity) {
      if (!form.company_name.trim()) e.company_name = "Required";
      if (!form.website.trim()) e.website = "Required";
      if (!form.markets_covered) e.markets_covered = "Required";
      if (!form.strategy_description.trim()) e.strategy_description = "Required";
    }
    if (!form.message.trim()) e.message = "Required";
    if (!form.consent_info) e.consent_info = "Required";
    if (!form.consent_terms) e.consent_terms = "Required";
    return e;
  }, [form, isInvestor, isTrader, isBroker, isTech, isLiquidity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await base44.functions.invoke("notifyNewInquiry", {
        full_name: form.full_name,
        email: form.email,
        organization: form.organization,
        country: form.country,
        phone: form.phone || "",
        inquiry_type: form.inquiry_type,
        message: form.message,
        priority_tag: getPriorityTag(form.inquiry_type),
      });
    } catch (e) {
      console.error("Submission error:", e);
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="border border-border p-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-6">Submission Confirmed</p>
        <h2 className="font-heading text-4xl text-foreground mb-6">Thank you for your inquiry.</h2>
        <p className="font-mono text-xs leading-7 text-muted-foreground mb-8 max-w-lg mx-auto">
          Our team will review your submission and respond if additional information or next steps are required.
        </p>
        <div className="inline-flex items-center gap-3 border border-border px-6 py-3">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block"></span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Submission Status: Under Review</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">

      {/* Core Fields */}
      <div className={sectionClass}>
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground border-b border-border pb-4 mb-2">Contact Information</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="full_name" label="Full Name" required error={errors.full_name}>
            <input key="full_name" id="full_name" type="text" value={form.full_name} onChange={e => { set("full_name", e.target.value); setErrors(p => ({...p, full_name: ""})); }} className={inputClass} />
          </Field>
          <Field id="email" label="Email Address" required error={errors.email}>
            <input key="email" id="email" type="email" value={form.email} onChange={e => { set("email", e.target.value); setErrors(p => ({...p, email: ""})); }} className={inputClass} />
          </Field>
          <Field id="organization" label="Organization / Company">
            <input key="organization" id="organization" type="text" value={form.organization} onChange={e => set("organization", e.target.value)} className={inputClass} />
          </Field>
          <Field id="country" label="Country of Residence" required error={errors.country}>
            <select key="country" id="country" value={form.country} onChange={e => { set("country", e.target.value); setErrors(p => ({...p, country: ""})); }} className={inputClass}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field id="inquiry_type" label="Inquiry Type" required error={errors.inquiry_type}>
          <select key="inquiry_type" id="inquiry_type" value={form.inquiry_type} onChange={e => { set("inquiry_type", e.target.value); setErrors(p => ({...p, inquiry_type: ""})); }} className={inputClass}>
            <option value="">Select inquiry type</option>
            {INQUIRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
      </div>

      {/* Investor Fields */}
      {isInvestor && (
        <div className={sectionClass}>
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground border-b border-border pb-4 mb-2">Investor Details</p>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="research_engine" label="Research Engine of Interest" required error={errors.research_engine}>
              <select key="research_engine" id="research_engine" value={form.research_engine} onChange={e => { set("research_engine", e.target.value); setErrors(p => ({...p, research_engine: ""})); }} className={inputClass}>
                <option value="">Select engine</option>
                <option value="commodities">Commodities Engine</option>
                <option value="digital">Digital Assets Engine</option>
                <option value="equities">Equity Indices Engine</option>
                <option value="general">General Inquiry</option>
              </select>
            </Field>
            <Field id="allocation_size" label="Indicative Allocation Size" required error={errors.allocation_size}>
              <select key="allocation_size" id="allocation_size" value={form.allocation_size} onChange={e => { set("allocation_size", e.target.value); setErrors(p => ({...p, allocation_size: ""})); }} className={inputClass}>
                <option value="">Select range</option>
                <option value="under_25k">Under $25,000</option>
                <option value="25k_100k">$25,000 – $100,000</option>
                <option value="100k_250k">$100,000 – $250,000</option>
                <option value="250k_500k">$250,000 – $500,000</option>
                <option value="500k_1m">$500,000 – $1,000,000</option>
                <option value="1m_5m">$1,000,000 – $5,000,000</option>
                <option value="5m_plus">$5,000,000+</option>
              </select>
            </Field>
            <Field id="accredited_status" label="Accredited / Professional Investor" required error={errors.accredited_status}>
              <select key="accredited_status" id="accredited_status" value={form.accredited_status} onChange={e => { set("accredited_status", e.target.value); setErrors(p => ({...p, accredited_status: ""})); }} className={inputClass}>
                <option value="">Select status</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unsure">Unsure</option>
              </select>
            </Field>
          </div>
        </div>
      )}

      {/* Trader / PM Fields */}
      {isTrader && (
        <div className={sectionClass}>
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground border-b border-border pb-4 mb-2">Professional Background</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="trading_experience" label="Years of Trading Experience" required error={errors.trading_experience}>
              <select key="trading_experience" id="trading_experience" value={form.trading_experience} onChange={e => { set("trading_experience", e.target.value); setErrors(p => ({...p, trading_experience: ""})); }} className={inputClass}>
                <option value="">Select range</option>
                <option value="0_2">0–2 Years</option>
                <option value="2_5">2–5 Years</option>
                <option value="5_10">5–10 Years</option>
                <option value="10_plus">10+ Years</option>
              </select>
            </Field>
            <Field id="primary_market" label="Primary Market" required error={errors.primary_market}>
              <select key="primary_market" id="primary_market" value={form.primary_market} onChange={e => { set("primary_market", e.target.value); setErrors(p => ({...p, primary_market: ""})); }} className={inputClass}>
                <option value="">Select market</option>
                <option value="commodities">Commodities</option>
                <option value="forex">Foreign Exchange</option>
                <option value="digital">Digital Assets</option>
                <option value="equities">Equity Indices</option>
                <option value="multi_asset">Multi-Asset</option>
              </select>
            </Field>
            <Field id="assets_managed" label="Current or Historical Assets Managed">
              <input key="assets_managed" id="assets_managed" type="text" value={form.assets_managed} onChange={e => set("assets_managed", e.target.value)} className={inputClass} placeholder="e.g. $2M AUM, proprietary capital" />
            </Field>
            <Field id="linkedin_profile" label="LinkedIn Profile">
              <input key="linkedin_profile" id="linkedin_profile" type="text" value={form.linkedin_profile} onChange={e => set("linkedin_profile", e.target.value)} className={inputClass} placeholder="https://linkedin.com/in/..." />
            </Field>
          </div>
          <Field id="strategy_description" label="Strategy Description" required error={errors.strategy_description}>
            <textarea key="strategy_description" id="strategy_description" rows={5} value={form.strategy_description} onChange={e => { set("strategy_description", e.target.value); setErrors(p => ({...p, strategy_description: ""})); }} className={inputClass} placeholder="Describe your strategy, research process, risk management framework, and relevant experience." />
          </Field>
        </div>
      )}

      {/* Broker / Exchange Fields */}
      {isBroker && (
        <div className={sectionClass}>
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground border-b border-border pb-4 mb-2">Partnership Details</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="company_name" label="Company Name" required error={errors.company_name}>
              <input key="company_name_broker" id="company_name" type="text" value={form.company_name} onChange={e => { set("company_name", e.target.value); setErrors(p => ({...p, company_name: ""})); }} className={inputClass} />
            </Field>
            <Field id="website" label="Website" required error={errors.website}>
              <input key="website_broker" id="website" type="text" value={form.website} onChange={e => { set("website", e.target.value); setErrors(p => ({...p, website: ""})); }} className={inputClass} placeholder="https://" />
            </Field>
            <Field id="jurisdiction" label="Jurisdiction" required error={errors.jurisdiction}>
              <input key="jurisdiction_broker" id="jurisdiction" type="text" value={form.jurisdiction} onChange={e => { set("jurisdiction", e.target.value); setErrors(p => ({...p, jurisdiction: ""})); }} className={inputClass} />
            </Field>
            <Field id="partnership_type" label="Partnership Type" required error={errors.partnership_type}>
              <select key="partnership_type" id="partnership_type" value={form.partnership_type} onChange={e => { set("partnership_type", e.target.value); setErrors(p => ({...p, partnership_type: ""})); }} className={inputClass}>
                <option value="">Select type</option>
                <option value="broker">Broker</option>
                <option value="exchange">Exchange</option>
                <option value="prime_broker">Prime Broker</option>
                <option value="prop_firm">Prop Firm</option>
                <option value="introducing_broker">Introducing Broker</option>
                <option value="liquidity_provider">Liquidity Provider</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <Field id="partnership_proposal" label="Partnership Proposal" required error={errors.partnership_proposal}>
            <textarea key="partnership_proposal" id="partnership_proposal" rows={5} value={form.partnership_proposal} onChange={e => { set("partnership_proposal", e.target.value); setErrors(p => ({...p, partnership_proposal: ""})); }} className={inputClass} placeholder="Describe the nature and scope of the proposed partnership." />
          </Field>
        </div>
      )}

      {/* Technology Partnership Fields */}
      {isTech && (
        <div className={sectionClass}>
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground border-b border-border pb-4 mb-2">Technology Details</p>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="company_name" label="Company Name" required error={errors.company_name}>
              <input key="company_name_tech" id="company_name" type="text" value={form.company_name} onChange={e => { set("company_name", e.target.value); setErrors(p => ({...p, company_name: ""})); }} className={inputClass} />
            </Field>
            <Field id="website" label="Website" required error={errors.website}>
              <input key="website_tech" id="website" type="text" value={form.website} onChange={e => { set("website", e.target.value); setErrors(p => ({...p, website: ""})); }} className={inputClass} placeholder="https://" />
            </Field>
            <Field id="tech_category" label="Category" required error={errors.tech_category}>
              <select key="tech_category" id="tech_category" value={form.tech_category} onChange={e => { set("tech_category", e.target.value); setErrors(p => ({...p, tech_category: ""})); }} className={inputClass}>
                <option value="">Select category</option>
                <option value="market_data">Market Data</option>
                <option value="execution">Execution Infrastructure</option>
                <option value="ai">Artificial Intelligence</option>
                <option value="risk">Risk Management</option>
                <option value="compliance">Compliance</option>
                <option value="analytics">Analytics</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <Field id="strategy_description" label="Description" required error={errors.strategy_description}>
            <textarea key="strategy_description_tech" id="strategy_description" rows={5} value={form.strategy_description} onChange={e => { set("strategy_description", e.target.value); setErrors(p => ({...p, strategy_description: ""})); }} className={inputClass} placeholder="Describe your technology, its capabilities, and how it may complement north scale's operations." />
          </Field>
        </div>
      )}

      {/* Liquidity Provider Fields */}
      {isLiquidity && (
        <div className={sectionClass}>
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground border-b border-border pb-4 mb-2">Liquidity Details</p>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="company_name" label="Company Name" required error={errors.company_name}>
              <input key="company_name_liquidity" id="company_name" type="text" value={form.company_name} onChange={e => { set("company_name", e.target.value); setErrors(p => ({...p, company_name: ""})); }} className={inputClass} />
            </Field>
            <Field id="website" label="Website" required error={errors.website}>
              <input key="website_liquidity" id="website" type="text" value={form.website} onChange={e => { set("website", e.target.value); setErrors(p => ({...p, website: ""})); }} className={inputClass} placeholder="https://" />
            </Field>
            <Field id="markets_covered" label="Markets Covered" required error={errors.markets_covered}>
              <select key="markets_covered" id="markets_covered" value={form.markets_covered} onChange={e => { set("markets_covered", e.target.value); setErrors(p => ({...p, markets_covered: ""})); }} className={inputClass}>
                <option value="">Select markets</option>
                <option value="commodities">Commodities</option>
                <option value="fx">FX</option>
                <option value="digital">Digital Assets</option>
                <option value="multi_asset">Multi-Asset</option>
              </select>
            </Field>
          </div>
          <Field id="strategy_description" label="Description" required error={errors.strategy_description}>
            <textarea key="strategy_description_liquidity" id="strategy_description" rows={5} value={form.strategy_description} onChange={e => { set("strategy_description", e.target.value); setErrors(p => ({...p, strategy_description: ""})); }} className={inputClass} placeholder="Describe the liquidity services and markets you operate in." />
          </Field>
        </div>
      )}

      {/* General Message */}
      <div className={sectionClass}>
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted-foreground border-b border-border pb-4 mb-2">Message</p>
        <Field id="message" label="Additional Information" required error={errors.message}>
          <textarea key="message" id="message" rows={5} value={form.message} onChange={e => { set("message", e.target.value); setErrors(p => ({...p, message: ""})); }} className={inputClass} placeholder="Please provide any additional information relevant to your inquiry." />
        </Field>
      </div>

      {/* Consent */}
      <div className="space-y-4 pt-8 border-b border-border pb-8">
        <label className="flex items-start gap-4 cursor-pointer group">
          <input type="checkbox" checked={form.consent_info} onChange={e => { set("consent_info", e.target.checked); setErrors(p => ({...p, consent_info: ""})); }} className="mt-0.5 flex-shrink-0 w-4 h-4 border border-border bg-background accent-foreground cursor-pointer" />
          <span className="font-mono text-[10px] leading-5 text-muted-foreground group-hover:text-foreground transition-colors">
            I acknowledge that north scale does not provide investment advice through this website and that all information is provided for informational purposes only.
            {errors.consent_info && <span className="text-red-400 ml-2">Required</span>}
          </span>
        </label>
        <label className="flex items-start gap-4 cursor-pointer group">
          <input type="checkbox" checked={form.consent_terms} onChange={e => { set("consent_terms", e.target.checked); setErrors(p => ({...p, consent_terms: ""})); }} className="mt-0.5 flex-shrink-0 w-4 h-4 border border-border bg-background accent-foreground cursor-pointer" />
          <span className="font-mono text-[10px] leading-5 text-muted-foreground group-hover:text-foreground transition-colors">
            I have read and agree to the{" "}
            <Link to="/privacy-policy" className="text-foreground underline underline-offset-2">Privacy Policy</Link>,{" "}
            <Link to="/terms-of-use" className="text-foreground underline underline-offset-2">Terms of Use</Link>, and{" "}
            <Link to="/disclaimer" className="text-foreground underline underline-offset-2">Disclaimer</Link>.
            {errors.consent_terms && <span className="text-red-400 ml-2">Required</span>}
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-[0.24em] px-10 py-4 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Request Review"}
      </button>
    </form>
  );
}