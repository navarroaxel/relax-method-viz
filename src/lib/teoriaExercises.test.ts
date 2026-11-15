import { describe, expect, it } from "vitest";

import {
  alphaExact,
  connectedSpheres,
  coaxLeakResistance,
  coaxPotential,
  cylCapacitance,
  diskAxisField,
  groundVoltage,
  lineOverGroundC,
  planeCharge,
  plateCapacitance,
  plateForce,
  pointInShell,
  quarterWasherResistance,
  relaxationTime,
  shellField,
  sphericalShellPotential,
  stormLine,
  twoWireLeak,
  uniformSphereField,
  wedgePotential,
  EPS0,
  cableMultiLayer,
  cableMultiLayerField,
  cableSingleLayer,
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

describe("guía 24: cable con aislante", () => {
  const a = 0.004;
  const b = 0.024;
  const emax = 1e7; // 100 kV/cm
  it("una capa: Vmax ≈ 71,67 kV (PDF)", () => {
    expect(cableSingleLayer(a, b, emax, 6).vmax / 1e3).toBeCloseTo(71.67, 1);
  });
  it("tres capas: r₁ = 0,6 cm, r₂ = 1,2 cm y Vmax ≈ 141 kV (PDF)", () => {
    const m = cableMultiLayer(a, b, emax, [6, 4, 2]);
    expect(m.r1 * 100).toBeCloseTo(0.6, 6);
    expect(m.r2 * 100).toBeCloseTo(1.2, 6);
    expect(m.vmax / 1e3).toBeCloseTo(141, 0);
  });
  it("E vale Emax al comienzo de cada capa y V = ∫E dr", () => {
    const eps = [6, 4, 2] as const;
    const m = cableMultiLayer(a, b, emax, eps);
    expect(cableMultiLayerField(a, a, b, emax, eps)).toBeCloseTo(emax, 3);
    expect(cableMultiLayerField(m.r1 * 1.0000001, a, b, emax, eps)).toBeCloseTo(
      emax,
      -2,
    );
    expect(cableMultiLayerField(m.r2 * 1.0000001, a, b, emax, eps)).toBeCloseTo(
      emax,
      -2,
    );
    const n = 200000;
    let v = 0;
    for (let k = 0; k < n; k++) {
      const r = a + ((k + 0.5) * (b - a)) / n;
      v += cableMultiLayerField(r, a, b, emax, eps) * ((b - a) / n);
    }
    expect(v / m.vmax).toBeCloseTo(1, 3);
  });
});

describe("guía 1 al 24 (electrostática y circuitos)", () => {
  it("1/3: Gauss — E de la capa continua en r = b hacia afuera y el plano", () => {
    expect(planeCharge(1e-8)).toBeCloseTo(1e-8 / (2 * EPS0), 6);
    expect(shellField(1e-9, 0.1, 0.05)).toBe(0);
    expect(shellField(1e-9, 0.1, 0.1)).toBeCloseTo(
      1e-9 / (4 * Math.PI * EPS0 * 0.01),
      6,
    );
  });
  it("2: E de la nube es continuo en r = b", () => {
    expect(uniformSphereField(1e-6, 0.1, 0.1 - 1e-12)).toBeCloseTo(
      uniformSphereField(1e-6, 0.1, 0.1 + 1e-12),
      0,
    );
  });
  it("4: el disco tiende al plano infinito y al campo puntual", () => {
    expect(diskAxisField(1e-8, 1e6, 1) / planeCharge(1e-8)).toBeCloseTo(1, 5);
    const far = diskAxisField(1e-8, 0.01, 10);
    const point = (1e-8 * Math.PI * 0.01 ** 2) / (4 * Math.PI * EPS0 * 100);
    expect(far / point).toBeCloseTo(1, 3);
  });
  it("5: V continuo en Ri y R0, E = 0 en el conductor", () => {
    const [q, ri, r0] = [2e-9, 0.1, 0.15];
    expect(pointInShell(q, ri, r0, 0.12).e).toBe(0);
    expect(pointInShell(q, ri, r0, ri - 1e-12).v).toBeCloseTo(
      pointInShell(q, ri, r0, ri).v,
      6,
    );
    expect(pointInShell(q, ri, r0, r0 + 1e-12).v).toBeCloseTo(
      pointInShell(q, ri, r0, r0).v,
      6,
    );
  });
  it("6: mismo potencial y E₁/E₂ = b₂/b₁", () => {
    const s = connectedSpheres(1e-8, 0.02, 0.06);
    expect(s.q1 + s.q2).toBeCloseTo(1e-8, 15);
    expect(s.q1 / 0.02).toBeCloseTo(s.q2 / 0.06, 12);
    expect(s.e1 / s.e2).toBeCloseTo(0.06 / 0.02, 9);
  });
  it("7/8/10: capacidades", () => {
    expect(plateCapacitance(1, 0.01, 0.001)).toBeCloseTo(EPS0 * 10, 15);
    expect(cylCapacitance(1, 0.001, 0.01, 1)).toBeCloseTo(
      (2 * Math.PI * EPS0) / Math.log(10),
      15,
    );
  });
  it("11: la fuerza coincide con −dW/dx a Q constante", () => {
    const [q, s] = [1e-8, 0.01];
    const w = (x: number) => (q * q * x) / (2 * EPS0 * s);
    const h = 1e-7;
    expect((w(0.002 + h) - w(0.002 - h)) / (2 * h)).toBeCloseTo(
      plateForce(q, s),
      6,
    );
  });
  it("12: V(a) = V₀, V(b) = 0 y E = −dV/dr", () => {
    expect(coaxPotential(100, 0.002, 0.006, 0.002).v).toBeCloseTo(100, 9);
    expect(coaxPotential(100, 0.002, 0.006, 0.006).v).toBeCloseTo(0, 9);
    const h = 1e-8;
    const dv =
      (coaxPotential(100, 0.002, 0.006, 0.004 + h).v -
        coaxPotential(100, 0.002, 0.006, 0.004 - h).v) /
      (2 * h);
    expect(-dv).toBeCloseTo(coaxPotential(100, 0.002, 0.006, 0.004).e, 3);
  });
  it("13: la cuña vale 0, V₀ y 0 en φ = 0, α, 2π", () => {
    const a = Math.PI / 3;
    expect(wedgePotential(100, a, 0)).toBe(0);
    expect(wedgePotential(100, a, a)).toBeCloseTo(100, 12);
    expect(wedgePotential(100, a, 2 * Math.PI)).toBeCloseTo(0, 12);
  });
  it("14: V(Ri) = V₁, V(R0) = V₂ y E = −dV/dr (corrige el signo de V(r) del PDF)", () => {
    const f = (r: number) => sphericalShellPotential(100, 20, 0.1, 0.2, r);
    expect(f(0.1).v).toBeCloseTo(100, 9);
    expect(f(0.2).v).toBeCloseTo(20, 9);
    const h = 1e-8;
    expect(-(f(0.15 + h).v - f(0.15 - h).v) / (2 * h)).toBeCloseTo(
      f(0.15).e,
      3,
    );
  });
  it("15: C' = 2πε₀/ln(2h/a) ≈ 8,05 pF/m (el PDF escribe 8,504 por un error de cuenta)", () => {
    expect(lineOverGroundC(10, 0.02) * 1e12).toBeCloseTo(8.05, 2);
  });
  it("17 (PDF): τ cobre ≈ 1,52e-19 s y τ caucho ≈ 26550 s", () => {
    expect(relaxationTime(1, 5.8e7)).toBeCloseTo(1.52e-19, 20);
    expect(relaxationTime(3, 1e-15)).toBeCloseTo(26550, -2);
  });
  it("19/20: R·C = ε/σ", () => {
    const [a, b, l, sg] = [0.001, 0.01, 2, 1e-6];
    expect(
      coaxLeakResistance(a, b, l, sg) * cylCapacitance(1, a, b, l),
    ).toBeCloseTo(EPS0 / sg, 12);
    const w = twoWireLeak(0.001, 0.1, sg);
    expect(w.rLeak * w.cPerM).toBeCloseTo(EPS0 / sg, 12);
  });
  it("21: cuarto de arandela por integración numérica", () => {
    const [sg, h, a, b] = [5.8e7, 0.002, 0.01, 0.03];
    const n = 100000;
    let g = 0;
    for (let k = 0; k < n; k++) {
      const r = a + ((k + 0.5) * (b - a)) / n;
      g += (sg * h * ((b - a) / n)) / ((Math.PI / 2) * r);
    }
    expect(quarterWasherResistance(sg, h, a, b)).toBeCloseTo(1 / g, 9);
  });
  it("22 (PDF): ρ/2πε₀ ≈ −1,3794·E₀, V_L 10 → 6,69·E₀ y E_M ≈ −343,85·E₀", () => {
    const s = stormLine(10, 2, 0.004, 1);
    expect(s.k).toBeCloseTo(-1.3794, 3);
    expect(s.vAfter).toBeCloseTo(6.6924, 3);
    expect(s.eM).toBeCloseTo(-343.85, 1);
  });
  it("23 (PDF): tensión de paso 385 V y 28 V con 200 A y σ = 10⁻² S/m", () => {
    const dv = (d1: number, d2: number) =>
      groundVoltage(200, 1e-2, d1) - groundVoltage(200, 1e-2, d2);
    expect(dv(2.2, 3)).toBeCloseTo(385, -1);
    expect(dv(9.2, 10)).toBeCloseTo(28, 0);
  });
});
