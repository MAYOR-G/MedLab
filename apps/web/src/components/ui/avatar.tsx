import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base font-semibold",
  xl: "h-16 w-16 text-xl font-bold",
};

// Generates consistent calm clinical background tints based on member name
function getAvatarColor(name: string): string {
  const clinicalPalettes = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-sky-100 text-sky-700 border-sky-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
    "bg-slate-100 text-slate-700 border-slate-200",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % clinicalPalettes.length;
  return clinicalPalettes[index];
}

function getInitials(name: string): string {
  // Strip annotations in parentheses like "(You)" or "(Spouse)"
  const cleanName = name.replace(/\([^)]*\)/g, "").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ML";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, size = "md", className, ...props }, ref) => {
    const initials = getInitials(name);
    const colorClasses = getAvatarColor(name);

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-bold select-none border shrink-0",
          sizeClasses[size],
          colorClasses,
          className
        )}
        aria-label={name}
        {...props}
      >
        {initials}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
