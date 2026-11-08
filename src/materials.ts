/**
 * Shared physical constants and reference material parameters.
 *
 * Every module that needs a silicon, GaAs or SiO2 property imports it from here, so the
 * platform cannot silently disagree with itself. Values are T = 300 K references.
 *
 * Units: SI internally (m^-3, m^2/(V s), F/m). Energies that are conventionally quoted in eV
 * (gap, electron affinity) are stored in eV and named `...Ev`; convert with `Q` where joules
 * are needed.
 *
 * Sources (see docs/models/materials.md for page references and status):
 *   - Physical constants: CODATA 2018 exact SI values (q, k, h, c) and the 2018 recommended
 *     vacuum permittivity.
 *   - Si and GaAs: Neamen, Semiconductor Physics and Devices, 4th ed., Appendix B, Table B.4
 *     (printed p. 717). Electron affinity agrees with Table 9.2 (p. 333).
 *   - SiO2: Neamen 4th ed., Appendix B, Table B.6 (p. 718).
 *
 * These are textbook reference values used consistently for teaching. They are not
 * temperature-dependent fits: band gap and mobility are held at their 300 K values, and the
 * effective densities of states scale as (T/300)^(3/2).
 */

export const Q = 1.602176634e-19; // C, exact
export const KB = 1.380649e-23; // J/K, exact
export const H = 6.62607015e-34; // J s, exact
export const C_LIGHT = 299792458; // m/s, exact
export const EPS0 = 8.8541878128e-12; // F/m, CODATA 2018

export interface SemiconductorReference {
  name: string;
  /** Band gap at 300 K, eV (held fixed with temperature in this platform). */
  gapEv: number;
  /** Electron affinity, eV (numerically equal to volts per electron). */
  affinityEv: number;
  /** Relative permittivity. */
  epsr: number;
  /** Effective density of states at 300 K, m^-3. */
  nc300: number;
  nv300: number;
  /** Low-field lattice mobility at 300 K, m^2/(V s). */
  muN: number;
  muP: number;
  /** Direct (true) or indirect (false) fundamental gap. */
  direct: boolean;
}

export const SILICON: SemiconductorReference = {
  name: 'Silicon',
  gapEv: 1.12,
  affinityEv: 4.01,
  epsr: 11.7,
  nc300: 2.8e25,
  nv300: 1.04e25,
  muN: 0.135,
  muP: 0.048,
  direct: false,
};

export const GAAS: SemiconductorReference = {
  name: 'Gallium arsenide',
  gapEv: 1.42,
  affinityEv: 4.07,
  epsr: 13.1,
  nc300: 4.7e23,
  nv300: 7.0e24,
  muN: 0.85,
  muP: 0.04,
  direct: true,
};

export const SIO2 = {
  name: 'Silicon dioxide',
  epsr: 3.9,
};

/** Effective densities of states at temperature T (K), m^-3, using (T/300)^(3/2) scaling. */
export function effectiveDensities(m: SemiconductorReference, T: number) {
  const scale = (T / 300) ** 1.5;
  return { nc: m.nc300 * scale, nv: m.nv300 * scale };
}

/**
 * Intrinsic concentration computed self-consistently from Nc, Nv and the fixed gap, m^-3.
 * At 300 K this gives about 6.7e9 cm^-3 for Si, not the empirical 1.5e10 cm^-3 that Neamen
 * uses in worked examples; see docs/models/materials.md.
 */
export function intrinsicDensity(m: SemiconductorReference, T: number) {
  const { nc, nv } = effectiveDensities(m, T);
  return Math.sqrt(nc * nv) * Math.exp(-(m.gapEv * Q) / (2 * KB * T));
}
