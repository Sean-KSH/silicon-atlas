# Decision log

Important model, parameter, numerical and architecture choices. Newest last. Status is *accepted*,
*pending* (needs the owner's decision or research) or *superseded*.

### D-001 Version control and private materials (accepted, 2026-11-08)
The project was not under version control. A git repository was initialized with a baseline commit
of the state left by the initial build. `Context/` (textbooks, lecture slides, lab manual, lab
reports), `tmp/` (text extracted from those sources) and all PDFs are ignored so they cannot be
published by accident. Citations point to the sources by title, edition and page instead.

### D-002 One shared material-parameter module (accepted, 2026-11-08)
Six physics kernels each typed their own silicon gap, Nc, Nv, permittivity and mobility. They now
import `src/materials.ts`, which stores Neamen Table B.4 (Si, GaAs) and Table B.6 (SiO2) values
in SI units, with CODATA 2018 constants. Dopant ionization energies stay in `equilibrium.ts`
because they belong to specific dopants (Neamen Tables 4.3, 4.4). A test enforces that every
module derives identical ni, Nc and Nv.

### D-003 Use Table B.4 electron affinity and GaAs gap everywhere (accepted, 2026-11-08)
- MOS used χ(Si) = 4.05 eV (a common value in other texts); Neamen Tables 9.2 and B.4 give
  4.01 eV. Changed to 4.01 eV. Effect: semiconductor work function and flat-band voltage shift by
  0.040 V; nMOS threshold +0.040 V, pMOS |VT| −0.040 V. All tests pass unchanged.
- Photonics used Eg(GaAs) = 1.424 eV from the AlGaAs composition fit (Neamen Eq. 14.52 at x = 0);
  every other module and Table B.4 use 1.42 eV. Changed to 1.42 eV.
Reason: the principal reference is Neamen, and the platform must not disagree with itself.

### D-004 Legacy junction kernel `src/physics.ts` (pending)
This is the original fixed-300 K junction kernel. It uses Neamen's example value
ni = 1.5e10 cm⁻³ and reproduces Neamen Examples 7.1–7.5 within 0.4 %. No interface uses it; the
current junction module uses `src/junction.ts`. Options: keep it explicitly as a "textbook example
reproduction" test, or remove it. Keeping it is harmless if it is documented as such.

### D-005 Which intrinsic carrier density to teach with (pending, owner decision)
- Computed from Neamen's Nc, Nv and Eg = 1.12 eV: 6.7e9 cm⁻³ at 300 K (current behavior).
- Neamen's worked examples and Table B.4: 1.5e10 cm⁻³.
- Device-physics literature: about 9.65e9 cm⁻³ at 300 K (Altermatt et al. 2003, revising Sproul
  and Green 1991; full texts not yet read).
The current choice is internally consistent and the modules already explain the difference from
1.5e10. Calibrating to 9.65e9 would require changing Nc·Nv or Eg away from the book's tables.
Recommendation: keep the self-consistent value, show the literature value alongside it in the
equilibrium module, and let students see why tables disagree.

### D-006 Temperature-dependent gap and doping-dependent mobility (pending, research)
Module 03 spans 40–800 K with a fixed 1.12 eV gap, and modules 03 and 07 use lattice mobility at
any doping. Candidate minimal models: a Varshni-form Eg(T) and a Caughey–Thomas mobility fit, each
with parameters taken from a primary source that has been read. To be decided after the reading
listed in `docs/literature-review.md`. Until then the UI labels these as fixed reference values.

### D-007 Formatting and code splitting (accepted, 2026-11-08)
All sources were reformatted with Prettier (no logic change; tests identical). Modules are loaded
with `React.lazy`, so the first load is about 230 kB plus the module in view instead of 990 kB.
Stylesheets are still loaded eagerly in their original order, so a module's appearance does not
depend on which modules were opened before it; pixel comparisons at 1440 px and 390 px confirmed no
visual change.

### D-008 Module order and URLs (accepted, 2026-11-08)
Navigation follows the ten-module plan in `context.md`, defined once in `src/modules.ts`. URL
hashes are unchanged so existing links still work.

### D-009 Shared app frame and learning guide (accepted, 2026-11-09)
Each module previously carried its own brand header and the only navigation was a strip of ten
links. Now every page shares one app bar (modules menu grouped by course stage, previous/next,
and "On this page" shortcuts that track scrolling), each module opens with goals, reading and
prerequisites and closes with self-check questions, and the default page is a course guide.
Lesson text lives in `src/lessons.ts`, separate from every physics kernel; nothing in it feeds a
calculation. Module content was not restructured: the frame hides each module's duplicated brand
and moves its reset button into the hero. Self-check questions were chosen so they do not repeat
the guided-experiment prompt already inside each module.

### D-010 Typography served with the app (accepted, 2026-11-09)
Modules mixed DM Sans (loaded from Google Fonts but overridden), Inter (never loaded, so the
system font was used) and several monospace stacks. All text now uses IBM Plex Sans and IBM Plex
Mono through two CSS variables, bundled with the app (SIL Open Font License 1.1), so the site makes
no outside requests and looks the same on campus networks and offline.

