import { Q, KB, materials } from './equilibrium';
export const barLength = 400e-6,
  majorityDensity = 1e22,
  packetPeak = 1e19,
  packetSigma = 20e-6;
export const ni300 =
  Math.sqrt(materials.Si.nc300 * materials.Si.nv300) * Math.exp(-materials.Si.gap / (2 * KB * 300));
export type TransportConfig = {
  species: 'electron' | 'hole';
  mobility: number;
  diffusion: number;
  field: number;
  lifetime: number;
  generation: number;
  boundary: 'absorbing' | 'reflecting' | 'periodic';
  initial: 'packet' | 'uniform' | 'empty';
  center: number;
  cells: number;
  duration: number;
  frames: number;
  timeFactor?: number;
};
export type TransportFrame = {
  time: number;
  u: Float64Array;
  number: number;
  generated: number;
  recombined: number;
  leftOut: number;
  rightOut: number;
  balance: number;
  steps: number;
};
export function validateTransport(c: TransportConfig) {
  if (
    !['electron', 'hole'].includes(c.species) ||
    !['absorbing', 'reflecting', 'periodic'].includes(c.boundary) ||
    !['packet', 'uniform', 'empty'].includes(c.initial) ||
    !Number.isFinite(c.mobility) ||
    c.mobility <= 0 ||
    !Number.isFinite(c.diffusion) ||
    c.diffusion < 0 ||
    !Number.isFinite(c.field) ||
    !(c.lifetime > 0) ||
    !Number.isFinite(c.generation) ||
    c.generation < 0 ||
    !Number.isFinite(c.center) ||
    c.center < 0 ||
    c.center > barLength ||
    !Number.isInteger(c.cells) ||
    c.cells < 20 ||
    c.cells > 1600 ||
    !Number.isFinite(c.duration) ||
    c.duration <= 0 ||
    c.duration > 20e-6 ||
    !Number.isInteger(c.frames) ||
    c.frames < 1 ||
    (c.timeFactor !== undefined && (!(c.timeFactor > 0) || c.timeFactor > 1))
  )
    throw new Error('Invalid transport parameters.');
}
export function driftVelocity(c: TransportConfig) {
  return (c.species === 'electron' ? -1 : 1) * c.mobility * c.field;
}
/** Conservative face flux of EXCESS minority carriers; +x is positive. */
export function transportFlux(u: Float64Array, c: TransportConfig) {
  const N = u.length,
    dx = barLength / N,
    v = driftVelocity(c),
    F = new Float64Array(N + 1);
  for (let j = 1; j < N; j++)
    F[j] = v * (v >= 0 ? u[j - 1] : u[j]) - (c.diffusion * (u[j] - u[j - 1])) / dx;
  if (c.boundary === 'periodic')
    F[0] = F[N] = v * (v >= 0 ? u[N - 1] : u[0]) - (c.diffusion * (u[0] - u[N - 1])) / dx;
  else if (c.boundary === 'absorbing') {
    F[0] = v * (v < 0 ? u[0] : 0) - (2 * c.diffusion * u[0]) / dx;
    F[N] = v * (v > 0 ? u[N - 1] : 0) + (2 * c.diffusion * u[N - 1]) / dx;
  }
  return F;
}
export function simulateTransport(c: TransportConfig) {
  validateTransport(c);
  const dx = barLength / c.cells,
    rate = 1 / c.lifetime,
    v = driftVelocity(c),
    dtMax =
      Math.min(
        2e-9,
        0.01 * c.lifetime,
        0.45 / (Math.abs(v) / dx + (3 * c.diffusion) / dx ** 2 + rate),
      ) * (c.timeFactor ?? 1);
  let u = Float64Array.from({ length: c.cells }, (_, i) =>
      c.initial === 'empty'
        ? 0
        : c.initial === 'uniform'
          ? packetPeak
          : packetPeak * Math.exp(-0.5 * (((i + 0.5) * dx - c.center) / packetSigma) ** 2),
    ),
    t = 0,
    generated = 0,
    recombined = 0,
    leftOut = 0,
    rightOut = 0,
    steps = 0;
  const number = () => u.reduce((a, b) => a + b, 0) * dx,
    initialNumber = number();
  const frames: TransportFrame[] = [];
  const save = () => {
    const N = number(),
      balance = N - initialNumber - generated + recombined + leftOut + rightOut;
    frames.push({
      time: t,
      u: u.slice(),
      number: N,
      generated,
      recombined,
      leftOut,
      rightOut,
      balance,
      steps,
    });
  };
  save();
  for (let frame = 1; frame <= c.frames; frame++) {
    const target = (c.duration * frame) / c.frames;
    while (t < target) {
      const dt = Math.min(dtMax, target - t);
      if (dt <= 0) break;
      const F = transportFlux(u, c),
        next = new Float64Array(c.cells),
        oldNumber = number();
      for (let i = 0; i < c.cells; i++) {
        next[i] = u[i] + dt * ((F[i] - F[i + 1]) / dx + c.generation - rate * u[i]);
        if (!Number.isFinite(next[i]) || next[i] < 0)
          throw new Error('Nonfinite or negative carrier solution. No clipping applied.');
      }
      generated += dt * c.generation * barLength;
      recombined += dt * rate * oldNumber;
      leftOut -= dt * F[0];
      rightOut += dt * F[c.cells];
      u = next;
      t += dt;
      steps++;
      if (steps > 2e6) throw new Error('Time-step budget exceeded.');
    }
    save();
  }
  const scale = Math.max(initialNumber + generated, 1);
  if (Math.abs(frames.at(-1)!.balance) / scale > 1e-8)
    throw new Error('Carrier-number balance tolerance exceeded.');
  return { frames, initialNumber, dtMax, dx, velocity: v };
}
export function transportRows(f: TransportFrame, c: TransportConfig) {
  const F = transportFlux(f.u, c),
    v = driftVelocity(c),
    minority0 = ni300 ** 2 / majorityDensity,
    majorityMobility = c.species === 'electron' ? materials.Si.muP : materials.Si.muN;
  return Array.from(f.u, (u, i) => {
    const minorityFlux = (F[i] + F[i + 1]) / 2 + v * minority0,
      majorityFlux =
        (c.species === 'electron' ? 1 : -1) * majorityMobility * c.field * majorityDensity,
      n = c.species === 'electron' ? minority0 + u : majorityDensity,
      p = c.species === 'hole' ? minority0 + u : majorityDensity,
      gn = c.species === 'electron' ? minorityFlux : majorityFlux,
      gp = c.species === 'hole' ? minorityFlux : majorityFlux;
    return {
      x: ((i + 0.5) * barLength) / c.cells,
      n,
      p,
      u,
      field: c.field,
      gn,
      gp,
      jn: -Q * gn,
      jp: Q * gp,
      jtotal: Q * (gp - gn),
      jexcess: ((c.species === 'electron' ? -Q : Q) * (F[i] + F[i + 1])) / 2,
    };
  });
}
export function moments(f: TransportFrame) {
  const dx = barLength / f.u.length,
    mean = (f.u.reduce((a, u, i) => a + u * (i + 0.5) * dx, 0) * dx) / f.number;
  return {
    mean,
    variance: (f.u.reduce((a, u, i) => a + u * ((i + 0.5) * dx - mean) ** 2, 0) * dx) / f.number,
  };
}
export function transportCsv(f: TransportFrame, c: TransportConfig) {
  return [
    'x_m,n_per_m3,p_per_m3,excess_per_m3,E_V_per_m,Gamma_n_per_m2_s,Gamma_p_per_m2_s,Jn_A_per_m2,Jp_A_per_m2,Jtotal_A_per_m2,Jexcess_A_per_m2,time_s,minority_species,mobility_m2_per_V_s,D_m2_per_s,tau_s,G_per_m3_s,boundary',
    ...transportRows(f, c).map((r) =>
      [
        r.x,
        r.n,
        r.p,
        r.u,
        r.field,
        r.gn,
        r.gp,
        r.jn,
        r.jp,
        r.jtotal,
        r.jexcess,
        f.time,
        c.species,
        c.mobility,
        c.diffusion,
        Number.isFinite(c.lifetime) ? c.lifetime : 'disabled',
        c.generation,
        c.boundary,
      ].join(','),
    ),
  ].join('\n');
}
