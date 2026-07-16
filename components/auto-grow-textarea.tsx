"use client";

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

type AutoGrowTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minHeightPx?: number;
  maxHeightPx?: number;
};

export function AutoGrowTextarea({
  minHeightPx = 160,
  maxHeightPx = 360,
  value,
  className = "",
  onChange,
  style,
  ...rest
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, minHeightPx), maxHeightPx);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeightPx ? "auto" : "hidden";
  }, [value, minHeightPx, maxHeightPx]);

  return (
    <textarea
      {...rest}
      ref={ref}
      value={value}
      onChange={onChange}
      className={className}
      style={{ minHeight: minHeightPx, ...style }}
    />
  );
}
