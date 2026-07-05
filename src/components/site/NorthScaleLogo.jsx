import React from "react";

export default function NorthScaleLogo({ className = "", size = "medium" }) {
  const sizeClasses = {
    small: "h-6",
    medium: "h-8",
    large: "h-12",
    xl: "h-16"
  };

  return (
    <svg
      viewBox="0 0 280 40"
      className={`${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left slash */}
      <text
        x="0"
        y="28"
        className="font-mono"
        fill="currentColor"
        fontSize="28"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="300"
      >
        /
      </text>
      
      {/* Brand name */}
      <text
        x="24"
        y="26"
        className="font-heading"
        fill="currentColor"
        fontSize="18"
        fontFamily="Instrument Serif, Georgia, serif"
        letterSpacing="4.5"
      >
        north scale
      </text>
      
      {/* Right slash */}
      <text
        x="268"
        y="28"
        className="font-mono"
        fill="currentColor"
        fontSize="28"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="300"
      >
        /
      </text>
    </svg>
  );
}