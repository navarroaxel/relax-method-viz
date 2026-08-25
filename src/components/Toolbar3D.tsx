"use client";

import { useMemo, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import type { SliceAxis, Tool3D } from "@/types/grid3d";

interface Toolbar3DProps {
  tool: Tool3D;
  voltage: number;
  thickness: number;
  radius: number;
  sliceAxis: SliceAxis;
  onToolChange: (t: Tool3D) => void;
  onVoltageChange: (v: number) => void;
  onThicknessChange: (t: number) => void;
  onRadiusChange: (r: number) => void;
  onSliceAxisChange: (a: SliceAxis) => void;
}

const TOOLS: {
  id: Tool3D;
  activeBg: string;
  activeFg: string;
  color: string;
}[] = [
  { id: "wire", activeBg: "#791F1F", activeFg: "#fff", color: "#791F1F" },
  { id: "plate", activeBg: "#0C447C", activeFg: "#fff", color: "#0C447C" },
  { id: "sphere", activeBg: "#7C2D8C", activeFg: "#fff", color: "#7C2D8C" },
  { id: "cylinder", activeBg: "#1F6A4D", activeFg: "#fff", color: "#1F6A4D" },
  { id: "era", activeBg: "#e5e7eb", activeFg: "#111827", color: "#52525b" },
];

const VOLTAGE_PRESETS: { value: number; label: string }[] = [
  { value: 100, label: "100 V" },
  { value: 100_000, label: "100 kV" },
];

export function Toolbar3D({
  tool,
  voltage,
  thickness,
  radius,
  sliceAxis,
  onToolChange,
  onVoltageChange,
  onThicknessChange,
  onRadiusChange,
  onSliceAxisChange,
}: Toolbar3DProps) {
  const { t } = useLanguage();
  const [voltageText, setVoltageText] = useState(String(voltage));

  const labels = useMemo(
    () => ({
      wire: t("toolbar3d.tool_wire"),
      plate: t("toolbar3d.tool_plate"),
      sphere: t("toolbar3d.tool_sphere"),
      cylinder: t("toolbar3d.tool_cylinder"),
      era: t("toolbar3d.tool_era"),
    }),
    [t],
  );

  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("toolbar3d.tool")}
        </span>
        {TOOLS.map((opt) => {
          const active = opt.id === tool;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToolChange(opt.id)}
              className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              style={
                active
                  ? {
                      backgroundColor: opt.activeBg,
                      color: opt.activeFg,
                      borderColor: opt.activeBg,
                    }
                  : {
                      backgroundColor: "white",
                      color: opt.color,
                      borderColor: "#e4e4e7",
                    }
              }
            >
              {labels[opt.id]}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>{t("toolbar3d.potential")}</span>
          <div className="inline-flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
            {(
              [
                {
                  key: "pos",
                  label: t("toolbar.tool_pos"),
                  active: voltage > 0,
                  bg: "#791F1F",
                  set: () => {
                    const v = Math.abs(voltage) || 100;
                    onVoltageChange(v);
                    setVoltageText(String(v));
                  },
                },
                {
                  key: "neg",
                  label: t("toolbar.tool_neg"),
                  active: voltage < 0,
                  bg: "#0C447C",
                  set: () => {
                    const v = -(Math.abs(voltage) || 100);
                    onVoltageChange(v);
                    setVoltageText(String(v));
                  },
                },
                {
                  key: "gnd",
                  label: t("toolbar.tool_gnd"),
                  active: voltage === 0,
                  bg: "#2C2C2A",
                  set: () => {
                    onVoltageChange(0);
                    setVoltageText("0");
                  },
                },
              ] as const
            ).map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={b.set}
                className="px-3 py-1 text-sm font-medium transition-colors"
                style={
                  b.active
                    ? { backgroundColor: b.bg, color: "#fff" }
                    : { backgroundColor: "white", color: "#3f3f46" }
                }
              >
                {b.label}
              </button>
            ))}
          </div>
          <select
            value={
              VOLTAGE_PRESETS.some((p) => p.value === voltage) ? voltage : ""
            }
            onChange={(e) => {
              if (e.target.value !== "") {
                const v = Number(e.target.value);
                onVoltageChange(v);
                setVoltageText(String(v));
              }
            }}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">{t("toolbar3d.custom_voltage")}</option>
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
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="w-28">
            {t("toolbar3d.thickness")} {thickness}
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={thickness}
            onChange={(e) => onThicknessChange(Number(e.target.value))}
            className="w-28"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="w-28">
            {t("toolbar3d.radius")} {radius}
          </span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-28"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span>{t("toolbar3d.slice_axis")}</span>
          <select
            value={sliceAxis}
            onChange={(e) => onSliceAxisChange(e.target.value as SliceAxis)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="x">X</option>
            <option value="y">Y</option>
            <option value="z">Z</option>
          </select>
        </label>
      </div>
    </div>
  );
}
