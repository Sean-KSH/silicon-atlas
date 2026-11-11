# Limitations

What each module does not model, and the input ranges it supports. The interface shows a short
version of this beside each module; details and sources are in `implementation-notes.md` and the
model cards.

**Platform-wide.** Educational models, not TCAD or process prediction. No module has been compared
with experimental measurements. Band gap and mobility are fixed at 300 K reference values in every
module (D-006). Silicon ni is computed from the book's Nc, Nv and Eg and is about 6.7e9 cm⁻³ at
300 K, not the 1.5e10 cm⁻³ used in Neamen's examples (D-005). Diagrams that are schematic say so;
animated carriers are not particle simulations.

| # | Module | Supported range | Not modeled |
| --- | --- | --- | --- |
| 01 | Silica to wafer | Scheil: constant k, fraction solidified < 1. Growth: fixed heat extraction and bulk temperature chosen for teaching | Chemical conversion and distillation (illustrated only); solid diffusion, incomplete mixing, evaporation, crucible contamination; meniscus dynamics, thermal inertia, defects, oxygen, stress, neck and shoulder growth |
| 02 | Atoms to bands | Stationary, analytical quantum results; constant effective mass | Real silicon band structure (the chain is a one-orbital toy; direct/indirect comparison is schematic); time-dependent wave packets |
| 03 | Equilibrium carriers | Si and GaAs, 40–800 K, each dopant 0–1e18 cm⁻³ | Temperature-dependent gap; doping-dependent mobility; impurity bands and band-gap narrowing at high doping; nonparabolicity |
| 04 | Transport & lifetime | One minority species, uniform field, low injection (flagged above 1 % of majority density) | Self-consistent fields (Poisson), ambipolar transport, high injection, scattering; first-order upwind adds numerical diffusion |
| 05 | Fabricate a MOSFET | The course's four-mask metal-gate nMOS recipe with documented teaching parameters | Concentration-dependent and lateral diffusion; dopant redistribution during later oxidation; resist chemistry; full 3D etch and deposition; doped-glass cleanup (narrative only); electrical behavior of the result |
| 06 | P–n junction | Si, 1e14–1e17 cm⁻³, 280–400 K, −5 to +0.5 V; forward results withheld below a 6 kT/q barrier or above 1 % injection; fields above 100 kV/cm blocked as a conservative guard | Biased drift–diffusion solution (the numerical solver is equilibrium only); graded or 2D junctions; avalanche, tunneling and breakdown |
| 07 | PN diode | Si, 1e14–1e17 cm⁻³, 280–400 K, low injection | High injection; spatial trap-assisted recombination (the recombination term is empirical); depletion width feeding back on neutral lengths; breakdown |
| 08 | Gate control | Long channel (L ≥ 2 µm), tox 10–150 nm, 280–400 K | Subthreshold conduction, short-channel effects, velocity saturation, poly depletion, quantum confinement; HF C–V near flat band is omitted, not approximated |
| 09 | Photonic devices | Monochromatic illumination, 300–1600 nm, ≤ 2000 W/m² | Measured absorption spectra (curves are illustrative), AM1.5 spectrum, drift–diffusion collection, avalanche gain, thermal feedback, LED droop, full laser dynamics |
| 10 | Measurement bench | Teaching transistor and instrument parameters, not fitted wafer data | Subthreshold current, breakdown, velocity saturation, self-heating, distributed interconnect, rectifying contacts |

**Interface.** On phones, plots and controls are usable, but a few wide schematic diagrams (for
example the junction geometry strip and the MOS gate stack) scale down to fit and their labels
become small; landscape orientation or a laptop is better for those. The light theme's colours
are generated from the dark ones and were checked visually module by module, not individually
hand-tuned.

