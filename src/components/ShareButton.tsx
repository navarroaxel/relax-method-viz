"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareButtonProps {
  disabled: boolean;
  getUrl: () => string;
}

export function ShareButton({ disabled, getUrl }: ShareButtonProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Clear the pending "copied" reset if we unmount (e.g. switching 2D/3D mode)
  // within the 1.8s window, so it never fires setState on an unmounted node.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("", url); // clipboard blocked — let the user copy manually
    }
    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const label = disabled
    ? t("share.hint_custom")
    : copied
      ? t("share.copied")
      : t("share.button");

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white p-2 text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
    >
      {copied ? (
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          fill="currentColor"
          className="size-5"
        >
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06L6.75 10.19l5.97-5.97a.75.75 0 0 1 1.06 0z" />
        </svg>
      ) : (
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          fill="currentColor"
          className="size-5"
        >
          <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-4.66 2.33a2.5 2.5 0 0 1 0 1.084l4.66 2.33a2.5 2.5 0 1 1-.67 1.342l-4.66-2.33a2.5 2.5 0 1 1 0-3.768l4.66-2.33A2.5 2.5 0 0 1 11 2.5z" />
        </svg>
      )}
    </button>
  );
}
