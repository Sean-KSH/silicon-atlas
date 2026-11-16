# Integration audit

> This is the audit taken on 2026-11-08, kept as a record. See "Since this audit" at the end for
> what has changed.

Date: 2026-11-08. Scope: all ten modules and the shared infrastructure, after the initial build
phase. Method: read `context.md`, ran the full test suite, typecheck and production build on a clean
install, rendered every module at 1440 px and 390 px widths in Chromium, and read the physics kernels
for parameter consistency. The physics kernels were spot-checked, not reviewed line by line; the
per-model review belongs with each model card (see "Next steps").

## Headline

The platform is in better shape than a typical first build. All ten modules exist, run, and have
physics kernels separated from the interface with independent tests (analytical limits,
conservation checks, independent quadrature, grid and time-step refinement). Solver failures are
surfaced rather than hidden, and out-of-range inputs are refused. The main gaps are not in the
running app but around it: version control, sourcing discipline, shared infrastructure, and the
documentation, literature and release deliverables that `context.md` asks for.

## Module status

| # | Module | Implemented | Test groups | Notes from this audit |
| --- | --- | --- | --- | --- |
| 01 | Silica to wafer | Six-stage illustrated process; Scheil segregation with exact interval averages; animated lumped-heat-balance growth; SVG figure export | 10 (5 Scheil, 5 growth) | Segregation coefficient is hypothetical by design; heat-balance constants are teaching choices. Both are labeled. |
| 02 | Atoms to bands | Draggable diamond cell and Miller planes; infinite well; rectangular barrier; 1D tight-binding chain | 6 | Band model correctly labeled as a toy, not silicon. |
| 03 | Equilibrium carriers | Si/GaAs, 40–800 K, MB or FD statistics, incomplete ionization, compensation | 7 | Band gap held fixed over 40–800 K and mobility fixed with doping; flagged in UI as qualitative, but these are the two biggest fidelity gaps on the platform (see Physics findings). |
| 04 | Transport & lifetime | Finite-volume continuity solver with drift, diffusion, generation, recombination; three boundary types | 6 | First-order upwind adds numerical diffusion; documented. |
| 05 | Fabricate a MOSFET | 26 snapshots of the course's four-mask metal-gate nMOS flow; Deal–Grove; diffusion profiles; lithography threshold; JSON export | 7 | Faithful to the course flow and explains the difference from self-aligned CMOS, as required. Oxidation and diffusion coefficients come from course web notes; primary sources still to be checked. |
| 06 | P–n junction | Depletion model plus equilibrium Poisson–Boltzmann Newton solver with grid and domain refinement diagnostics | 7 (+5 legacy) | `src/physics.ts` is an older junction kernel used only by its own test (Neamen example constants, ni = 1.5e10 cm⁻³). Keep as a textbook-example check or retire; see D-004. |
| 07 | PN diode | Finite-neutral-region Shockley diode, minority profiles, stored charge, series resistance, charge-control switching | 8 | Diffusivities use the 300 K lattice mobilities regardless of doping. |
| 08 | Gate control | MOS capacitor (Poisson first integral, QS and approximate HF C–V); long-channel MOSFET; imports fabrication JSON | 8 | Electron affinity corrected to Neamen's value in this pass (D-003). |
| 09 | Photonic devices | Absorption, photodiode, solar cell, LED and laser threshold | 8 | Absorption coefficients are illustrative curves, labeled as such. A tabulated, citable silicon dataset would make this quantitative (see literature review). |
| 10 | Measurement bench | Resistor/TLM extraction, FET extraction, nMOS and CMOS inverters, transient delay, five-stage ring oscillator, optical stations | 8 | No predict–observe–explain prompts yet, unlike modules 02–08. |

Every module renders without errors and without horizontal page overflow at 1440 px and 390 px.
Every form control has an accessible label.

## Physics and consistency findings

Fixed in this pass:

1. **Material parameters were duplicated in six files.** Gap, Nc, Nv, permittivities and mobilities
   were typed separately into the equilibrium, junction, diode, MOS, photonics and bench kernels.
   They now come from `src/materials.ts`, with a test that every module derives the same ni, Nc and
   Nv (D-002).
2. **Two silent disagreements with the principal reference.** MOS used χ(Si) = 4.05 eV where Neamen
   Tables 9.2 and B.4 give 4.01 eV; photonics used Eg(GaAs) = 1.424 eV where every other module and
   Table B.4 use 1.42 eV. Both now use Table B.4. The MOS change shifts flat-band voltage by +0.040 V
   (D-003).

Open, needing a decision or research (recorded in `docs/decisions.md` as pending):

3. **Intrinsic carrier density.** Modules compute ni self-consistently from Neamen's Nc, Nv and
   Eg = 1.12 eV, which gives 6.7e9 cm⁻³ at 300 K. Neamen's worked examples use 1.5e10 cm⁻³, and the
   value accepted in the device-physics literature is about 9.65e9 cm⁻³ (Altermatt et al. 2003,
   updating Sproul and Green 1991). The modules already state the 6.7e9 versus 1.5e10 discrepancy;
   whether to keep it (internally consistent, matches the book's tables) or calibrate it is a
   teaching decision (D-005).
4. **Band gap does not change with temperature.** Acceptable over 280–400 K, but module 03 runs to
   800 K, where silicon's gap is roughly 0.1 eV smaller. That changes ni by a factor of a few and moves
   the extrinsic-to-intrinsic transition. A Varshni-type Eg(T) with a cited parameter set is the
   standard, still-simple fix (D-006).
5. **Mobility does not depend on doping.** At 1e17 cm⁻³ silicon electron mobility is well below
   1350 cm²/V s, so module 03 conductivity and module 07 diffusion lengths are overestimated at high
   doping. A Caughey–Thomas fit with cited parameters is the usual minimal model (D-006).
6. **Silicon absorption is illustrative.** A published tabulated absorption coefficient would let
   module 09 make quantitative responsivity statements for silicon.

## Shared infrastructure

| Area | State | Gap |
| --- | --- | --- |
| Version control | None before this pass | Initialized with a baseline commit; `.gitignore` now excludes course PDFs, textbooks and extracted text, which would otherwise have been published. |
| Code style | Every file was written as a handful of very long lines | Formatted with Prettier; `pnpm format:check` available. |
| Navigation | Order did not match the ten-module plan (junction was 02) | Registry in `src/modules.ts`, course order, stable URLs. |
| Bundle | One 990 kB script | Code-split per module; about 230 kB plus the module in view. |
| Shared UI components | Shared app frame, course guide and lesson intro/outro added 2026-11-09 (D-009). Inside modules, sliders, plot frames and CSS are still per module (`junction.css` is reused by four) | Extract shared slider, plot, equation and assumption-panel components. |
| Directory structure | Flat `src/` | `context.md` suggests `src/physics`, `src/components`, `src/lessons`, `tests/`; worth doing together with the shared-component work. |
| Cross-module data | Fabrication JSON feeds the MOS module; otherwise none | Versioned configuration format for junction and bench inputs; shareable URL state for presets. |
| CI | None | Add a workflow that runs `pnpm format:check`, `pnpm test`, `pnpm build`. |
| External requests | None since fonts are bundled (D-010) | |

## Missing deliverables from `context.md`

| Deliverable | State |
| --- | --- |
| `docs/literature-review.md`, `paper/references.bib` | Started in this pass; no primary paper has been read in full yet. Module citations so far are Neamen, course materials and a few web sources. |
| Model cards in `docs/models/` | Materials card written; the other submodels are pending (template in `docs/models/README.md`). |
| Validation matrix | `docs/validation.md` plus generated `docs/validation-run.md`. Tolerances and observed errors still need to be lifted from each test into the matrix. |
| `docs/theory.md`, `docs/instructor-guide.md` | Not started. |
| `docs/limitations.md`, `docs/decisions.md` | Written in this pass. |
| LICENSE | Needs the owner's choice (see Next steps). |
| CITATION.cff | Added. |
| Deployment and live demo | None. The build is static, so any static host works. |
| Third-party license inventory | `docs/third-party-licenses.md` (runtime dependencies). |
| Tagged release | Not started. |
| Technical manuscript | Not started. |
| Professor-facing package | Not started. |

## Next steps, in priority order

1. Choose a license and add it. Runtime dependencies are all permissive (MIT, ISC, BSD-3-Clause; inventory in `docs/third-party-licenses.md`), so MIT or BSD-3-Clause for the code would be compatible. Written lesson content could separately use CC BY 4.0.
2. Decide D-005 (which ni to teach with), then implement D-006 (Eg(T), doping-dependent mobility)
   after reading the primary sources listed in the literature review.
3. Write model cards for each submodel and fill the validation matrix with tolerances and observed
   errors from the tests.
4. Extract shared UI components and restructure `src/`; then do visual consistency work.
5. Add guided activities to the bench; write the instructor guide and a 10–15 minute demo script.
6. CI, deployment, tagged release, then the manuscript.

## Since this audit (updated 2026-11-15)

Done:

- Version control, publishing hygiene and history cleanup; public repository with MIT license,
  `CITATION.cff`, contributing guide and issue forms.
- Shared material parameters and the two reference corrections (D-002, D-003).
- Shared app frame, course guide, learning goals, self-check questions and ten-minute demos
  (D-009); bundled fonts (D-010).
- Light theme, Presenting mode, shareable setup links, readable type and consistent naming
  (D-011 to D-013); presenter shortcuts and printable handouts (D-014).
- Automated checks and a live demo built by GitHub Actions on every push.

Still open: literature review and per-model cards, filling tolerances in the validation matrix,
the open physics decisions D-004 to D-006, shared UI components inside modules, wide diagrams on
phones, instructor guide and technical report, and feedback from instructors.

