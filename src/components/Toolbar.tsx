"use client";

import type { Tool } from "@/types";

interface ToolbarProps {
  tool: Tool;
  voltage: number;
  brushSize: number;
  onToolChange: (t: Tool) => void;
  onVoltageChange: (v: number) => void;
  onBrushChange: (b: number) => void;
}

interface ToolOption {
  id: Tool;
  label: string;
  color: string;
  activeBg: string;
  activeFg: string;
}

const TOOLS: ToolOption[] = [
  {
    id: "pos",
    label: "+V",
    color: "#791F1F",
    activeBg: "#791F1F",
    activeFg: "#ffffff",
  },
  {
    id: "neg",
    label: "−V",
    color: "#0C447C",
    activeBg: "#0C447C",
    activeFg: "#ffffff",
  },
  {
    id: "gnd",
    label: "Tierra (0)",
    color: "#2C2C2A",
    activeBg: "#2C2C2A",
    activeFg: "#ffffff",
  },
  {
    id: "era",
    label: "Borrar",
    color: "#52525b",
    activeBg: "#e5e7eb",
    activeFg: "#111827",
  },
];

export function Toolbar({
  tool,
  voltage,
  brushSize,
  onToolChange,
  onVoltageChange,
  onBrushChange,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Herramienta:</span>
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
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="w-20">Voltaje: {voltage}</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={voltage}
            onChange={(e) => onVoltageChange(Number(e.target.value))}
            className="w-40"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="w-20">Pincel: {brushSize}</span>
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
