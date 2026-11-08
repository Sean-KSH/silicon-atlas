/** Virtual measurement kernels: SI, explicit circuit KCL and reproducible instrument errors. */
import { jq as q, eps0 } from './junction';
import { SILICON, SIO2 } from './materials';
import { opticalDefault, optical, solar } from './photonics';
export interface BenchSettings {
  topology: 'nmos' | 'cmos';
  vdd: number;
  vin: number;
  ratio: number;
  scale: number;
  extraC: number;
  scopeC: number;
  probe: 'ideal' | 'buffer' | 'direct';
  perturb: boolean;
  contact: boolean;
  rc: number;
  noise: boolean;
  sigmaI: number;
  sigmaV: number;
  resolution: boolean;
  lsbI: number;
  lsbV: number;
  seed: number;
  metal: boolean;
  length: number;
  sheet: number;
  fetL: number;
  gate: number;
  method: 'linear' | 'sqrt';
  fitMin: number;
  fitMax: number;
  vt: number;
  mobility: number;
  tox: number;
  irradiance: number;
  solarArea: number;
  reflection: number;
  receiverR: number;
}
export const benchDefaults: BenchSettings = {
  topology: 'nmos',
  vdd: 10,
  vin: 5,
  ratio: 0.5,
  scale: 1,
  extraC: 1e-12,
  scopeC: 10e-12,
  probe: 'buffer',
  perturb: true,
  contact: false,
  rc: 10,
  noise: false,
  sigmaI: 2e-7,
  sigmaV: 0.001,
  resolution: false,
  lsbI: 1e-7,
  lsbV: 0.001,
  seed: 308,
  metal: true,
  length: 0.006,
  sheet: 0.2,
  fetL: 50e-6,
  gate: 4,
  method: 'linear',
  fitMin: 3,
  fitMax: 5,
  vt: 2,
  mobility: 0.05,
  tox: 55e-9,
  irradiance: 1000,
  solarArea: 25e-6,
  reflection: 0.2,
  receiverR: 10000,
};
export function checkBench(c: BenchSettings) {
  for (const v of Object.values(c))
    if (typeof v === 'number' && !Number.isFinite(v))
      throw Error('Bench parameters must be finite');
  if (
    c.vdd < 5 ||
    c.vdd > 10 ||
    c.ratio < 0.04 ||
    c.ratio > 5 ||
    c.scale < 0.5 ||
    c.scale > 1 ||
    c.tox < 20e-9 ||
    c.tox > 100e-9 ||
    c.mobility < 0.01 ||
    c.mobility > 0.1 ||
    c.vt < 1 ||
    c.vt > 3 ||
    c.extraC < 0 ||
    c.scopeC < 0 ||
    c.rc < 0 ||
    c.rc > 10000 ||
    c.sheet <= 0 ||
    c.fetL < 25e-6 ||
    c.fetL > 200e-6 ||
    c.fitMin >= c.fitMax ||
    c.fitMin < 0 ||
    c.fitMax > 5 ||
    c.irradiance < 0 ||
    c.irradiance > 2000 ||
    c.receiverR < 1000 ||
    c.receiverR > 111000
  )
    throw Error('Outside documented bench ranges');
  return c;
}
export function bisect(fn: (v: number) => number, lo: number, hi: number, tol = 1e-12) {
  let fl = fn(lo),
    fh = fn(hi);
  if (fl === 0) return lo;
  if (fh === 0) return hi;
  if (fl * fh > 0) throw Error('Circuit root is not bracketed');
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2,
      f = fn(mid);
    if (hi - lo < tol) return mid;
    if (Math.sign(f) === Math.sign(fl)) {
      lo = mid;
      fl = f;
    } else hi = mid;
  }
  throw Error('Circuit root failed to converge');
}
export function cox(c: BenchSettings) {
  return (SIO2.epsr * eps0) / c.tox;
}
export function intrinsicFet(vg: number, vd: number, beta: number, threshold: number, lambda = 0) {
  if (vd <= 0 || vg <= threshold) return 0;
  const u = vg - threshold;
  return vd < u ? beta * (u * vd - (vd * vd) / 2) : ((beta * u * u) / 2) * (1 + lambda * (vd - u));
}
/** Source/drain contacts each Rc. Body bias at internal source includes I Rc. */
export function fetCurrent(
  c: BenchSettings,
  vg: number,
  vd: number,
  wl: number,
  body = 0,
  p = false,
  circuit = false,
) {
  const beta = c.mobility * (p ? 0.4 : 1) * cox(c) * wl,
    R = c.contact ? c.rc : 0,
    gamma = circuit ? 0.4 : 0,
    threshold = (i: number) => c.vt + gamma * (Math.sqrt(0.7 + body + i * R) - Math.sqrt(0.7)),
    bare = intrinsicFet(vg, vd, beta, threshold(0), circuit ? 0.02 : 0);
  if (R === 0 || bare === 0) return bare;
  return bisect(
    (i) => i - intrinsicFet(vg - i * R, vd - 2 * i * R, beta, threshold(i), circuit ? 0.02 : 0),
    0,
    bare,
    Math.max(1e-16, bare * 1e-10),
  );
}
function uniform(seed: number, index: number) {
  let x = (seed + Math.imul(index + 1, 0x9e3779b1)) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}
export function measure(value: number, c: BenchSettings, index: number, kind: 'I' | 'V') {
  const sigma = kind === 'I' ? c.sigmaI : c.sigmaV,
    lsb = kind === 'I' ? c.lsbI : c.lsbV,
    normal =
      Math.sqrt(-2 * Math.log(Math.max(uniform(c.seed, index * 2), 1e-12))) *
      Math.cos(2 * Math.PI * uniform(c.seed, index * 2 + 1));
  let v = value + (c.noise ? sigma * normal : 0);
  if (c.resolution && lsb > 0) v = Math.round(v / lsb) * lsb;
  return v;
}
export function regress(rows: { x: number; y: number }[]) {
  if (rows.length < 3) throw Error('At least 3 fit points required');
  const n = rows.length,
    mx = rows.reduce((s, r) => s + r.x, 0) / n,
    my = rows.reduce((s, r) => s + r.y, 0) / n,
    sxx = rows.reduce((s, r) => s + (r.x - mx) ** 2, 0),
    sxy = rows.reduce((s, r) => s + (r.x - mx) * (r.y - my), 0);
  if (sxx === 0) throw Error('Fit has no x range');
  const slope = sxy / sxx,
    intercept = my - slope * mx,
    sse = rows.reduce((s, r) => s + (r.y - slope * r.x - intercept) ** 2, 0),
    sst = rows.reduce((s, r) => s + (r.y - my) ** 2, 0);
  return { slope, intercept, r2: sst === 0 ? 1 : 1 - sse / sst };
}
export function resistorBench(c: BenchSettings) {
  checkBench(c);
  const width = 50e-6,
    sheet = c.metal ? c.sheet : 1 / (q * 0.005 * 1e25 * 1e-6),
    Rc = c.contact ? c.rc : 0,
    limit = 0.1;
  const sweep = (length: number, k: number) => {
    const R = (sheet * length) / width + 2 * Rc,
      max = c.metal ? 1 : 5;
    return Array.from({ length: 101 }, (_, i) => {
      const command = (max * i) / 100,
        v = Math.min(command, limit * R),
        ref = v / ((sheet * length) / width),
        physical = v / R;
      return {
        x: command,
        v,
        vm: measure(v, c, k + i, 'V'),
        reference: ref,
        physical,
        measured: measure(physical, c, k + i + 10000, 'I'),
        compliance: v < command,
      };
    });
  };
  const lengths = [0.003, 0.006, 0.012, 0.024],
    geometry = lengths.map((L, i) => {
      const rows = sweep(L, 1000 * i),
        fit = regress(rows.map((r) => ({ x: r.vm, y: r.measured })));
      return {
        x: L / width,
        L,
        R: fit.slope > 0 ? 1 / fit.slope : NaN,
        reference: (sheet * L) / width,
        physical: (sheet * L) / width + 2 * Rc,
      };
    });
  if (geometry.some((r) => !Number.isFinite(r.R)))
    throw Error('Noise/resolution obscures the resistor slope');
  const fit = regress(geometry.map((r) => ({ x: r.x, y: r.R })));
  return {
    sheet,
    width,
    rows: sweep(c.length, 50000),
    geometry,
    extracted: fit.slope,
    contactEstimate: fit.intercept / 2,
    fit,
  };
}
export function fetBench(c: BenchSettings) {
  checkBench(c);
  const wl = 0.001 / c.fetL,
    vds = c.method === 'linear' ? 0.05 : 5,
    reference = { ...c, contact: false },
    output = Array.from({ length: 51 }, (_, i) => {
      const v = i / 10;
      const r: Record<string, number> = {
        x: v,
        measured: measure(fetCurrent(c, c.gate, v, wl), c, i, 'I'),
      };
      for (let g = 0; g <= 5; g++) r['g' + g] = fetCurrent(reference, g, v, wl);
      return r;
    });
  const transfer = Array.from({ length: 101 }, (_, i) => {
    const vg = i * 0.05,
      physical = fetCurrent(c, vg, vds, wl),
      ideal = fetCurrent(reference, vg, vds, wl),
      measured = measure(physical, c, i + 400, 'I');
    return {
      x: vg,
      vm: measure(vg, c, i + 500, 'V'),
      reference: ideal,
      physical,
      measured,
      fitY: c.method === 'sqrt' ? (measured > 0 ? Math.sqrt(measured) : null) : measured,
    };
  });
  const selected = transfer.filter((r) => r.x >= c.fitMin - 1e-10 && r.x <= c.fitMax + 1e-10);
  const validWindow = selected.every(
    (r) => r.x > c.vt + (c.method === 'linear' ? vds : 0) && r.fitY !== null,
  );
  let extracted = null,
    error = '';
  if (validWindow) {
    const fit = regress(selected.map((r) => ({ x: r.vm, y: r.fitY! })));
    if (fit.slope > 0)
      extracted = {
        vt: -fit.intercept / fit.slope - (c.method === 'linear' ? vds / 2 : 0),
        mobility:
          c.method === 'linear'
            ? fit.slope / (cox(c) * wl * vds)
            : (2 * fit.slope ** 2) / (cox(c) * wl),
        fit,
      };
    else error = 'Nonpositive measured slope: extraction withheld';
  } else
    error =
      'Fit window crosses cutoff/region boundary or contains nonpositive sqrt data. Choose a valid strong-inversion window.';
  return { output, transfer, extracted, error, vds, wl };
}
export function inverterCurrents(c: BenchSettings, input: number, out: number, scope = false) {
  const up =
      c.topology === 'nmos'
        ? fetCurrent(c, c.vdd - out, c.vdd - out, c.ratio, out, false, true)
        : fetCurrent(c, c.vdd - input, c.vdd - out, c.ratio, 0, true, true),
    down = fetCurrent(c, input, out, 5, 0, false, true),
    leak = out * (1e-10 + (scope ? 1e-6 : 0));
  return { up, down, leak, net: up - down - leak };
}
export function inverterDC(c: BenchSettings, input: number, scope = false) {
  const v = bisect((v) => inverterCurrents(c, input, v, scope).net, 0, c.vdd);
  const currents = inverterCurrents(c, input, v, scope);
  return { v, ...currents, power: c.vdd * currents.up };
}
export function inverterBench(c: BenchSettings) {
  checkBench(c);
  const clean = { ...c, contact: false },
    rows = Array.from({ length: 101 }, (_, i) => {
      const v = (c.vdd * i) / 100,
        a = inverterDC(c, v),
        ref = inverterDC(clean, v);
      return {
        x: v,
        reference: ref.v,
        physical: a.v,
        measured: measure(a.v, c, i + 600, 'V'),
        power: a.power,
        referencePower: ref.power,
      };
    }),
    point = inverterDC(c, c.vin),
    high = inverterDC(c, 0).v,
    low = inverterDC(c, c.vdd).v,
    eq = bisect((v) => inverterCurrents(c, v, v).net, 0, c.vdd);
  return { rows, point, high, low, eq };
}
export function nodeCap(c: BenchSettings) {
  const gate =
    cox(c) * (250e-6 * c.scale) * (50e-6 * c.scale) * (c.topology === 'cmos' ? 1 + c.ratio / 5 : 1);
  return gate + c.extraC;
}
function rk4(y: number[], dt: number, fn: (a: number[]) => number[]) {
  const a = fn(y),
    b = fn(y.map((v, i) => v + (dt * a[i]) / 2)),
    d = fn(y.map((v, i) => v + (dt * b[i]) / 2)),
    e = fn(y.map((v, i) => v + dt * d[i]));
  return y.map((v, i) => v + (dt * (a[i] + 2 * b[i] + 2 * d[i] + e[i])) / 6);
}
function safe(y: number[], c: BenchSettings) {
  if (y.some((v) => !Number.isFinite(v) || v < -1e-7 || v > c.vdd + 1e-7))
    throw Error(
      'Transient left supply bounds; reduce numerical step. No voltage clamping was applied',
    );
}
export function crossings(
  rows: { t: number; y: number[] }[],
  node: number,
  level: number,
  start = 0,
) {
  const list: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1],
      b = rows[i];
    if (a.t >= start && a.y[node] < level && b.y[node] >= level)
      list.push(a.t + ((b.t - a.t) * (level - a.y[node])) / (b.y[node] - a.y[node]));
  }
  return list;
}
export function stageDelay(
  c: BenchSettings,
  cap = nodeCap(c),
  refine = 1,
  levels?: [number, number],
  scope = false,
) {
  const high = levels?.[1] ?? inverterDC(c, 0, scope).v,
    low = levels?.[0] ?? inverterDC(c, c.vdd, scope).v,
    mid = (high + low) / 2,
    gmax = c.mobility * cox(c) * (5 + c.ratio) * c.vdd,
    dt = (0.16 * cap) / gmax / refine;
  const step = (rising: boolean) => {
    const input = levels ? (rising ? low : high) : rising ? 0 : c.vdd,
      initial = rising ? low : high;
    let v = initial,
      t = 0;
    const rows: { t: number; y: number[] }[] = [{ t: 0, y: [v, input] }];
    for (let i = 0; i < 60000; i++) {
      const next = rk4([v], dt, (a) => [inverterCurrents(c, input, a[0], scope).net / cap])[0];
      safe([next], c);
      if ((rising && v < mid && next >= mid) || (!rising && v > mid && next <= mid)) {
        const delay = t + (dt * (mid - v)) / (next - v);
        return { delay, dt, rows };
      }
      v = next;
      t += dt;
      if (i % 10 === 0) rows.push({ t, y: [v, input] });
    }
    throw Error(
      'The stage did not reach the midpoint: no valid propagation delay at this drive ratio',
    );
  };
  const rise = step(true),
    fall = step(false);
  return {
    rise: rise.delay,
    fall: fall.delay,
    tp: (rise.delay + fall.delay) / 2,
    dt,
    high,
    low,
    mid,
  };
}
export function inverterTransient(c: BenchSettings, refine = 1) {
  checkBench(c);
  const cap = nodeCap(c) + c.scopeC,
    delay = stageDelay(c, cap, refine, undefined, true),
    period = 12 * Math.max(delay.rise, delay.fall),
    half = period / 2,
    dt = half / Math.ceil(half / delay.dt),
    steps = Math.ceil((3 * period) / dt);
  if (steps > 250000) throw Error('Transient exceeds sampling budget; choose a stronger pull-up');
  let y = [delay.high];
  const rows: { t: number; y: number[] }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i * dt,
      input = Math.floor((t + dt * 0.01) / half) % 2 === 0 ? c.vdd : 0;
    if (i % Math.max(1, Math.floor(steps / 1500)) === 0 || i === steps)
      rows.push({ t, y: [y[0], input] });
    if (i === steps) break;
    y = rk4(y, dt, (a) => [inverterCurrents(c, input, a[0], true).net / cap]);
    safe(y, c);
  }
  return { rows, cap, delay, dt, period };
}
export function ring(c: BenchSettings, refine = 1) {
  checkBench(c);
  const cap = nodeCap(c),
    eq = bisect((v) => inverterCurrents(c, v, v).net, 0, c.vdd),
    count = c.probe === 'buffer' ? 6 : 5,
    caps = Array.from(
      { length: count },
      (_, i) =>
        cap +
        (i === 4
          ? c.probe === 'buffer'
            ? cap - c.extraC
            : c.probe === 'direct'
              ? c.scopeC
              : 0
          : 0) +
        (i === 5 ? c.scopeC : 0),
    ),
    hasScope = (i: number) =>
      (c.probe === 'direct' && i === 4) || (c.probe === 'buffer' && i === 5);
  let y = Array.from({ length: count }, (_, i) => (i === 5 ? inverterDC(c, eq, true).v : eq));
  if (c.probe === 'direct') {
    const cycle = (v: number) => {
      for (let j = 1; j < 5; j++) v = inverterDC(c, v, j === 4).v;
      return inverterDC(c, v).v;
    };
    y[0] = bisect((v) => cycle(v) - v, 0, c.vdd);
    for (let j = 1; j < 5; j++) y[j] = inverterDC(c, y[j - 1], j === 4).v;
  }
  if (c.perturb) y[0] += 0.001 * c.vdd;
  const base = stageDelay(c, cap, refine),
    duration = 120 * 5 * base.tp,
    gmax = c.mobility * cox(c) * (5 + c.ratio) * c.vdd,
    dt0 = (0.16 * Math.min(...caps)) / gmax / refine,
    steps = Math.ceil(duration / dt0),
    dt = duration / steps;
  if (steps > 600000)
    throw Error(
      'Ring simulation exceeds step budget. Increase pull-up strength or reduce loading.',
    );
  const stride = Math.max(1, Math.floor(steps / 3500)),
    rows: { t: number; y: number[] }[] = [];
  let supply = 0;
  const derivative = (v: number[]) =>
    v.map(
      (out, i) => inverterCurrents(c, v[i === 5 ? 4 : (i + 4) % 5], out, hasScope(i)).net / caps[i],
    );
  if (!c.perturb) {
    return {
      rows: Array.from({ length: 101 }, (_, i) => ({ t: (duration * i) / 100, y: [...y] })),
      frequency: null,
      period: null,
      amplitude: 0,
      eq,
      cap,
      dt,
      steps,
      base,
      meanPower:
        c.vdd *
        y.reduce(
          (sum, out, i) =>
            sum + inverterCurrents(c, y[i === 5 ? 4 : (i + 4) % 5], out, hasScope(i)).up,
          0,
        ),
      symmetric: true,
      delayFromRing: null,
      edgeDelay: null,
      predicted: 1 / (10 * base.tp),
    };
  }
  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    if (i % stride === 0 || i === steps) rows.push({ t, y: [...y] });
    if (i > steps / 2)
      supply += y.reduce(
        (sum, out, j) =>
          sum + inverterCurrents(c, y[j === 5 ? 4 : (j + 4) % 5], out, hasScope(j)).up,
        0,
      );
    if (i === steps) break;
    y = rk4(y, dt, derivative);
    safe(y, c);
  }
  const late = rows.filter((r) => r.t > duration / 2),
    vals = late.map((r) => r.y[0]),
    min = Math.min(...vals),
    max = Math.max(...vals),
    amplitude = max - min,
    events = crossings(rows, 0, (max + min) / 2, duration / 2),
    period =
      amplitude > 0.1 * c.vdd && events.length >= 4 ? (events.at(-1)! - events.at(-4)!) / 3 : null,
    frequency = period ? 1 / period : null;
  const delays: number[] = [];
  if (period) {
    const level = (min + max) / 2;
    for (let j = 0; j < 5; j++)
      for (const sign of [1, -1]) {
        const transformed = rows.map((r) => ({ t: r.t, y: r.y.map((v) => sign * v) })),
          inputEdges = crossings(transformed, (j + 4) % 5, sign * level, duration / 2),
          opposite = rows.map((r) => ({ t: r.t, y: r.y.map((v) => -sign * v) })),
          outputEdges = crossings(opposite, j, -sign * level, duration / 2);
        for (const t of inputEdges) {
          const edge = outputEdges.find((v) => v > t && v < t + period / 2);
          if (edge !== undefined) delays.push(edge - t);
        }
      }
  }
  const edgeDelay = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null;
  return {
    rows,
    frequency,
    period,
    amplitude,
    eq,
    cap,
    dt,
    steps,
    base,
    meanPower: (c.vdd * supply) / Math.floor(steps / 2),
    symmetric: false,
    delayFromRing: period ? period / 10 : null,
    edgeDelay,
    predicted: 1 / (10 * base.tp),
  };
}
export function opticalBench(c: BenchSettings) {
  checkBench(c);
  const o = {
      ...opticalDefault,
      area: c.solarArea,
      irradiance: c.irradiance,
      reflection: c.reflection,
      series: c.contact,
      rs: 2 * c.rc,
    },
    a = optical(o),
    resistance = c.contact ? 2 * c.rc : 0,
    at = (v: number, light: boolean) => {
      const iph = light ? a.iph : 0,
        curve = (vj: number) => a.is * Math.expm1(vj / a.vt) - iph,
        vj = resistance === 0 ? v : bisect((j) => j + resistance * curve(j) - v, -20, 3);
      return curve(vj);
    },
    rows = Array.from({ length: 41 }, (_, i) => {
      const command = -1 + i * 0.05,
        raw = at(command, true),
        limited = Math.abs(raw) > 0.1,
        iPhysical = limited ? Math.sign(raw) * 0.1 : raw,
        v = limited
          ? a.vt * Math.log1p((iPhysical + a.iph) / a.is) + iPhysical * resistance
          : command;
      return {
        x: command,
        v,
        reference: Math.min(0.1, a.is * Math.expm1(command / a.vt) - a.iph),
        physical: iPhysical,
        measured: measure(iPhysical, c, i + 900, 'I'),
        dark: Math.min(0.1, at(command, false)),
        compliance: limited,
      };
    }),
    pv = solar(o),
    quadrant = rows.filter((r) => r.v >= 0 && r.measured < 0),
    measuredMpp = quadrant.reduce((best, r) => Math.max(best, -r.v * r.measured), 0),
    zero = rows[20],
    cross = rows.findIndex((r, i) => i > 20 && r.measured >= 0),
    voc =
      cross > 20
        ? rows[cross - 1].v +
          ((rows[cross].v - rows[cross - 1].v) * -rows[cross - 1].measured) /
            (rows[cross].measured - rows[cross - 1].measured)
        : null,
    isc = -zero.measured;
  const filters = [700, 810, 900, 1000].map((nm, i) => {
    const z = optical({ ...o, wavelength: nm * 1e-9 }),
      measured = measure(z.iph, c, i + 1000, 'I');
    return {
      x: nm,
      reference: z.eta,
      measured: z.pin > 0 ? ((measured / z.pin) * z.energy) / q : null,
      power: z.pin,
    };
  });
  return {
    rows,
    pv,
    measuredMpp,
    voc,
    isc,
    ff: voc && isc > 0 ? measuredMpp / (isc * voc) : null,
    filters,
  };
}
export function receiver(c: BenchSettings, refine = 1) {
  const o = { ...opticalDefault, area: 1e-6, irradiance: c.irradiance, reflection: c.reflection },
    a = optical(o),
    cap = (SILICON.epsr * eps0 * o.area) / o.thickness + c.scopeC,
    R = c.receiverR,
    tau = R * cap,
    half = 5 * tau,
    dt = tau / (50 * refine),
    steps = 1500 * refine,
    rows: { t: number; y: number[] }[] = [];
  let v = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i * dt,
      on = Math.floor((t + dt * 0.01) / half) % 2 === 0,
      iph = on ? a.iph : 0;
    if (i % refine === 0) rows.push({ t, y: [v, on ? 1 : 0] });
    if (i === steps) break;
    const old = v;
    v = bisect(
      (n) => (cap * (n - old)) / dt - iph + a.is * Math.expm1((n - 5) / a.vt) + n / R,
      -0.1,
      6,
    );
  }
  return {
    rows,
    cap,
    tau,
    peak: Math.max(...rows.map((r) => r.y[0])),
    idealAmplitude: a.iph * R,
    validReverse: a.iph * R < 5,
    dt,
  };
}
