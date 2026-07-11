// Shareable-link helpers: encode/decode a built-in preset selection (plus its
// view flags) as plain, human-readable URL query params. Scope is
// intentionally preset-only — hand-painted conductors are never serialized
// (see the "Shareable preset links" plan).
//
// Example 2D link:
//   ?mode=2d&preset=threephase&ac=1&acPeriod=5&heatmap=1&equipotentials=1&arrows=0&streamlines=1&surface3d=0
// Example 3D link:
//   ?mode=3d&preset=coax&equipotentials=1&fieldlines=0
import { PRESETS, type PresetId } from "@/lib/presets";
import { PRESETS_3D, type Preset3DId } from "@/lib/presets3d";
import type { DisplayFlags } from "@/types";

export type SharePayload =
  | {
      mode: "2d";
      preset: PresetId;
      ac: { enabled: boolean; periodSec: number };
      display: DisplayFlags;
    }
  | {
      mode: "3d";
      preset: Preset3DId;
      display: { equipotentials: boolean; fieldLines: boolean };
    };

function boolParam(b: boolean): string {
  return b ? "1" : "0";
}

function parseBool(v: string | null): boolean {
  return v === "1";
}

/** Build the query string (no leading `?`) for a payload. */
export function encodeShare(p: SharePayload): string {
  const params = new URLSearchParams();
  params.set("mode", p.mode);
  params.set("preset", p.preset);
  if (p.mode === "2d") {
    params.set("ac", boolParam(p.ac.enabled));
    params.set("acPeriod", String(p.ac.periodSec));
    params.set("heatmap", boolParam(p.display.heatmap));
    params.set("equipotentials", boolParam(p.display.equipotentials));
    params.set("arrows", boolParam(p.display.arrows));
    params.set("streamlines", boolParam(p.display.streamlines));
    params.set("surface3d", boolParam(p.display.surface3D));
  } else {
    params.set("equipotentials", boolParam(p.display.equipotentials));
    params.set("fieldlines", boolParam(p.display.fieldLines));
  }
  return params.toString();
}

/** Parse a query string (or `URLSearchParams`) back into a payload, or null. */
export function decodeShare(input: string | URLSearchParams): SharePayload | null {
  const params =
    typeof input === "string" ? new URLSearchParams(input) : input;
  const mode = params.get("mode");
  const preset = params.get("preset");
  if (!preset) return null;

  if (mode === "2d") {
    if (!Object.keys(PRESETS).includes(preset)) return null;
    const periodRaw = Number(params.get("acPeriod"));
    const periodSec = Number.isFinite(periodRaw) && periodRaw > 0 ? periodRaw : 5;
    return {
      mode: "2d",
      preset: preset as PresetId,
      ac: { enabled: parseBool(params.get("ac")), periodSec },
      display: {
        heatmap: parseBool(params.get("heatmap")),
        equipotentials: parseBool(params.get("equipotentials")),
        arrows: parseBool(params.get("arrows")),
        streamlines: parseBool(params.get("streamlines")),
        surface3D: parseBool(params.get("surface3d")),
      },
    };
  }

  if (mode === "3d") {
    if (!Object.keys(PRESETS_3D).includes(preset)) return null;
    return {
      mode: "3d",
      preset: preset as Preset3DId,
      display: {
        equipotentials: parseBool(params.get("equipotentials")),
        fieldLines: parseBool(params.get("fieldlines")),
      },
    };
  }

  return null;
}

export function readShareFromUrl(): SharePayload | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.get("mode")) return null;
  return decodeShare(params);
}

export function buildShareUrl(p: SharePayload): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?${encodeShare(p)}`;
}

export function clearShareParam(): void {
  if (typeof window === "undefined") return;
  if (!new URLSearchParams(window.location.search).has("mode")) return;
  window.history.replaceState(null, "", window.location.pathname);
}
