# Literature review

`context.md` asks that each model rest on primary sources that have actually been read, with
the exact equation, table or figure used. This file tracks that work. It is at an early stage:
the modules currently cite Neamen (4th ed.), the course lectures and lab manual, and a few web
references. No primary research paper has yet been read in full for this project.

## Status key
- **read**: full text read; specific equations, tables or figures recorded below.
- **located**: bibliographic record confirmed by search (title, authors, venue); full text not read.
  Nothing may be cited as supporting a specific equation or value at this status.
- **to locate**: identified as relevant; record not yet confirmed.

## Sources the modules already use

| Source | Used for | Status |
| --- | --- | --- |
| D. A. Neamen, *Semiconductor Physics and Devices: Basic Principles*, 4th ed., McGraw-Hill, 2012 | Principal reference for modules 02–09; parameter tables (Appendix B) | read (relevant chapters; page references in each module) |
| ECE 308 lecture slides (Topics 2–10) and Fall 2025 measurements manual v6 | Scope, fabrication sequence, bench stations | read (slide and page references in each module); not redistributable |
| Illinois ECE 444 "GT8" and "GT10" web notes (fabweb.ece.illinois.edu) | Deal–Grove coefficients with (100) correction; constant phosphorus diffusivity | read (web); secondary source; primary origin to be traced |
| University of Alberta nanoFAB oxide calculator notes | Thin dry-oxide limit; 0.44 silicon consumption factor | read (web); secondary |
| H. K. D. H. Bhadeshia, "The Scheil equation" (Cambridge, AH10) | Scheil derivation and assumptions | read (web); teaching note, not primary |
| Crystals 2020, 10(2), 121 (doi:10.3390/cryst10020121), Table 2 | Si density and latent heat for the growth module | read per implementation notes; only the constants are used |
| WACKER 2022 annual report, "Purity is our recipe for success" | Siemens-process description (narrative only) | read (web); industry source, narrative only |

## Primary sources to read, by model

Selection rule from `context.md`: the simplest established model that teaches the concept over the
stated range. Later or more complex models are listed only where they bound the validity of the
simple one or supply better parameters.

| Model (module) | Foundational / authoritative source | Why it matters here | Status |
| --- | --- | --- | --- |
| Scheil segregation (01) | E. Scheil, *Z. Metallkd.* 34, 70 (1942) | Original formulation of the complete-mixing, no-solid-diffusion limit used | to locate (German; access uncertain) |
| Effective segregation coefficient (01) | J. A. Burton, R. C. Prim, W. P. Slichter, *J. Chem. Phys.* 21, 1987 (1953) | Bounds the complete-mixing assumption; explains why real k differs from equilibrium k0 | to locate |
| Dopant segregation coefficients in Si (01) | F. A. Trumbore, *Bell Syst. Tech. J.* 39, 205 (1960) | Measured k0 values if the module moves beyond a hypothetical k | to locate |
| Intrinsic density of Si (03, all) | A. B. Sproul, M. A. Green, *J. Appl. Phys.* 70, 846 (1991), doi:10.1063/1.349645 | Measured ni(T), 275–375 K | located |
| | P. P. Altermatt et al., *J. Appl. Phys.* 93, 1598 (2003) | Revised ni ≈ 9.65e9 cm⁻³ at 300 K (value quoted by PV Education; not yet checked in the paper) | located |
| Eg(T) of Si (03) | Y. P. Varshni, *Physica* 34, 149 (1967) | Functional form | to locate |
| | C. D. Thurmond, *J. Electrochem. Soc.* 122, 1133 (1975) | Widely used Si/GaAs Varshni parameters | to locate |
| Mobility vs doping (03, 07) | D. M. Caughey, R. E. Thomas, *Proc. IEEE* 55, 2192 (1967) | Minimal empirical μ(N) form | to locate |
| | N. D. Arora, J. R. Hauser, D. J. Roulston, *IEEE Trans. Electron Devices* 29, 292 (1982) | μ(N, T) parameters for Si | to locate |
| Recombination (04, 07) | W. Shockley, W. T. Read, *Phys. Rev.* 87, 835 (1952); R. N. Hall, *Phys. Rev.* 87, 387 (1952) | SRH lifetime model behind τ | to locate |
| Thermal oxidation (05) | B. E. Deal, A. S. Grove, *J. Appl. Phys.* 36, 3770 (1965) | Linear–parabolic model and original rate constants | located |
| | H. Z. Massoud, J. D. Plummer, E. A. Irene, *J. Electrochem. Soc.* 132, 2685 (1985) | Thin dry-oxide regime where Deal–Grove fails (already flagged in the UI) | to locate |
| Dopant diffusion (05) | Primary source for the constant P diffusivity used (trace from the GT10 notes); R. B. Fair and J. C. C. Tsai, *J. Electrochem. Soc.* 124, 1107 (1977) for concentration dependence | Justify constant-D limit and its range | to locate |
| Ideal diode (07) | W. Shockley, *Bell Syst. Tech. J.* 28, 435 (1949) | Original ideal-diode derivation | located |
| Junction recombination current (07) | C. T. Sah, R. N. Noyce, W. Shockley, *Proc. IRE* 45, 1228 (1957) | Basis for the n ≈ 2 recombination term (currently empirical) | located |
| Long-channel MOSFET (08) | H. C. Pao, C. T. Sah, *Solid-State Electron.* 9, 927 (1966) | Rigorous long-channel model the charge-sheet model approximates | to locate |
| | J. R. Brews, *Solid-State Electron.* 21, 345 (1978) | Charge-sheet model | to locate |
| Si optical absorption (09) | M. A. Green, *Sol. Energy Mater. Sol. Cells* 92, 1305 (2008) | Tabulated α(λ) for Si at 300 K; would replace the illustrative curve | located |
| Detailed balance limit (09) | W. Shockley, H. J. Queisser, *J. Appl. Phys.* 32, 510 (1961) | Upper bound for solar efficiency discussion | to locate |
| Ring oscillator, inverter delay (10) | Course Topic 7 and a standard circuits text | Delay expressions used for comparison | to locate |

"located" entries were confirmed by web search on 2026-11-08 (title, authors, venue, and for
Sproul and Green the DOI). Volume and page numbers of the "to locate" entries are from memory and
must be checked before use.

## Conflicts recorded so far
- **ni(300 K) for Si:** 1.5e10 (Neamen examples), 6.7e9 (self-consistent with Neamen Table B.4),
  about 9.65e9 (Altermatt et al. 2003, via a secondary source). See decision D-005.
- **χ(Si):** 4.01 eV (Neamen) versus 4.05 eV (common elsewhere). Platform uses 4.01 eV (D-003).
- **Eg(GaAs):** 1.42 eV (Table B.4) versus 1.424 eV (Eq. 14.52). Platform uses 1.42 eV (D-003).
