import { describe, expect, it } from "vitest";

import {
  alphaExact,
  circularLoopAxisField,
  coaxInductancePerLength,
  coaxPoynting,
  conductivityFromDepth,
  loopTorque,
  solenoidInductancePerLength,
  solidWireField,
  squareLoopCenterField,
  toroidInductance,
  twoWireInductancePerLength,
  alphaGoodConductor,
  attenuationDistance,
  C0,
  checkAnswer,
  finiteWireField,
  helmholtzCurrent,
  loopNetForce,
  lossRatio,
  MU0,
  parallelWireForcePerLength,
  parseNumber,
  planeWaveInVacuum,
  texNum,
  tubularInternalInductance,
  wireLoopMutual,
} from "./teoriaExercises";

describe("resultados del PDF (TdC Ejercicios 2P)", () => {
  it("2025-10-27 P3: 37,1 A en las bobinas", () => {
    expect(helmholtzCurrent(1, 0.1, 3000)).toBeCloseTo(37.1, 1);
  });

  it("2024-12-16 P1 / 2023-11-13 P2: α ≈ 4π y x ≈ 36,6 cm", () => {
    expect(lossRatio(0.2, 200e6)).toBeCloseTo(17.97, 1);
    const alpha = alphaGoodConductor(0.2, 200e6);
    expect(alpha).toBeCloseTo(4 * Math.PI, 2);
    expect(attenuationDistance(alpha, 99)).toBeCloseTo(0.366, 3);
  });

  it("el α exacto difiere pocos % de la aproximación de buen conductor", () => {
    const approx = alphaGoodConductor(0.2, 200e6);
    expect(Math.abs(alphaExact(0.2, 200e6) - approx) / approx).toBeLessThan(
      0.05,
    );
  });

  it("2024-12-16 P2: con a ≪ L se reduce a μ₀ = 2πF·d(d+h)/(I²·L·h)", () => {
    const g = {
      currentA: 7,
      lengthM: 0.5,
      gapM: 0,
      heightM: 0.08,
      distanceM: 0.03,
    };
    const f = loopNetForce(g);
    const mu0 =
      (2 * Math.PI * f * g.distanceM * (g.distanceM + g.heightM)) /
      (g.currentA ** 2 * g.lengthM * g.heightM);
    expect(mu0).toBeCloseTo(MU0, 12);
  });

  it("2023-12-11 P1: M·100 A = 8,32e-5 Wb y fem máxima 26,1 mV", () => {
    const m = wireLoopMutual(3, 0.3, 0.1);
    expect(m * 100).toBeCloseTo(8.32e-5, 7);
    expect(m * 314 * 100 * 1e3).toBeCloseTo(26.1, 1);
  });

  it("2023-12-11 P2: η₀ ≈ 120π Ω y E_M/c = μ₀H_M", () => {
    const w = planeWaveInVacuum(377, 100e6);
    expect(w.eta).toBeCloseTo(120 * Math.PI, 0);
    expect(w.bMax).toBeCloseTo(377 / C0, 12);
  });

  it("2023-11-13 P1: tiende al conductor infinito cuando r ≪ L", () => {
    const far = finiteWireField(100, 2, 0.1);
    const near = finiteWireField(100, 200, 0.1);
    expect(far.errPct).toBeGreaterThan(near.errPct);
    expect(near.errPct).toBeLessThan(1e-3);
  });

  it("2021-11-15 P1: 1,25 mN/m por par y 2,17 mN/m resultante", () => {
    const f = parallelWireForcePerLength(25, 0.1);
    expect(f * 1e3).toBeCloseTo(1.25, 2);
    expect(Math.sqrt(3) * f * 1e3).toBeCloseTo(2.17, 2);
  });
});

describe("tubularInternalInductance", () => {
  it("coincide con la integración numérica de ½μH² (corrige el resultado final del PDF)", () => {
    const a = 0.02;
    const b = 0.03;
    const n = 200000;
    let w = 0;
    for (let k = 0; k < n; k++) {
      const r = a + ((k + 0.5) * (b - a)) / n;
      const h = (r * r - a * a) / (2 * Math.PI * r * (b * b - a * a));
      w += 0.5 * MU0 * h * h * 2 * Math.PI * r * ((b - a) / n);
    }
    expect(tubularInternalInductance(a, b)).toBeCloseTo(2 * w, 12);
  });

  it("para a → 0 da μ/8π (conductor macizo)", () => {
    expect(tubularInternalInductance(1e-6, 0.01)).toBeCloseTo(
      MU0 / (8 * Math.PI),
      10,
    );
  });
});

describe("helpers", () => {
  it("parseNumber acepta coma y rechaza basura", () => {
    expect(parseNumber(" 37,1 ")).toBe(37.1);
    expect(parseNumber("1e-3")).toBe(0.001);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
  it("checkAnswer usa tolerancia relativa, absoluta y valor alternativo", () => {
    expect(checkAnswer("37", { value: 37.07 })).toBe(true);
    expect(checkAnswer("40", { value: 37.07 })).toBe(false);
    expect(checkAnswer("0", { value: 0, absTol: 1e-6 })).toBe(true);
    expect(checkAnswer("12.2", { value: 12.57, alt: 12.2, relTol: 0.01 })).toBe(
      true,
    );
  });
  it("texNum da 3 cifras y notación científica fuera de rango", () => {
    expect(texNum(37.0712)).toBe("37.1");
    expect(texNum(0.00000253)).toBe("2.53\\times10^{-6}");
    expect(texNum(0)).toBe("0");
  });
});

describe("guía de ejercicios (25 en adelante)", () => {
  it("25: B es continuo en r = b", () => {
    expect(solidWireField(50, 0.005, 0.005 - 1e-12)).toBeCloseTo(
      solidWireField(50, 0.005, 0.005 + 1e-12),
      9,
    );
  });
  it("30: espira cuadrada = suma de 4 lados finitos (Biot–Savart numérico)", () => {
    const w = 0.4;
    const n = 20000;
    let b = 0;
    for (let k = 0; k < n; k++) {
      const x = -w / 2 + ((k + 0.5) * w) / n;
      b +=
        (MU0 / (4 * Math.PI)) *
        (w / 2 / (x * x + (w / 2) ** 2) ** 1.5) *
        (w / n);
    }
    expect(squareLoopCenterField(1, w)).toBeCloseTo(4 * b, 12);
  });
  it("31: en el centro de la espira circular B = μ₀I/2b", () => {
    expect(circularLoopAxisField(3, 0.05, 0)).toBeCloseTo((MU0 * 3) / 0.1, 12);
  });
  it("32/33: toroide y solenoide", () => {
    expect(toroidInductance(100, 0.02, 0.03, 0.06)).toBeCloseTo(
      ((MU0 * 0.02 * 1e4) / (2 * Math.PI)) * Math.log(2),
      12,
    );
    expect(solenoidInductancePerLength(1000, 0.01)).toBeCloseTo(
      MU0 * 1e6 * Math.PI * 1e-4,
      12,
    );
  });
  it("36: coaxial coincide con la integración de ½μH²", () => {
    const a = 0.002;
    const b = 0.006;
    const n = 100000;
    let w = 0;
    for (let k = 0; k < n; k++) {
      const r1 = ((k + 0.5) * a) / n;
      const h1 = r1 / (2 * Math.PI * a * a);
      w += 0.5 * MU0 * h1 * h1 * 2 * Math.PI * r1 * (a / n);
      const r2 = a + ((k + 0.5) * (b - a)) / n;
      const h2 = 1 / (2 * Math.PI * r2);
      w += 0.5 * MU0 * h2 * h2 * 2 * Math.PI * r2 * ((b - a) / n);
    }
    expect(coaxInductancePerLength(a, b)).toBeCloseTo(2 * w, 12);
  });
  it("37: la inductancia interna de dos alambres es μ₀/4π", () => {
    expect(twoWireInductancePerLength(0.001, 0.1).internal).toBeCloseTo(
      MU0 / (4 * Math.PI),
      15,
    );
  });
  it("39: τ = m × B", () => {
    const t = loopTorque(5, 0.1, 0.05, 0.2, 0.1);
    expect(t.tx).toBeCloseTo(-2.5e-3, 9);
    expect(t.ty).toBeCloseTo(5e-3, 9);
  });
  it("47: submarino 30 kHz → ≈ 3 m, 30 MHz → ≈ 9,4 cm (σ = 5 S/m)", () => {
    expect(attenuationDistance(alphaGoodConductor(5, 3e4), 90)).toBeCloseTo(
      2.99,
      1,
    );
    expect(attenuationDistance(alphaGoodConductor(5, 3e7), 90)).toBeCloseTo(
      0.0946,
      3,
    );
  });
  it("50: grafito σ ≈ 9,9·10⁴ S/m", () => {
    expect(conductivityFromDepth(0.16e-3, 1e8) / 1e4).toBeCloseTo(9.9, 1);
  });
  it("52: el flujo de Poynting entre a y b suma V·I", () => {
    const a = 0.002;
    const b = 0.006;
    const n = 100000;
    let p = 0;
    for (let k = 0; k < n; k++) {
      const r = a + ((k + 0.5) * (b - a)) / n;
      p += coaxPoynting(100, 2, a, b, r) * 2 * Math.PI * r * ((b - a) / n);
    }
    expect(p).toBeCloseTo(200, 6);
  });
});
