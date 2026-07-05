import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// OperationsCenter is now the Operations workspace inside AdminPortal.
// Redirect old deep-links preserving the section param where possible.
export default function OperationsCenter() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const s = searchParams.get("s") || "";
    const sMap = { home: "home", approvals: "approvals", tasks: "tasks", analytics: "reports", team: "team" };
    const mapped = sMap[s] || "home";
    window.location.replace(`/admin-portal?m=operations&s=${mapped}`);
  }, []);
  return null;
}