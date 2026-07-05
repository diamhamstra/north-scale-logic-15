import React from "react";

export default function Button({ children, variant = "primary", className = "", ...props }) {
  const baseStyles = "font-mono text-xs uppercase tracking-[0.24em] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "border border-foreground bg-foreground text-background px-8 py-4 hover:bg-transparent hover:text-foreground",
    secondary: "border border-border bg-transparent text-muted-foreground px-8 py-4 hover:border-foreground hover:text-foreground",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}