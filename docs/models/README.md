# Model cards

One card per physical submodel. Each card states: the teaching question; the equations as
implemented, with units and sign conventions; dimensionality and operating state; carrier
statistics and material assumptions; boundary and initial conditions and what a sweep holds
fixed; supported range and failure behavior; parameter sources with status (measured, fitted,
assumed, illustrative); the code location; the tests that verify it; and the literature it rests
on, with verification status.

| Card | Status |
| --- | --- |
| [materials.md](materials.md): shared constants and reference parameters | written |
| scheil.md, czochralski-heat-balance.md | pending |
| quantum-well-barrier.md, tight-binding-chain.md | pending |
| equilibrium-statistics.md | pending |
| continuity-finite-volume.md | pending |
| deal-grove.md, dopant-diffusion.md, lithography-etch.md | pending |
| depletion-approximation.md, poisson-boltzmann.md | pending |
| ideal-diode.md, charge-control-switching.md | pending |
| mos-capacitor.md, long-channel-mosfet.md | pending |
| optical-generation.md, solar-cell.md, led-laser-rate.md | pending |
| bench-circuits.md, parameter-extraction.md | pending |

Until a card exists, the module's in-app "assumptions" and "sources" panels and
`../implementation-notes.md` are the reference.
