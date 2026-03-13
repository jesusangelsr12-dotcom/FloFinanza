import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "sm" | "flat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "rounded-card border border-border p-5 shadow-card",
  sm: "rounded-sm border border-border p-4 shadow-card",
  flat: "rounded-card border border-border p-5",
};

export default function Card({
  children,
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-card ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
