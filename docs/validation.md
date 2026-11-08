# Validation matrix

What the automated checks establish, module by module. The generated record of the latest run
(every test group, pass/fail, commit hash) is [`validation-run.md`](validation-run.md); regenerate
it with `pnpm validate`.

**Scope of the evidence.** Every check below is *implementation verification*: the code reproduces
an analytical limit, a conservation law, an independent calculation, a textbook worked example, or
converges under refinement. None of it is comparison with physical measurements. No module has been
validated against experimental data, and the platform should not be described as experimentally
validated. Visual inspection of screenshots is not counted as validation.

Kinds of check: **A** analytical limit or closed form; **C** conservation or balance; **I**
independent reference calculation (separate quadrature, finite differences, dense sweep); **R**
mesh, time-step or quadrature refinement; **T** textbook worked example; **G** guard (unsupported
input is rejected, failure is reported).

"Tolerance / observed" lists figures already recorded in the implementation notes. Filling this
column for every row from the test source is an open task.

| Module | Model | Checks | Kind | Tolerance / observed | Status |
| --- | --- | --- | --- | --- | --- |
| 01 | Scheil segregation | k = 1 uniformity; mass balance over 16 finite intervals; midpoint quadrature at 1000/2000 cells; interval additivity, linear scaling; f = 1 rejected | A C I R G | Mass-balance relative residual < 1e-13 | pass |
| 01 | Lumped growth heat balance | Power, energy and mass conservation at 9 corners; zero-superheat D ∝ vp^(-1/2); temperature and speed trends; invalid inputs rejected | A C I G | Not yet recorded | pass |
| 02 | Infinite well | E ∝ n²/(m L²); Neamen Ex. 2.3; normalization and orthogonality at 512/1024 samples | A T I R | Not yet recorded | pass |
| 02 | Rectangular barrier | Zero width/height, threshold continuity, high-energy and thick-barrier limits, resonance; Neamen thick-barrier example | A T | Not yet recorded | pass |
| 02 | Tight-binding chain | Band derivatives by finite differences, symmetry, effective-mass sign, isolated-atom limit | A I | Not yet recorded | pass |
| 02 | Diamond-cubic cell | 8 atoms per conventional cell, 4 nearest neighbors | A | Exact | pass |
| 03 | Charge neutrality, MB/FD | Intrinsic neutrality across materials and temperatures; compensated and incomplete ionization balance; complete-ionization quadratic limit; freeze-out and intrinsic trends; F1/2 against references with 128/256/512-point refinement; non-Boltzmann mass-action departure | A C I R G | Not yet recorded | pass |
| 04 | Continuity, finite volume | Gaussian variance growth; signed drift displacement with spatial refinement; exponential decay with time-step refinement; approach to Gτ; carrier ledger closes for all boundary types; current signs | A C R | Not yet recorded | pass |
| 05 | Deal–Grove oxidation | Initial condition; growth equation; composition of steps; linear and parabolic limits; reference coefficients and temperature trends | A I | Not yet recorded | pass |
| 05 | Diffusion profiles | Gaussian dose conservation and erfc supplied dose by refined independent quadrature (1000/2000 samples); junction root | A C I R | Not yet recorded | pass |
| 05 | Lithography, etch, connectivity | Exposure threshold limits; reproducible snapshots; silicon consumption; ideal lift-off; terminal connectivity for nominal and fault recipes; etch with 80/160/320 lateral refinement | A R G | Not yet recorded | pass |
| 06 | Depletion approximation | Charge neutrality; one-sided widths; reverse-bias square-root scaling; field and potential consistency by finite differences | A I | Legacy kernel: Neamen Ex. 7.1–7.5 within 0.4 % | pass |
| 06 | Poisson–Boltzmann (equilibrium) | Integrated charge equals boundary displacement field; flat EF and mass action; peak-field spatial refinement and domain refinement; symmetric solution; nonconvergence reported; no EF line under bias; 280–400 K | C I R G | Not yet recorded | pass |
| 07 | Ideal diode, finite neutral regions | Zero current and excess charge at equilibrium; area scaling; ideal semilog slope; boundary concentrations and current continuity; stored charge by independent quadrature (1000/2000); long and short limits Q/I → τ and W²/2D | A C I R | Not yet recorded | pass |
| 07 | Series resistance, recombination term, switching | Series KCL residual; empirical current explicit; charge-control balance; switching ends exactly at zero charge | C G | Not yet recorded | pass |
| 08 | MOS capacitor | Flat band and charge neutrality; 1/tox scaling; QS capacitance against finite differences of charge; band profile quadrature refinement; HF asymptote | A C I R | Not yet recorded | pass |
| 08 | Long-channel MOSFET | Zero VDS, cutoff, W/L scaling, continuity at region boundaries; gm against finite differences with CLM and body effect; n/p mirror symmetry; fabrication import accepted/rejected | A I G | Not yet recorded | pass |
| 09 | Optical generation and devices | Photon-flux units and integrated generation convergence; responsivity identity, area scaling, zero and sub-gap limits; PIN trends; ideal solar ISC, VOC, MPP against closed forms and a 10,001-point sweep; power accounting; LED rate balance; laser threshold | A C I R | Not yet recorded | pass |
| 10 | Bench circuits and extraction | Sheet and contact resistance recovery; threshold and mobility extraction (both methods); seeded noise reproducibility; inverter DC limits and KCL; delay vs capacitance; time-step refinement; stationary ring equilibrium; ring frequency vs independently paired stage delays; scope loading; receiver RC convergence | A C I R | Ring: 1.079 MHz vs 1.081 MHz from paired delays; halving dt changes f by 0.0011 % | pass |
| Shared | Material parameters | Values equal Neamen Table B.4/B.6; identical ni, Nc, Nv across modules at 280–400 K; no per-module redefinition of gaps or Cox | A | Relative 1e-12 | pass |

## Not yet validated

- Agreement with any measured data (absorption spectra, I–V, C–V, oxide growth runs, ring
  oscillator frequencies). The ECE 308 lab data in the course materials could support a
  comparison for the bench module if the author's own measurements may be used.
- Literature benchmarks for the numerical solvers (for example a published Poisson–Boltzmann
  junction profile).
- Rendering: the interface is checked visually, and per-module pixel comparisons were used to
  confirm that refactors did not change appearance, but no automated UI tests exist.
