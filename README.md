# Junction Lab

An interactive React + TypeScript + Recharts undergraduate teaching module for an abrupt silicon p–n junction. SVG physical diagram, four quantitative profiles, logarithmic doping controls, presets, beginner/deeper views, three prediction experiments, equations, sources and SI CSV export.

## Run

With Node 22+ and pnpm installed:

```sh
pnpm install
pnpm dev
```

Open http://127.0.0.1:5173. For verification: `pnpm test` and `pnpm build`.

## Model and sources

`src/physics.ts` is independent of React. All inputs and calculations use SI; UI conversions occur at boundaries. Temperature is deliberately fixed at 300 K to avoid inventing temperature-dependent material fits. Constants ni=1.5e10 cm^-3 and epsilon_r=11.7 follow Neamen 4e worked examples; exact SI q and k produce small differences from the textbook's rounded constants.

Read source files supplied in `Context/`:
- Neamen, *Semiconductor Physics and Devices*, fourth edition, §§7.2–7.3, printed pp. 243–255 / PDF pp. 268–280. Examples 7.1–7.5.
- Topic 8, *pn junction*, PDF pp. 3, 5–8, 10, 12–13.
- Topic 9, *pn junction diode*, PDF pp. 3–4 (bias); pp. 6–9 identify transport models deliberately outside this module.
- Topic 5, *Making Si and MOSFET Process Flow*, PDF pp. 8–36. The in-app panel preserves the course's wet oxide / positive-resist / phosphorus-diffusion / dry-gate-oxide / contacts / aluminum lift-off sequence.

Source distinctions: the slides' “Neaman 1.2” pointer does not identify the junction material in the supplied edition. The actual fabrication yields graded, 2D diffused junctions; this module does not model that process geometry. The slide convention VR >= 0 maps to Va = -VR here.

## Validation

Five automated test groups pass:
1. Neamen Ex. 7.1/7.2/7.3/7.5: built-in voltage, width, peak field, capacitance match rounded reference results within 0.4%.
2. 48 parameter combinations: charge neutrality, field boundaries, potential boundary, field integral and energy sign.
3. Symmetry, reverse-bias monotonicity and square-root width scaling.
4. Independent finite-difference checks: dQ/dVR=C', E=-dφ/dx, dE/dx=ρ/ε.
5. Invalid inputs throw explicit errors; CSV exports labelled SI data.

At NA=1e16 and ND=1e15 cm^-3, Va=0: Vbi=0.634 V, W=0.950 µm, C'=10.91 nF/cm². At Va=-5 V: W=2.831 µm and C'=3.66 nF/cm².

There is no numerical solver: sampled points evaluate exact piecewise solutions, with depletion boundaries and the junction inserted explicitly. Step plotting preserves charge discontinuities. No grid convergence claim applies. TypeScript and production build pass. Vite warns of a >500 kB chart-library bundle; this affects load size, not physics.

## Limits

Si only, 300 K, net doping 1e14–1e17 cm^-3, Va=-5 to +0.4 V. Full ionization, Boltzmann statistics, planar abrupt junction, zero neutral-region field. No current solver, optical response, avalanche/tunneling, recombination, series resistance, or diffusion capacitance. The forward-bias depletion approximation weakens near strong injection; an explicit warning appears when the estimated minority/majority ratio exceeds 1%. Breakdown is not predicted. External Google Fonts are optional; system serif/sans-serif fallbacks keep the app usable offline after dependencies are installed.

SVG ion symbols are conceptual, not particle counts. The view rescales spatially as W changes. Electron electrostatic energy is not a full band diagram. There is no decorative particle animation.

## From silica to silicon wafer module

Open `http://127.0.0.1:5173/#wafer` (default module). The existing junction remains at `#junction`.

Six navigable process stages distinguish chemical purity, crystal structure and geometry. Cross-sections are illustrations; chemical conversion/distillation is not simulated quantitatively. CZ drawing labels seed, crystal, melt and crucible without predicting quality from pull speed or rotation.

`src/segregation.ts` implements the Scheil model independently of rendering. Concentrations are mass fractions internally, converted to ppb by mass at the UI. The coefficient k is hypothetical, not a named material value. The selectable retained interval [a,b] has an exact mass-weighted average using the integral of Cs. All evaluated fractions are below 1; the curve ends at 0.999. CSV includes the selected parameters and average. Log/linear axes and k=0.1,1,2 comparisons are available.

Additional source reading: Neamen §§1.6–1.7.1 (printed pp. 15–19), course Topic 5 PDF pp. 3–6 and 8; Cambridge Bhadeshia's The Scheil Equation (AH10); WACKER's 2022 report, Purity Is Our Recipe for Success, for conventional Siemens polysilicon deposition. URLs are in the app's sources panel.

Five additional test groups pass: k=1 uniformity; 16 finite-interval mass-balance cases (relative residual <1e-13); independent midpoint quadrature with 1000/2000-cell refinement; partition ratio, trend reversal, interval additivity and linear concentration scaling; rejection of f=1 and invalid parameters. Ten total test groups pass across both modules. No numerical solver is used for displayed averages.

Limitations: constant k, complete liquid mixing, no solid diffusion, closed dilute melt; no feed additions, evaporation, crucible contamination, defects or extra phases. Not a calibrated CZ growth model, moving-zone refining simulation or carrier/resistivity model. Purification illustrations do not specify yield or final impurity concentration.

## Scientific presentation update

The materials module now uses the scoped Silicon Atlas design in `src/product.css`. `src/ProcessFigure.tsx` provides six annotated, vector equipment/material illustrations with sectional hatching, metal/ingot shading and explicit schematic labels. These illustrations are not engineering drawings or calibrated geometry. Small screens allow horizontal inspection of the equipment figure so its annotations remain readable.

The retained-segment strip follows the same [a,b] controls as the computed average and plot. **Export figure** creates a standalone, editable SVG on a white background, with the current parameters, axis scale, comparison curves, retained interval, assumptions and model attribution. `src/exportFigure.ts` generates it directly from the same physics functions; it does not screenshot the dashboard. A verified default example is in `output/scheil-segregation-example.svg`. Publication formatting still needs to follow the chosen journal's specifications.

Validation after the presentation update: ten physics test groups and TypeScript pass; production build passes. Desktop diagrams, quantitative plot and exported SVG were visually inspected. Build retains a chart-bundle size advisory; no hosting/deployment is included.

## Animated thermal-growth laboratory

The wafer module includes a playable, pausable, scrubbable 180-minute body-growth run with melt-temperature and pull-speed controls, 60×/600×/1200× playback, and baseline/hotter/faster presets. The animation is user-started and pauses when its tab is hidden. Conditions reset the clock; the module reset also restores the thermal lab. Body diameter and length share a fixed spatial scale; apparatus and seed are schematic.

`src/growth.ts` uses a derived lumped interface heat budget:

- Qout = h A (Tb − Tm) + rho A vp Lf
- A = Qout / (h (Tb − Tm) + rho vp Lf)
- D = sqrt(4A/pi), length = vp t, mass = rho A length

Fixed boundary assumptions: Qout=600 W, h=500 W/(m² K), 5 kg melt, 300 mm crucible. These are selected teaching conditions, not calibrated process/material data. Adopted constant properties: density=2330 kg/m³, latent heat=1.8e6 J/kg (Crystals 2020, 10, 121, Table 2); Tm=1687 K (Jefferson Lab). Only the material constants are adopted from the floating-zone paper, not its process model. Sources and definitions are linked in the thermal equations panel.

The predicted diameter is the steady cylinder compatible with the chosen cooling closure; it is not a dynamic meniscus/shape/stability solution. No thermal inertia, defects, stress, radiation/convection fields, neck/shoulder growth, oxygen contamination, or k(T,v) is predicted. Bulk temperature stays controlled, interface stays at Tm, and melt level is assumed actively maintained. No numerical time integration is used: animation samples exact time-dependent formulas, so playback speed cannot change the physics.

Five additional test groups pass (15 total): instantaneous and integrated energy/mass conservation at nine parameter combinations; the zero-superheat D ∝ 1/sqrt(vp) limit; temperature/speed trends; independent baseline calculation and time sampling; invalid-domain rejection. Browser verification confirmed play/pause, scrubbing, and hotter/faster presets. Under these assumptions, at 90 min baseline yields D=107.7 mm, length=72.0 mm; hotter melt (+80 K) yields D=89.2 mm, length=72.0 mm; faster pulling (1.6 mm/min) yields D=79.2 mm, length=144.0 mm.

## From Atomic Structure to Energy Bands

Open `http://127.0.0.1:5173/#atomic` after `pnpm dev`. The third module links a draggable diamond-cubic cell (Miller planes and tetrahedral neighbors), analytical infinite well, exact rectangular-barrier scattering, and a one-dimensional nearest-neighbor tight-binding chain. Beginner/deeper views, three prediction experiments, SI CSV export and chapter/page citations are included.

Physics is independent of rendering in `src/atomicPhysics.ts`. SI inputs use explicit eV/nm/mass conversions in the UI. The constant positive effective mass is shared by well and barrier; a button optionally transfers the toy band's bottom curvature mass. The one-orbital chain is not a silicon band calculation, and direct/indirect comparison is a separate schematic. Lattice spheres are geometry, not electron probability clouds. All quantum results are stationary and analytical; no time-step solver is claimed.

Validation adds six groups: well 1/L², 1/m and n² scaling; Neamen Example 2.3; independently integrated normalization and orthogonality at 512 and 1024 samples; zero-height/width, threshold continuity, high-energy, thick-barrier and resonance transmission limits; Neamen Example 2.5; finite-difference band derivatives and mass signs; diamond cell sharing and four nearest neighbors. Total: 21 passing test groups. Browser checks cover crystal drag and planes, state selection, well scaling, barrier threshold/zero width, signed band mass, and linked mass transfer.

## Equilibrium Semiconductor Explorer

Open `http://127.0.0.1:5173/#equilibrium`. Controls include Si/GaAs, 40–800 K, independently enabled donors and acceptors, and Boltzmann or Fermi–Dirac-integral carrier statistics. Synchronized energy panels show band/impurity/Fermi/intrinsic levels, DOS, exact FD occupation, and carrier distributions. Total and ionized populations, conductivity, a temperature sweep, three experiments and SI CSV export are included.

`src/equilibrium.ts` solves uniform charge neutrality by bracketed bisection with isolated donor/acceptor statistics (degeneracy factors 2/4). The FD mode evaluates normalized F1/2 using the substitution epsilon=u² and Simpson quadrature. Failures are exposed, and tiny neutral fractions are explicitly retained for compensated samples. Boltzmann mode is labeled approximate outside the 3kT nondegenerate criterion; np=ni² is imposed only through those analytic Boltzmann formulas, never in FD mode.

Parameters come from Neamen Tables 4.1, 4.3, 4.4 and B.4. Important limitation: bandgap and mobility are held fixed at their documented reference values; the temperature sweep is a qualitative occupation/ionization lesson, not a calibrated thermal conductivity model. Intrinsic density is computed consistently from the chosen DOS and gap rather than mixed with Neamen's different empirical ni table. Continuum band DOS excludes discrete dopant states. High-density impurity interactions and nonparabolicity are omitted and flagged.

Validation adds seven groups: intrinsic neutrality across materials/temperatures/statistics, compensated charge balance, complete-ionization quadratic limits, freeze-out/extrinsic/intrinsic trends, FD integral reference and 128/256/512-point refinement, FD neutrality-grid refinement and mass-action departure, and input/mobility unit checks. UI checks reproduced intrinsic Si n=p=6.68e9 cm^-3, 40 K donor ionization 3.75%, compensated n≈5.98e15 cm^-3, and high-doping GaAs FD mass-action departure. The default concentration plot omits values below 1e8 cm^-3 from view only; a full-range checkbox reveals the unmodified tails.

## Carrier Transport and Lifetime

Open `http://127.0.0.1:5173/#transport` after `pnpm dev` (or `npm run dev`). Five modes cover drift, diffusion, combined transport, uniform pulse decay and sustained generation. Play, pause, step and scrub the calculated density bar; switch electron/hole minority carriers, boundaries, resolution and current/flux views. Includes three prediction experiments, equations, Neamen chapter/page references, a carrier ledger and snapshot CSV in SI units.

`src/transport.ts` evolves one minority excess population with a prescribed majority reservoir and uniform field. A conservative cell-centered finite-volume method uses upwind drift, centered diffusion and positivity-limited explicit Euler steps. Sources, recombination and signed boundary transfers use the same discrete update. Absorbing, zero-excess-flux and periodic boundaries are explicit. The optional Einstein relation uses 300 K. Parameter changes restart the run; animation samples solver snapshots and is not a scattering simulation.

Six new validation groups cover Gaussian variance, signed drift displacement and spatial refinement, exponential decay with time-step refinement, approach to Gτ, balance across all boundary types, combined Gaussian profile convergence, and current signs. The complete suite has 34 passing groups. First-order numerical spreading remains; this is not a self-consistent Poisson/ambipolar or device-circuit model. Low injection is flagged above a 1% excess/majority ratio.

## Fabricate a MOSFET

Run `npm run dev` and open `http://127.0.0.1:5173/#fabrication`. The sixth module implements 26 deterministic snapshots of the course's four-mask metal-gate nMOS process. It includes linked top/cross-section views, forward/back stepping, a paced tour, drag-to-align masks, a movable section line, 1×/3× vertical scales, failure presets, three experiments, and CSV/JSON export. JSON includes the recipe and all material snapshots, so a later device module can reconstruct the process geometry. CSV reports an under-window donor profile, background/net doping, corner and center oxide thicknesses, centerline source–drain gap, and source–drain footprint overlap width in SI units.

Course sources read before implementation: Topic 5, PDF pp. 8–37 (especially the mask registration on p. 37); Topic 2.5 Photoresist, PDF pp. 2, 4–5, 7 and 12. Exact page references and external parameter links are in the app. Illinois ECE444 GT8 supplies Deal–Grove coefficients with the (100) orientation correction; GT10 supplies constant phosphorus diffusivity. Alberta nanoFAB documents the thin dry-oxide limit and 0.4407 silicon consumption factor. Mask dimensions, resist/metal thicknesses, blur, exposure threshold and etch rate are explicitly chosen teaching parameters.

The independent kernels in `src/fabrication.ts` use SI throughout. Oxidation and the alternative erfc/Gaussian profiles are analytical; junction depth uses bisection. Lithography convolves rectangular clear masks with a Gaussian then applies a positive-resist threshold. A 160×80 height-field grid applies directional or isotropic oxide removal, with ideal material selectivity. Connected-component checks distinguish source/gate/drain metal and detect bridges, missing contacts and gate-to-silicon contact. Top color represents the uppermost material; the section reveals buried layers.

Seven new validation groups cover oxidation initial/composition equations and linear/parabolic limits; reference coefficients and temperature trends; independent 1000/2000-sample diffusion-dose integrals; junction roots and exposure limits; repeatable independent snapshots and lift-off; nominal/fault terminal checks; and etch limits with 80/160/320 grid refinement. All 41 test groups, TypeScript and production build pass. Browser checks include nominal/fault presets, actual mask dragging, backward/forward stepping, and a downloaded CSV. Nominal results: gate oxide 54.82 nm, source–drain gap 10.5 µm, junction depth 0.5362 µm. These are model outputs, not measured fabrication data.

Limits: no concentration-dependent or lateral diffusion, no subsequent dopant redistribution during gate oxidation, no optical/resist chemistry calibration, no full 3D etch or deposition/lift-off physics, and no electrical device solution. Very thin dry oxide is flagged. The lecture's doped-glass cleanup is narrative-only. A final backside oxide-clear step is explicitly added because the slides show backside gate oxide followed by substrate metal without detailing that clear. The course flow is explicitly distinguished from self-aligned CMOS. Production build retains the existing chart bundle-size advisory.

### Guided fabrication viewer

The default layout now pairs brighter top and cross-section views, with an Enlarge diagrams option and collapsible recipe controls. Every snapshot includes a specific action and observation prompt. Run tested demo restores the baseline and plays once from step 0 to 25 at 2, 4 or 7 seconds per step; playback pauses when the page is hidden. These are instructional snapshot timings, not process kinetics. Restore tested defaults starts over; Reset recipe at this step preserves the selected step while restoring all process settings and alignment; Reset view / section restores the center section and 3× scale without changing the recipe. The baseline banner checks the completed geometry and explicitly limits “working” to this teaching model. Verified default recovery from a misaligned contact preset, end-of-tour stopping, TypeScript and production build.

## PN Junction Electrostatics — expanded Chapter 7 lab

Run `npm run dev` and open `http://127.0.0.1:5173/#junction`. This replaces the original fixed-temperature junction interface with six vertically aligned spatial plots (doping, carriers, charge, field, potential, and Ec/Ev/Ei/EF), adjustable NA/ND/T/epsilon/bias, symmetric and one-sided presets, experiments, SI CSV and a source/equation panel. The legacy `physics.ts` stays as a separately tested Neamen example reference.

`src/junction.ts` keeps the independent electrostatics calculations in SI. Equilibrium Poisson–Boltzmann uses a cell-centered finite-volume grid with the abrupt doping step on a face; exact neutral-reservoir Dirichlet values; an analytic tridiagonal Newton solve; and backtracking. It exposes nonconvergence and recomputes grid-doubling and domain-padding comparisons for the chosen controls. Displayed cell fields average conservative face fields. A finite-domain net charge is compared to its boundary displacement field rather than silently forced to zero.

The six plots share one spatial domain, margins, x ticks and synchronized cursors. In equilibrium, depletion-mode carriers are an explicitly labeled Boltzmann reconstruction that does not enter its box-charge approximation. PB includes mobile space charge self-consistently. Under bias the Fermi-level line is omitted and mobile carriers are only ideal neutral-region reservoirs; no biased drift–diffusion solution is claimed.

Source: supplied Neamen Chapter 7, printed pp. 243–255 / PDF pp. 268–280, with DOS/gap parameters from Table 4.1 and Table B.4. `ni(T)` is calculated from Nc/Nv proportional to T^(3/2) and constant Eg=1.12 eV. Its 300 K value (~6.68e9 cm^-3) differs from the empirical 1.5e10 used in the book's numerical examples; the discrepancy is explicit. T is restricted to 280–400 K with full ionization imposed. Forward results are withheld below a 6VT barrier or above 1% injection; fields above 100 kV/cm are blocked as a conservative guard, not a breakdown prediction. No avalanche, tunneling, freeze-out, quasi-Fermi transport or diffusion capacitance.

Validation: 48 passing test groups across the app, including seven new junction groups. Checks cover charge neutrality, finite-volume integrated charge versus boundary field, E=-dphi/dx in both modes, opposite electron-energy bending, one-sided/symmetric widths, doping/reverse-bias scaling, capacitance derivatives, numerical symmetry, mass action, grid/domain refinement, temperature changes and failure guards. TypeScript and production build pass (existing chart-bundle size advisory remains). Browser checks confirmed numerical diagnostics, aligned readable axes and band plots, removal of EF under reverse bias, and rejection of strong forward bias. Default PB: 4 Newton iterations, residual 4.57e-11; doubling 160 to 320 cells/side changes sampled peak field by ~0.51%.

## PN Diode — From Carrier Injection to Circuit Behavior

Launch with `npm run dev`, then open `http://127.0.0.1:5173/#diode` (navigation item 07). `npm test` runs physics validation; `npm run build` type-checks and builds production assets.

The independent SI kernel in `src/diode.ts` calculates finite-neutral-region minority diffusion, saturation-current contributions, signed excess charge, depletion-reference bands and quasi-Fermi levels. One analytical solution approaches both long- and short-diode limits. The UI links linear/semilog I–V, minority profiles, spatial electron/hole currents and bands. Controls cover temperature, bias, area, doping, lifetimes and neutral lengths. Presets, reset, three prediction experiments, equations/source references and profile CSV are included. Optional lumped series resistance uses bracketed bisection; a separate user-selected ideality-2 prefactor represents empirical depletion recombination.

Sources read: supplied Neamen Fourth Edition Chapter 8, printed pp. 278–289, 292–301 and 313–317; PDF pages and section numbers appear in the app. Silicon DOS/gap/mobility references follow the other modules. The calculated ni (~6.68e9 cm^-3 at 300 K) versus the book's example value (1.5e10) is explicitly identified.

Eight new test groups validate zero equilibrium current and flat Fermi levels; area and semilog scaling; boundary concentrations/current continuity; independent 1000/2000-point stored-charge quadrature convergence; long Q/I→tau and short Q/I→W²/(2D) limits; series residual/empirical current/invalid bias; charge-control differential balance and zero-charge event; and switching sample endpoints across presets. All 56 app test groups pass, as do TypeScript and production build (existing large-bundle advisory remains). Browser inspection checks readable axes, valid series/short presets, recombination toggle, switching endpoint and reset.

Limits: full ionization, nondegenerate low injection, fixed gap and constant mobilities, 280–400 K, doping 1e14–1e17 cm^-3. Neutral lengths remain fixed as depletion width changes. Tiny majority-field voltage drops are neglected. High injection or low depletion barrier is rejected; a conservative field cutoff is not a breakdown model. Empirical recombination has no spatial trap solution, so spatial curves remain explicitly labeled ideal-reference results. Switching uses dQ/dt=I−Q/tauQ with a prescribed current step and steady-state Q/I residence time. It models turn-on charge and reverse storage only, not the distributed transient, depletion capacitance or late recovery tail. Animation stretches calculated time for viewing.

## Gate Control — MOS capacitor to MOSFET

Open `http://127.0.0.1:5173/#mos` (08 / Gate control). Launch using `npm run dev`; validate with `npm test` and build with `npm run build`.

The Chapter 10–11 lab links a selectable nMOS/pMOS gate stack to two views. Part A solves the one-dimensional equilibrium Boltzmann–Poisson first integral for semiconductor charge and surface potential, with gate work function and fixed interface-equivalent oxide charge. It displays a charge-balanced stack, calculated band bending, synchronized potential/charge/QS capacitance sweeps, a separately labeled approximate high-frequency C–V overlay, presets and once-through equilibrium bias animation. The HF overlay omits the near-flat-band transition (|normalized surface potential| < 3 thermal volts) rather than claiming an exact AC solution. Nondegenerate-limit sweep points are omitted; operating-point extrapolation is explicitly flagged.

Part B uses the long-channel strong-inversion charge-sheet model with constant chosen channel mobility, source-end body-effect threshold, signed n/p conventions, output/transfer curves, gm and channel potential/charge. Optional empirical CLM multiplies the saturation branch by 1 + lambda (normalized VDS − overdrive), preserving current continuity. Channel profiles remain the ideal reference. No subthreshold extension, nanoscale claim, drain-region field solution or breakdown model is included. The saturation endpoint represents pinch-off, not the actual drain potential.

Fabrication interoperability accepts completed `silicon-atlas-fabrication-v1` JSON exports and re-simulates their recipe. Incompatible contacts/oxide/gate coverage are rejected. The nominal recipe reduces to tox = 54.817 nm, L = 10.5 µm, W = 8.5 µm, NB = 1e15 cm^-3. Width uses a central rectangular strip excluding rounded corners; harmonic-mean oxide preserves the strip's parallel oxide capacitance. Uniform channel substrate doping is retained; source/drain depth profiles are not averaged into it. Other electrical settings restore documented defaults, so mobility and gate work function are not inferred from process metrology. A nominal-import button is also available.

Sources read: supplied Neamen Fourth Edition, Chapter 10 §§10.1–10.3.5 (printed pp. 372–422, PDF pp. 397–447), Chapter 11 §§11.1.1–11.1.4 (pp. 444–453, PDF 469–478). The source panel separates Poisson-based equilibrium charge, approximate HF depletion capacitance, gradual-channel transistor physics and the empirical CLM extension. The fixed-gap ni discrepancy with book examples is explicitly stated, as in the previous modules.

Eight new test groups cover flat-band/gate charge neutrality, inverse-tox scaling, capacitance versus independent charge differences, band-profile spatial quadrature refinement, HF asymptote, zero VDS/cutoff, region-boundary continuity, W/L scaling, gm finite differences, n/p symmetry, body effect, nominal import and invalid import rejection. There are 64 test groups across the app. UI checks include flat band, C–V axes, pMOS current signs, nominal fabrication import and reset. All computations use SI; plotted capacitance converts to fF/µm² and energies to eV. CSV exports C–V and output I–V data.

## Electronic to Photonic Devices — Chapter 14

Open `http://127.0.0.1:5173/#photonics` (09 / Photonic devices). Start with `npm run dev`; run `npm test` and `npm run build` for validation/build.

Four experiments share explicit Si/GaAs gap, wavelength, monochromatic irradiance, thickness, area, reflection and assumed collection inputs. Absorption plots photon energy, labeled illustrative direct/indirect alpha curves and Beer–Lambert intensity/generation. The photodiode adds dark/illuminated I–V, external QE, responsivity, a fully depleted PIN geometric capacitance and approximate transit/RC bandwidth. Solar uses a monochromatic illuminated ideality-1 diode with independent series/shunt options, a solved load intersection, ISC/VOC/MPP/FF/efficiency and a complete incident-power budget. LED uses first-order radiative/nonradiative lifetime competition with injection/extraction efficiency, electrical/optical power and exact lumped turn-on animation. Introductory laser controls calculate imposed-gain versus Fabry–Pérot cavity loss; they do not predict threshold current, laser output power or a laser spectrum.

Sources read: supplied Neamen Fourth Edition Chapter 14 §§14.1–14.6, with exact topic/page references in the source panel; Topic 4 PDF slides 3–4, 8–9, 19–22 and 25–27; Topic 10 PDF slides 3–9, 14–15, 29–37. The generation equation on Topic 4 slide 25 is visually checked: its extra q is appropriate only if photon energy is represented numerically in eV. The implementation uses joules and G=alpha*I/Ephoton. Slide 22's illustrative exponential values are not treated as exact data. No AM1.5 spectrum is fabricated or inferred from the lecture graphic, and historical source efficiency figures are not represented as current records.

Physics is independent in `src/photonics.ts`. The absorption coefficients, collection efficiency, J0 at 300 K, PIN effective drift parameters and LED lifetime presets are declared teaching assumptions. J0(T) uses fixed-gap T^3 exp(-Eg/kT) scaling; other optical/material properties do not change with temperature. The solar solver uses bracketed roots and bounded MPP optimization; nonconvergence, VOC above Eg/q and power violations are exposed. No avalanche, detailed drift–diffusion collection, realistic absorption dataset, thermal feedback, density-dependent LED droop or laser rate-equation model is claimed. Emission is assumed monochromatic at Eg. Animation stretches time but uses calculated first-order population dynamics.

Eight new tests verify photon units and integrated-generation quadrature convergence, responsivity identity and zero/subgap limits, PIN bias/capacitance trends, analytic ideal ISC/VOC and a 10,001-point independent MPP reference, resistive/load residuals and optical power accounting across material/temperature choices, illumination/temperature trends, LED steady/transient rate balances and cavity threshold. All 72 app test groups, TypeScript and the production build pass. Browser checks cover readable solar/photodiode plots, series/shunt toggles, zero-light FF handling, material selection, LED turn-on/reset and threshold control. CSV exports generation and solar I–V in SI. The existing large-bundle build advisory remains.

## Virtual semiconductor measurement bench — ECE 308

Open `http://127.0.0.1:5173/#bench` (10 / Measurement bench). Run `npm run dev` to launch, `npm test` to validate, and `npm run build` for production. Edit the controls, then select **Run acquisition**; **Restore tested setup** restores the working defaults. CSV includes the acquired configuration and SI data.

Six stations cover Ti/Ag and n+ silicon geometry extraction, MOSFET output/transfer measurements, course enhancement-load nMOS versus CMOS DC behavior, loaded inverter transients, a five-stage ring with optional sixth buffer, and solar/photodiode characterization. Source pages are listed in the expandable panel: supplied Fall 2025 ECE 308 Measurements v6 pp. 4–17 and 23–29, plus Topic 7 FET circuits 2 slides 3–18. The manual's old aluminum label, overview CMOS wording, output-clamp instruction and approximate buffer correction are explicitly distinguished from the implemented circuit.

`src/bench.ts` contains rendering-independent SI circuit and instrument models. Resistor fits separate sheet resistance from equal contact resistances. Both linear-ID (including finite VDS correction) and saturation-sqrt-ID regressions extract threshold and mobility. Long-channel square-law transistor currents, chosen body effect and continuous saturation CLM drive bracketed DC KCL solutions and simultaneous RK4 capacitor dynamics. No oscillation frequency is prescribed. The unperturbed solved DC equilibrium is stationary; startup adds 0.1% VDD to node 1. Scope capacitance and 1 MΩ resistance load inverter/ring nodes; the optical receiver includes scope capacitance but assumes infinite scope resistance, as stated in its panel. Receiver dynamics use implicit backward Euler with a bracketed diode solve.

Seeded Gaussian readout noise, quantization and ohmic contact resistance are separately optional; ideal reference predictions remain available. Noise does not drive circuit startup. Optical characterization reuses the explicitly illustrative silicon absorption law, a monochromatic source and assumed collection efficiency; it does not invent laboratory calibration data or AM1.5 illumination. Finite sweep spacing intentionally produces extraction error even without noise.

Validation: all **80 test groups** pass, including eight new bench groups for resistor/contact recovery, both transistor extractions, reproducibility, inverter DC limits/KCL, delay/capacitance scaling, timestep refinement, stationary ring equilibrium, independently paired stage delays, scope loading, solar compliance and receiver RC convergence. Default buffered ring: approximately **1.079 MHz**, compared with **1.081 MHz** from independently paired edge delays; halving dt changes frequency by about **0.0011%**. TypeScript and production build pass; Vite retains its existing large-bundle advisory. Browser checks verified resistor contact extraction, channel selection and saturation extraction, optical outputs, ring traces and readable axes.

Limitations: chosen teaching transistor/material/instrument parameters are not fitted wafer data. Lumped capacitances omit distributed interconnect, junction capacitance variation and several gate parasitics; models omit subthreshold current, breakdown, velocity saturation, self-heating and rectifying contacts. Extreme low-drive settings can expose a solver step-budget or insufficient-oscillation diagnostic. These are shown rather than hidden by clamping.
