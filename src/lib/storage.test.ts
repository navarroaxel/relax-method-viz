import { afterEach, describe, expect, it, vi } from "vitest";
import { applyGeometryToGrid, exportToJSON, importFromJSON } from "@/lib/storage";
import { createGrid, idx } from "@/lib/grid";

describe("exportToJSON / importFromJSON / applyGeometryToGrid round-trip", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves fixed cells, Vfix, and phase through a round-trip", () => {
    vi.spyOn(Date, "now").mockReturnValue(123456);

    const N = 20;
    const grid = createGrid(N);

    // Cell with no phase (3-tuple path).
    const kA = idx(3, 4, N);
    grid.fixed[kA] = 1;
    grid.Vfix[kA] = 100;
    grid.V[kA] = 100;

    // Cell with nonzero phase (4-tuple path).
    const kB = idx(7, 8, N);
    grid.fixed[kB] = 1;
    grid.Vfix[kB] = -50;
    grid.V[kB] = -50;
    grid.phase[kB] = Math.PI / 3;

    const json = exportToJSON(grid, "test-geo");
    const parsed = JSON.parse(json) as { createdAt: number; name: string };
    expect(parsed.createdAt).toBe(123456);
    expect(parsed.name).toBe("test-geo");

    const geometry = importFromJSON(json);
    expect(geometry).not.toBeNull();

    const fresh = createGrid(N);
    applyGeometryToGrid(fresh, geometry!);

    expect(fresh.fixed[kA]).toBe(1);
    expect(fresh.Vfix[kA]).toBeCloseTo(100, 5);
    expect(fresh.phase[kA]).toBeCloseTo(0, 5);

    expect(fresh.fixed[kB]).toBe(1);
    expect(fresh.Vfix[kB]).toBeCloseTo(-50, 5);
    expect(fresh.phase[kB]).toBeCloseTo(Math.PI / 3, 2);
  });

  it("clears pre-existing fixed cells not present in the imported geometry", () => {
    const N = 10;
    const grid = createGrid(N);
    const stale = idx(1, 1, N);
    grid.fixed[stale] = 1;
    grid.Vfix[stale] = 999;
    grid.V[stale] = 999;

    const geometry = importFromJSON(
      JSON.stringify({
        name: "g",
        N,
        createdAt: 1,
        cells: [[2, 2, 50]],
      }),
    );
    expect(geometry).not.toBeNull();

    applyGeometryToGrid(grid, geometry!);

    expect(grid.fixed[stale]).toBe(0);
    expect(grid.fixed[idx(2, 2, N)]).toBe(1);
    expect(grid.Vfix[idx(2, 2, N)]).toBeCloseTo(50, 5);
  });

  it("skips out-of-bounds cells", () => {
    // isSavedGeometry requires cell coords to be within [0, N); to exercise
    // applyGeometryToGrid's own bounds check we build a SavedGeometry object
    // directly (bypassing importFromJSON's validation) with an out-of-range
    // cell relative to the grid we apply it to (grid N=5 < geometry N=10).
    const smallGrid = createGrid(5);
    applyGeometryToGrid(smallGrid, {
      name: "g",
      N: 10,
      createdAt: 1,
      cells: [
        [9, 9, 10], // out of bounds for N=5
        [1, 1, 20], // in bounds
      ],
    });

    expect(smallGrid.fixed[idx(1, 1, 5)]).toBe(1);
    expect(smallGrid.Vfix[idx(1, 1, 5)]).toBeCloseTo(20, 5);
    // Nothing should have been written for the out-of-bounds cell; grid only
    // has 25 cells total, so idx(9,9,5) would be out of the typed array too.
    for (let i = 0; i < smallGrid.fixed.length; i++) {
      if (i !== idx(1, 1, 5)) {
        expect(smallGrid.fixed[i]).toBe(0);
      }
    }
  });
});

describe("importFromJSON validation", () => {
  it("returns null for malformed/non-JSON strings", () => {
    expect(importFromJSON("not json at all {{{")).toBeNull();
    expect(importFromJSON("")).toBeNull();
    expect(importFromJSON("null")).toBeNull();
    expect(importFromJSON("42")).toBeNull();
    expect(importFromJSON('"a string"')).toBeNull();
  });

  it("returns null when N exceeds MAX_GRID_N (512)", () => {
    const json = JSON.stringify({
      name: "g",
      N: 513,
      createdAt: 1,
      cells: [],
    });
    expect(importFromJSON(json)).toBeNull();
  });

  it("accepts N at the boundary (512)", () => {
    const json = JSON.stringify({
      name: "g",
      N: 512,
      createdAt: 1,
      cells: [],
    });
    expect(importFromJSON(json)).not.toBeNull();
  });

  it("returns null for a cell with |V| > 1e6", () => {
    const json = JSON.stringify({
      name: "g",
      N: 10,
      createdAt: 1,
      cells: [[0, 0, 1_000_001]],
    });
    expect(importFromJSON(json)).toBeNull();
  });

  it("returns null for a cell with a bad shape (wrong tuple length)", () => {
    const json = JSON.stringify({
      name: "g",
      N: 10,
      createdAt: 1,
      cells: [[0, 0]], // only 2 elements
    });
    expect(importFromJSON(json)).toBeNull();

    const json5 = JSON.stringify({
      name: "g",
      N: 10,
      createdAt: 1,
      cells: [[0, 0, 1, 2, 3]], // 5 elements
    });
    expect(importFromJSON(json5)).toBeNull();
  });

  it("returns null for a cell with non-integer coords", () => {
    const json = JSON.stringify({
      name: "g",
      N: 10,
      createdAt: 1,
      cells: [[0.5, 0, 1]],
    });
    expect(importFromJSON(json)).toBeNull();
  });

  it("returns null for a cell with coords out of [0, N)", () => {
    const json = JSON.stringify({
      name: "g",
      N: 10,
      createdAt: 1,
      cells: [[10, 0, 1]], // i === N, out of range
    });
    expect(importFromJSON(json)).toBeNull();
  });
});
