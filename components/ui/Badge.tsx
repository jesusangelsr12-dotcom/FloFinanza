import type { ReactNode } from "react";

type BadgeColor = "green" | "red" | "purple" | "blue" | "amber";

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  green: "bg-accent-green-bg text-accent-green",
  red: "bg-accent-red-bg text-accent-red",
  purple: "bg-accent-purple-bg text-accent-purple",
  blue: "bg-accent-blue-bg text-accent-blue",
  amber: "bg-accent-amber-bg text-accent-amber",
};

export default function Badge({
  children,
  color = "green",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-block font-display text-xs font-bold px-2.5 py-1 rounded-pill ${colorStyles[color]} ${className}`}
    >
      {children}
    </span>
  );
}
