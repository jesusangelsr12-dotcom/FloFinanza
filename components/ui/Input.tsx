import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="font-display text-xs font-bold text-ink-2"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full p-3.5 rounded-sm border border-border-2 bg-bg font-body text-sm text-ink focus:border-accent-blue focus:bg-white outline-none transition ${className}`}
        {...props}
      />
    </div>
  );
}
