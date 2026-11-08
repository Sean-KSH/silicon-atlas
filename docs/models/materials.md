# Model card: shared constants and material parameters

**Code:** `src/materials.ts` · **Tests:** `src/materials.test.ts` · **Used by:** equilibrium,
transport, junction, diode, MOS, photonics, bench.

## Purpose
Give every module the same silicon, GaAs and SiO2 numbers, from the course's principal reference,
so that results from different modules can be compared directly.

## Values (T = 300 K)

| Quantity | Si | GaAs | Source |
| --- | --- | --- | --- |
| Band gap Eg | 1.12 eV | 1.42 eV | Neamen 4e, Table B.4, p. 717 |
| Electron affinity χ | 4.01 eV | 4.07 eV | Table B.4; Table 9.2, p. 333 |
| Relative permittivity | 11.7 | 13.1 | Table B.4 |
| Nc | 2.8e19 cm⁻³ | 4.7e17 cm⁻³ | Table B.4 |
| Nv | 1.04e19 cm⁻³ | 7.0e18 cm⁻³ | Table B.4 |
| Electron mobility | 1350 cm²/V s | 8500 cm²/V s | Table B.4 |
| Hole mobility | 480 cm²/V s | 400 cm²/V s | Table B.4 |
| SiO2 relative permittivity | 3.9 | | Table B.6, p. 718 |

Physical constants q, k, h, c are exact SI values (CODATA 2018); ε0 is the CODATA 2018
recommended value. Internally all concentrations are m⁻³ and mobilities m²/(V s).

Status: these are *textbook reference values*, used as given. They are not fits made by this
project and not re-measured.

## Temperature dependence
- Nc, Nv scale as (T/300)^(3/2) (Neamen Eqs. 4.10 and 4.18 with fixed effective masses).
- Eg and mobilities are held at their 300 K values. This is adequate over the 280–400 K ranges of
  the device modules for qualitative trends, and is a known limitation for the 40–800 K
  equilibrium module (decision D-006).

## Derived intrinsic density
ni = sqrt(Nc Nv) exp(−Eg / 2kT) gives 6.7e9 cm⁻³ for Si at 300 K. This differs from:
- 1.5e10 cm⁻³, the value Neamen lists in Table B.4 and uses in worked examples (an older empirical
  value, not consistent with the same table's Nc, Nv and Eg);
- about 9.65e9 cm⁻³, the value generally used in current silicon device work (Altermatt et al.
  2003; not yet read in full, see the literature review).
The platform uses the self-consistent value so that n0 p0 = ni² holds exactly with the same
parameters used for the band diagram. Decision D-005 records this choice as open.

## What is not here
Dopant ionization energies (they belong to specific dopants; `src/equilibrium.ts`, Neamen Tables
4.3 and 4.4); oxidation and diffusion coefficients (`src/fabrication.ts`); illustrative absorption
coefficients (`src/photonics.ts`); bench transistor parameters (`src/bench.ts`).
