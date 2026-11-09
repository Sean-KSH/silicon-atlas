/**
 * Module registry: one place that defines the platform's ten modules, their order, their
 * URL hash and the stage of the course each one belongs to. Order follows the ten-module plan
 * in context.md (materials -> quantum/bands -> carriers -> transport -> process -> devices ->
 * photonics -> measurement).
 */
export type StageId = 'material' | 'carriers' | 'process' | 'devices' | 'light' | 'measure';

export interface ModuleEntry {
  /** URL hash without '#'. Kept stable so existing links keep working. */
  id: string;
  /** Two-digit number shown in navigation. */
  number: string;
  /** Short navigation label. */
  label: string;
  /** One-line description for overviews and menus. */
  summary: string;
  stage: StageId;
}

export const STAGES: readonly { id: StageId; label: string }[] = [
  { id: 'material', label: 'Material' },
  { id: 'carriers', label: 'Carriers' },
  { id: 'process', label: 'Process' },
  { id: 'devices', label: 'Devices' },
  { id: 'light', label: 'Light' },
  { id: 'measure', label: 'Measurement' },
];

export const MODULES: readonly ModuleEntry[] = [
  {
    id: 'wafer',
    number: '01',
    label: 'Silica to wafer',
    stage: 'material',
    summary: 'Purification, Czochralski growth and how impurities redistribute along an ingot.',
  },
  {
    id: 'atomic',
    number: '02',
    label: 'Atoms to bands',
    stage: 'material',
    summary: 'The silicon lattice, quantum wells and tunneling, and how energy bands form.',
  },
  {
    id: 'equilibrium',
    number: '03',
    label: 'Equilibrium carriers',
    stage: 'carriers',
    summary: 'Density of states, Fermi–Dirac occupation, doping, compensation and freeze-out.',
  },
  {
    id: 'transport',
    number: '04',
    label: 'Transport & lifetime',
    stage: 'carriers',
    summary: 'Drift, diffusion, generation and recombination of excess carriers.',
  },
  {
    id: 'fabrication',
    number: '05',
    label: 'Fabricate a MOSFET',
    stage: 'process',
    summary:
      'A four-mask metal-gate nMOS process, step by step, with oxidation and diffusion models.',
  },
  {
    id: 'junction',
    number: '06',
    label: 'P–n junction',
    stage: 'devices',
    summary: 'Charge, field, potential and band bending in an abrupt junction.',
  },
  {
    id: 'diode',
    number: '07',
    label: 'PN diode',
    stage: 'devices',
    summary: 'Carrier injection, the ideal I–V curve, stored charge and switching.',
  },
  {
    id: 'mos',
    number: '08',
    label: 'Gate control',
    stage: 'devices',
    summary: 'The MOS capacitor and C–V, then the long-channel MOSFET.',
  },
  {
    id: 'photonics',
    number: '09',
    label: 'Photonic devices',
    stage: 'light',
    summary: 'Absorption, photodiodes, solar cells, LEDs and laser threshold.',
  },
  {
    id: 'bench',
    number: '10',
    label: 'Measurement bench',
    stage: 'measure',
    summary:
      'Resistors, transistor extraction, inverters, a ring oscillator and optical measurements.',
  },
];

/** The course guide shown when the URL has no module hash. */
export const HOME = 'home';
export const DEFAULT_MODULE = HOME;

export function moduleById(id: string) {
  return MODULES.find((m) => m.id === id);
}

/** Resolve a location hash to 'home' or a registered module id. Unknown hashes go home. */
export function moduleFromHash(hash: string): string {
  const id = hash.replace(/^#/, '').split(/[/?&]/)[0];
  if (MODULES.some((m) => m.id === id)) return id;
  // The atomic lab historically accepted sub-hashes such as #atomic-well.
  if (id.startsWith('atomic')) return 'atomic';
  return HOME;
}
