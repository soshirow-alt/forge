"use client";

type AuthGatedHintProps = {
  hint: string;
  className?: string;
};

export function AuthGatedHint({ hint, className = "" }: AuthGatedHintProps) {
  return (
    <p className={`text-[11px] text-zinc-600 ${className}`.trim()} title={hint}>
      {hint}
    </p>
  );
}
