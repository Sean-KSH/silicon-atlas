/**
 * Module registry: one place that defines the platform's ten modules, their order, their
 * URL hash and the course topic each one serves. Order follows the ten-module plan in
 * context.md (materials -> quantum/bands -> carriers -> transport -> process -> devices ->
 * photonics -> measurement).
 */
export interface ModuleEntry {
  /** URL hash without '#'. Kept stable so existing links keep working. */
  id: string;
  /** Two-digit number shown in navigation. */
  number: string;
  /** Short navigation label. */
  label: string;
  /** One-line description for overviews and docs. */
  summary: string;
}

export const MODULES: readonly ModuleEntry[] = [
  {
    id: 'wafer',
    number: '01',
    label: 'Silica to wafer',
    summary: 'Purification, Czochralski growth and Scheil impurity segregation.',
  },
  {
    id: 'atomic',
    number: '02',
    label: 'Atoms to bands',
    summary:
      'Diamond-cubic lattice, quantum wells and barriers, toy band structure and effective mass.',
  },
  {
    id: 'equilibrium',
    number: '03',
    label: 'Equilibrium carriers',
    summary: 'Density of states, Fermi–Dirac occupation, doping, compensation and freeze-out.',
  },
  {
    id: 'transport',
    number: '04',
    label: 'Transport & lifetime',
    summary: 'Drift, diffusion, generation and recombination of excess minority carriers.',
  },
  {
    id: 'fabrication',
    number: '05',
    label: 'Fabricate a MOSFET',
    summary: "The course's four-mask metal-gate nMOS process with oxidation and diffusion models.",
  },
  {
    id: 'junction',
    number: '06',
    label: 'P–n junction',
    summary: 'Depletion approximation and equilibrium Poisson–Boltzmann electrostatics.',
  },
  {
    id: 'diode',
    number: '07',
    label: 'PN diode',
    summary: 'Minority-carrier injection, ideal I–V, stored charge and switching.',
  },
  {
    id: 'mos',
    number: '08',
    label: 'Gate control',
    summary: 'MOS capacitor electrostatics and C–V, then the long-channel MOSFET.',
  },
  {
    id: 'photonics',
    number: '09',
    label: 'Photonic devices',
    summary: 'Absorption, photodiodes, solar cells, LEDs and an introductory laser threshold.',
  },
  {
    id: 'bench',
    number: '10',
    label: 'Measurement bench',
    summary:
      'Virtual ECE 308-style measurements: resistors, FETs, inverters, ring oscillator, optics.',
  },
];

export const DEFAULT_MODULE = 'wafer';

/** Resolve a location hash to a registered module id. Unknown hashes fall back to the default. */
export function moduleFromHash(hash: string): string {
  const id = hash.replace(/^#/, '').split(/[/?&]/)[0];
  if (MODULES.some((m) => m.id === id)) return id;
  // The atomic lab historically accepted sub-hashes such as #atomic-well.
  if (id.startsWith('atomic')) return 'atomic';
  return DEFAULT_MODULE;
}
