"use client";

import { useMemo, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Tool } from "@/types";

interface ToolbarProps {
  tool: Tool;
  voltage: number;
  brushSize: number;
  onToolChange: (t: Tool) => void;
  onVoltageChange: (v: number) => void;
  onBrushChange: (b: number) => void;
}

const VOLTAGE_PRESETS: { value: number; label: string }[] = [
  { value: 100, label: "100 V" },
  { value: 220, label: "220 V" },
  { value: 100_000, label: "100 kV" },
  { value: Math.round(Math.sqrt(2 / 3) * 500_000), label: "√(2/3) * 500 kV" },
];

interface ToolOption {
  id: Tool;
  color: string;
  activeBg: string;
  activeFg: string;
}

const TOOLS: ToolOption[] = [
  { id: "pos", color: "#791F1F", activeBg: "#791F1F", activeFg: "#ffffff" },
  { id: "neg", color: "#0C447C", activeBg: "#0C447C", activeFg: "#ffffff" },
  { id: "gnd", color: "#2C2C2A", activeBg: "#2C2C2A", activeFg: "#ffffff" },
  { id: "era", color: "#52525b", activeBg: "#e5e7eb", activeFg: "#111827" },
  { id: "line", color: "#CA8A04", activeBg: "#CA8A04", activeFg: "#ffffff" },
  { id: "curve", color: "#CA8A04", activeBg: "#CA8A04", activeFg: "#ffffff" },
];

export function Toolbar({
  tool,
  voltage,
  brushSize,
  onToolChange,
  onVoltageChange,
  onBrushChange,
}: ToolbarProps) {
  const { t } = useLanguage();
  const [voltageText, setVoltageText] = useState(String(voltage));

  const toolLabels = useMemo(
    () => ({
      pos: t("toolbar.tool_pos"),
      neg: t("toolbar.tool_neg"),
      gnd: t("toolbar.tool_gnd"),
      era: t("toolbar.tool_era"),
      line: t("toolbar.tool_line"),
      curve: t("toolbar.tool_curve"),
    }),
    [t],
  );

  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("toolbar.tool")}</span>
        {TOOLS.map((t) => {
          const active = t.id === tool;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToolChange(t.id)}
              className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              style={
                active
                  ? {
                      backgroundColor: t.activeBg,
                      color: t.activeFg,
                      borderColor: t.activeBg,
                    }
                  : {
                      backgroundColor: "white",
                      color: t.color,
                      borderColor: "#e4e4e7",
                    }
              }
            >
              {toolLabels[t.id]}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>{t("toolbar.potential")}</span>
          <select
            value={VOLTAGE_PRESETS.some((p) => p.value === voltage) ? voltage : ""}
            onChange={(e) => {
              if (e.target.value !== "") {
                const v = Number(e.target.value);
                onVoltageChange(v);
                setVoltageText(String(v));
              }
            }}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">{t("toolbar.custom_voltage")}</option>
            {VOLTAGE_PRESETS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={voltageText}
            onChange={(e) => {
              setVoltageText(e.target.value);
              const n = Number(e.target.value);
              if (e.target.value !== "" && isFinite(n)) onVoltageChange(n);
            }}
            className="w-28 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="w-20">{t("toolbar.brush")} {brushSize}</span>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={brushSize}
            onChange={(e) => onBrushChange(Number(e.target.value))}
            className="w-32"
          />
        </label>
      </div>
    </div>
  );
}
