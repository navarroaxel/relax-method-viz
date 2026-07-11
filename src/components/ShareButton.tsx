"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareButtonProps {
  disabled: boolean;
  getUrl: () => string;
}

export function ShareButton({ disabled, getUrl }: ShareButtonProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("", url); // clipboard blocked — let the user copy manually
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={disabled ? t("share.hint_custom") : undefined}
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {copied ? t("share.copied") : t("share.button")}
    </button>
  );
}
