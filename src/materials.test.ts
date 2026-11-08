import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SILICON, GAAS, SIO2, EPS0, intrinsicDensity, effectiveDensities } from './materials';
import { materials, conditions } from './equilibrium';
import { junctionConditions, junctionDefault } from './junction';
import { mosDefault, mosParams } from './mos';
import { opticalMaterials } from './photonics';
import { cox, benchDefaults } from './bench';
import { ni300 } from './transport';

const close = (a: number, b: number, rel = 1e-12) =>
  assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

test('Reference values match Neamen Table B.4 / B.6 in SI units', () => {
  assert.equal(SILICON.gapEv, 1.12);
  assert.equal(SILICON.affinityEv, 4.01);
  assert.equal(SILICON.epsr, 11.7);
  close(SILICON.nc300, 2.8e19 * 1e6);
  close(SILICON.nv300, 1.04e19 * 1e6);
  close(SILICON.muN, 1350e-4);
  close(SILICON.muP, 480e-4);
  assert.equal(GAAS.gapEv, 1.42);
  assert.equal(GAAS.epsr, 13.1);
  close(GAAS.nc300, 4.7e17 * 1e6);
  close(GAAS.nv300, 7.0e18 * 1e6);
  close(GAAS.muN, 8500e-4);
  close(GAAS.muP, 400e-4);
  assert.equal(SIO2.epsr, 3.9);
});

test('Every module derives the same silicon intrinsic density and DOS', () => {
  for (const T of [280, 300, 350, 400]) {
    const ni = intrinsicDensity(SILICON, T);
    const { nc, nv } = effectiveDensities(SILICON, T);
    const j = junctionConditions({ ...junctionDefault, temperature: T });
    close(j.ni, ni, 1e-12);
    close(j.nc, nc);
    close(j.nv, nv);
    const m = mosParams({ ...mosDefault, temperature: T });
    close(m.ni, ni, 1e-12);
    const e = conditions({
      material: 'Si',
      temperature: T,
      donors: 0,
      acceptors: 0,
      statistics: 'MB',
    });
    close(e.nc, nc);
    close(e.nv, nv);
  }
  close(ni300, intrinsicDensity(SILICON, 300), 1e-12);
  // Self-consistent value (not Neamen's empirical 1.5e10 cm^-3); see docs/models/materials.md.
  const ni300cm = intrinsicDensity(SILICON, 300) / 1e6;
  assert.ok(ni300cm > 6.6e9 && ni300cm < 6.8e9, String(ni300cm));
});

test('Shared gap, permittivity and oxide constants are not redefined per module', () => {
  close(materials.Si.gap / 1.602176634e-19, SILICON.gapEv);
  close(materials.GaAs.gap / 1.602176634e-19, GAAS.gapEv);
  assert.equal(opticalMaterials.Si.gap, SILICON.gapEv);
  assert.equal(opticalMaterials.GaAs.gap, GAAS.gapEv);
  assert.equal(opticalMaterials.GaAs.epsr, GAAS.epsr);
  close(mosParams(mosDefault).cox, (SIO2.epsr * EPS0) / mosDefault.tox);
  close(cox(benchDefaults), (SIO2.epsr * EPS0) / benchDefaults.tox);
});
