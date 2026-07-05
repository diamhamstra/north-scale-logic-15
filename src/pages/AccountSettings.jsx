import { Navigate } from "react-router-dom";

// Account Settings has moved into Portal → Settings module.
// This redirect maintains backward compatibility with any saved links.
export default function AccountSettings() {
  return <Navigate to="/portal?m=settings" replace />;
}
