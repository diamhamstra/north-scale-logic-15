import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// ClientManagement is now the Clients workspace inside AdminPortal.
// Redirect old deep-links preserving the section param where possible.
export default function ClientManagement() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const section = searchParams.get("section") || "";
    const sMap = { clients: "active", leads: "leads", referrals: "referrals", partners: "partners", dashboard: "overview" };
    const s = sMap[section] || "overview";
    window.location.replace(`/admin-portal?m=clients&s=${s}`);
  }, []);
  return null;
}