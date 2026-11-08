# Project Context: Semiconductor Learning and Simulation Platform

## How to use this file

Read this file before changing the project. It describes the owner's vision, intended audience, and quality expectations for the platform after the initial ten modules have been implemented. Use it alongside the repository, module specifications, and available course references.

This is a direction-setting document, not evidence that any feature, validation, deployment, or classroom evaluation already exists. Inspect the repository to establish the actual state. Preserve working functionality and identify gaps between the implementation and this vision.

## Owner and motivation

The project owner is Sean Kim, a Princeton Electrical and Computer Engineering student with interests in materials, semiconductor fabrication, integrated circuits, sensing, and photonics.

I want to build interactive simulations that make the foundational ideas in introductory solid-state devices and electronic/photonic devices courses easier to understand. My original inspiration was the idea of a scientific simulation tool such as MERLIN: physical laws become a computational model that users can explore. The subject of this project is semiconductors, not origami mechanics.

I want students to connect what happens physically inside a material or device with the equations, graphs, fabrication decisions, and measurements they encounter in class. I want users to ask “what happens if I change this?” and see a physically consistent explanation and result.

## Intended outcome

The long-term deliverable is a cohesive educational platform with ten connected simulation modules, an accessible live demonstration, a public GitHub repository, reproducible validation, and professional technical documentation.

I plan to implement the initial modules using Codex and then use Claude to help refine the experience and presentation. Either assistant may improve implementation, documentation, or design; neither should assume that work produced by the other is correct without inspection.

I want to present the platform to my course professor as a potential resource for class demonstrations, independent exploration, and guided assignments. Classroom adoption is a goal, not an existing endorsement or commitment.

## Audience and teaching philosophy

- Primary audience: undergraduate students taking introductory electronic/photonic devices or solid-state semiconductor devices courses.
- Secondary audience: instructors and teaching assistants who need clear demonstrations and reproducible exercises.
- Support students with introductory physics and calculus while offering deeper explanations for students studying differential equations and semiconductor transport.
- Explain concepts through linked physical diagrams, equations, numerical results, and guided experiments.
- Make relationships visible: fabrication changes material or geometry; those changes affect device behavior; measurements reveal that behavior; device behavior affects circuits.
- Offer progressive detail without overwhelming the default view. A beginner should find the main lesson quickly, and an advanced student should be able to inspect the model.

## Sources and scope

The principal physics reference is Donald A. Neamen, *Semiconductor Physics and Devices: Basic Principles*, Fourth Edition. Additional sources include the supplied ECE 308 lectures and measurement manual.

Reference filenames from the original planning stage include:

- `ECE 445 Neamen(1).pdf`
- `Topic 2 Basic SC considerations+IM.pdf`
- `Topic 2.5 Photoresist lecture.pdf`
- `Topic 3 - Carrier transport - Doping v3.pdf`
- `Topic 4 - Absorption and Nonequilibrium.pdf`
- `Topic 5 - Making Si and MOSFET Process Flow.pdf`
- `Topic 6 - FET and pn intro.pdf`
- `Topic 7 - FET circuits.pdf`
- `Topic 8 - pn junction.pdf`
- `Topic 9 - pn junction diode.pdf`
- `Topic 10 - Optoelectronic devices.pdf`
- `(2025 Fall) ECE 308 Measurements_v6.pdf`

These names identify intended references; they do not establish that the files are available in the current workspace. Use the actual supplied editions and files. Record verified chapter, section, or slide references. Do not invent citations or parameter sources.

Write original explanations and graphics. Do not upload the textbook, course PDFs, or copied figures into the public repository without appropriate permission. Do not present the platform as an official Princeton product or use institutional branding to imply endorsement.

## Research-backed model selection: required for Codex and Claude

Both Codex and Claude must actively search for and read relevant research papers when auditing, implementing, or revising the physics. Do not rely only on generated explanations, memory, search snippets, or the existing code. Use the course sources to establish the instructional scope and the literature to justify equations, simplifications, parameter values, numerical methods, and validation cases.

The objective is the simplest model that accurately teaches the intended concept within a stated operating range. More complicated or more recent models are not automatically better for this platform. Prefer established, interpretable models when they are sufficient, and explain which physical effects a simplification preserves or neglects.

### Required research workflow

1. Identify the teaching question, required outputs, and intended parameter range for each module.
2. Search primary literature for the governing model, its original or authoritative formulation, material parameters, and relevant experimental or numerical benchmarks. Seek useful review papers for orientation, then verify key technical claims against primary sources. Include foundational papers as well as later corrections or extensions when relevant.
3. Read the relevant equations, methods, assumptions, and supporting data in the actual source. Verify the title, authors, publication year, DOI or stable URL, and exact section, equation, figure, or table used. Do not cite a paper as read when only its abstract or a secondary summary was accessible.
4. Compare plausible model choices briefly: accuracy over the intended range, computational cost, interpretability, available parameters, and pedagogical value. Select a defensible baseline rather than adding unnecessary physics.
5. Derive or explain how the selected literature model maps to the implemented equations, units, conventions, parameters, and numerical method. Identify any modifications or assumptions introduced by this project.
6. Reproduce an analytical limit or an independently sourced benchmark before treating the model as verified. Report disagreement and unresolved uncertainty rather than tuning parameters without explanation.

Search beyond one paper when the first source does not establish the model's applicability or parameter values. A citation count is not a quality criterion. If browsing or full-text access is unavailable, record what could not be checked, use accessible authoritative references where possible, and mark the unsupported claim or extension as pending. Never invent a reference or imply that an inaccessible paper supports a specific equation.

### Assumptions and validity: required for every model

Maintain a concise model card for each physical submodel. State applicable assumptions explicitly and explain their consequences, including:

- Geometry and dimensionality: 0D lumped, 1D, 2D, or 3D; uniformity; symmetry; planar or abrupt interfaces; neglected edge effects.
- Operating state: equilibrium, steady state, quasi-static evolution, or transient dynamics; temperature and isothermal assumptions.
- Carrier statistics and material approximations: Boltzmann versus Fermi–Dirac statistics, ionization, effective mass, band structure, homogeneous material, and parameter dependencies.
- Transport and interactions: drift–diffusion, low injection, mobility assumptions, recombination mechanisms, optical absorption/collection, contact behavior, and included or neglected effects.
- Device or process approximations: depletion approximation, long-channel/gradual-channel approximation, constant diffusivity, ideal mixing, negligible solid diffusion, ideal interfaces, or other relevant restrictions.
- Initial conditions, boundary conditions, applied excitation, and what is held fixed during a sweep.
- Valid parameter ranges, failure regimes, and known limitations. Give quantitative bounds when supported; do not invent sharp cutoffs for gradual breakdown of an approximation.
- Sources and uncertainty for material parameters; distinguish measured, fitted, assumed, and illustrative values.

Only list assumptions that apply to the submodel; explain them in plain language. Show a short assumptions summary in the interface and full details in the documentation. When controls leave the supported regime, warn, restrict the range, or switch to a justified alternative model. Do not continue displaying unjustified results as accurate predictions.

### Research deliverables and traceability

Maintain `docs/literature-review.md`, a verified bibliography such as `paper/references.bib`, and model cards under `docs/models/` (or equivalent existing paths). For each major equation or parameter set, link the code implementation, literature source, assumptions, and validation case. Keep third-party articles out of the public repository unless redistribution is permitted; cite stable links instead.

Record conflicting sources, the reason for choosing one formulation or parameter set, and unresolved questions. Distinguish literature-supported facts, project-specific approximations, and conceptual illustrations. Research should improve the scientific basis and clarity of the simulations, not merely decorate the manuscript with citations.

## The ten planned modules

The original module prompts remain the detailed specifications where available. The following summarizes the scope and connections that should survive later refinement.

| Module | Core concepts and intended experience | Connection to the platform |
| --- | --- | --- |
| 1. Silicon purification and crystal growth | Silica to metallurgical silicon, chemical purification, polysilicon, crystal growth, slicing, and polishing. Quantitative impurity segregation using the Scheil approximation with explicit assumptions. Distinguish purity, crystallinity, and intentional doping. | Establishes where device-quality substrates come from. |
| 2. Crystal structure, quantum mechanics, and bands | Diamond-cubic structure, bonding, Miller planes, confinement, wavefunctions, probability density, tunneling, band formation, E(k), effective mass, and holes. Label simplified band models as illustrative. | Explains the material and quantum foundations of device behavior. |
| 3. Equilibrium carriers and doping | Density of states, Fermi–Dirac occupation, intrinsic and extrinsic carriers, charge neutrality, compensation, ionization, freeze-out, temperature dependence, and conductivity. | Supplies consistent carrier and material calculations for later devices. |
| 4. Carrier transport and nonequilibrium | Drift, diffusion, conventional current versus particle motion, mobility, Einstein relation, continuity, generation, recombination, lifetime, and diffusion length. | Connects spatial carrier distributions to current and optical excitation. |
| 5. Fabrication process | Linked top views and cross-sections for oxidation, lithography, development, etching, diffusion, contacts, deposition, and lift-off. Include quantitative oxidation and dopant-profile models where supported. | Relates process history to dimensions, oxide thickness, and doping. |
| 6. PN junction electrostatics | Doping, carriers, depletion charge, electric field, potential, band bending, built-in potential, depletion width, bias dependence, and junction capacitance. Analytical depletion model plus an equilibrium numerical comparison where implemented. | Links material physics to a foundational device. |
| 7. PN diode current and switching | Carrier injection, minority-carrier profiles, ideal I–V, saturation current, temperature, stored charge, recombination, series resistance, and switching approximations. | Connects junction electrostatics and transport to terminal behavior. |
| 8. MOS capacitor and MOSFET | Accumulation, depletion, inversion, work function, oxide capacitance, C–V assumptions, threshold, gate control, channel charge, operating regions, body effect, and long-channel I–V. | Connects fabrication and electrostatics to transistor operation. |
| 9. Photonic devices | Photon energy, absorption, direct/indirect gaps, generation, photodiodes, responsivity, quantum efficiency, solar-cell I–V and power, LEDs, and introductory laser rate equations if implemented. | Connects light–matter interaction to measurable electrical and optical behavior. |
| 10. Virtual characterization | Resistors and sheet resistance, transistor sweeps and parameter extraction, inverter characteristics, transient delay, a five-stage ring oscillator, solar cells, and photodetectors. | Connects physical devices to laboratory measurements and circuits. |

Keep fabrication module 5 faithful to the supplied teaching process, including its simplified metal-gate nMOS flow. Explain differences from modern self-aligned CMOS rather than silently replacing the course process.

## Post-module integration priorities

After the initial ten modules exist, audit and integrate them rather than restarting the project or indiscriminately expanding scope.

1. Inventory what is implemented, conceptual-only, incomplete, or unvalidated.
2. Resolve physics inconsistencies and numerical failures before visual polish.
3. Standardize notation, units, material parameters, navigation, plot styles, and interaction patterns.
4. Connect modules through explicit, versioned parameter/configuration formats where useful.
5. Add coherent learning paths, presets, guided activities, and instructor materials.
6. Prepare a reproducible release, public-facing documentation, and technical manuscript.

Useful cross-module transfers include fabrication-derived oxide thickness and dimensions to a MOS model, doping profiles to a junction model, and device parameters to a virtual measurement bench. Document reductions and assumptions. A compact transistor model must not claim to consume an arbitrary 2D doping distribution without an actual mapping or solver.

## Scientific integrity and model fidelity

This is an educational simulation platform. Use the simplest defensible model that supports the lesson, and clearly identify its range of validity. Do not claim industrial TCAD accuracy, manufacturing prediction, or research-grade fidelity without supporting evidence.

Non-negotiable requirements:

- Separate calculated physics from conceptual animation. Animated carriers are not automatically a microscopic transport simulation.
- Distinguish analytical models, numerical solutions, empirical extensions, and qualitative illustrations.
- Separate equilibrium, steady-state biased behavior, and time-dependent dynamics.
- Make coordinate directions, voltage polarity, energy references, and current conventions explicit.
- Keep electric potential and electron energy consistent; distinguish band diagrams over position from dispersion diagrams over wavevector.
- Use consistent internal units and explicit conversions. Distinguish current from current density and capacitance from capacitance per area.
- Share documented material parameters where appropriate. Do not duplicate incompatible constants across modules.
- Restrict approximations to their supported regimes, including nondegenerate statistics, low injection, depletion theory, and long-channel transistor models.
- An equilibrium Fermi level must not be reused as a complete description of a biased nonequilibrium device.
- Never hide solver failures behind plausible-looking plots. Display convergence status and meaningful diagnostics.
- Do not fabricate absorption spectra, experimental measurements, benchmarks, citations, or classroom feedback.
- State when geometry, time, carrier size, or vertical dimensions are exaggerated for visibility.

## Professional user experience

Aim for a polished scientific teaching tool with a consistent visual language across all modules.

- Use readable typography, accessible contrast, stable layouts, and a restrained, consistent color system.
- Keep diagrams and plots central. Put advanced settings, long derivations, and implementation details in expandable areas or documentation.
- Provide keyboard-accessible controls, text alternatives for color, labeled sliders and numeric inputs, and responsive layouts.
- Synchronize diagrams and plots to a single model state. Show axis labels, units, legends, and useful scales.
- Provide resets, meaningful presets, reproducible configurations, and data exports.
- Explain what changed and why after a user interaction, including which variables are held fixed.
- Include focused guided experiments that ask students to predict, manipulate, observe, and explain.
- Avoid visual polish that makes inaccurate physics look authoritative.

## Engineering and collaboration expectations

- Inspect the existing repository and its instructions before selecting architecture or changing the stack.
- Preserve working modules; refactor incrementally with reviewable changes.
- Separate physics calculations, numerical solvers, parameter data, UI components, and lesson content.
- Favor deterministic, independently callable model functions and serializable configurations.
- Keep the default experience responsive; move expensive computation off the main interface thread when necessary.
- Maintain a decision log for important model, numerical, and architecture choices.
- When handing work between Codex and Claude, summarize changes, evidence, remaining issues, and commands to reproduce the current state.
- Visual refinement may change the interface freely within project scope, but any modification to equations, parameters, solvers, or numerical results must be identified and revalidated.

The earlier suggested stack was React and TypeScript with SVG/Canvas and a plotting library. This is a starting point, not a reason to rewrite a functioning project. Retain a suitable existing stack unless a concrete limitation justifies a change.

## Verification, validation, and release evidence

Maintain a module-by-module validation matrix containing the model, assumptions, comparison method, expected result, observed error, tolerance, and result status.

Use analytical limits, conservation laws, independent reference calculations, and documented benchmarks. Numerical modules need mesh/time-step convergence checks and solver diagnostics. Distinguish implementation verification from agreement with physical measurements. If no experimental validation exists, say so.

Examples of meaningful checks:

- Impurity mass balance and the k = 1 segregation limit.
- Quantum-well energy scaling and wavefunction normalization.
- Charge neutrality and supported equilibrium carrier relations.
- Diffusion spreading, drift displacement, recombination decay, and boundary-flux accounting.
- Dopant-dose conservation for limited-source diffusion.
- Junction integrated charge balance and consistency between charge, field, and potential.
- Diode equilibrium current, area scaling, and ideal semilog slope.
- MOS operating-region continuity and expected geometry scaling.
- Photon-flux units, responsivity, and optical/electrical power accounting.
- Resistor parameter extraction and transient convergence in circuit demonstrations.

Add automated build/test checks and inspect the actual rendered application at representative screen sizes. Record reproducible configurations, not just screenshots. A visually correct screenshot is not a physics-validation result.

## GitHub and reproducibility

The intended public repository should include:

```text
README.md
context.md
LICENSE
CITATION.cff
src/
  physics/
  components/
  lessons/
tests/
docs/
  theory.md
  validation.md
  instructor-guide.md
  limitations.md
  decisions.md
paper/
examples/
```

Adapt paths to the existing project rather than creating duplicate structures. Include installation, development, testing, build, and deployment instructions; dependency locking; a third-party license inventory; and accessible demo screenshots. Keep private PDFs, credentials, and machine-specific paths out of version control.

Choose a suitable software license after checking dependency and asset rights. Use accurate author metadata in citation files. Record releases with tags and tie documentation and benchmark results to an exact code version. A DOI or archival deposit is optional future work, not an existing identifier.

## Technical manuscript

Prepare a journal-style software paper or technical report, with IEEE-style formatting as a suitable default. The manuscript should be readable on its own and reproducible from the repository. Do not force a publication venue or imply acceptance.

Suggested working title: “An Interactive, Physics-Validated Platform for Teaching Semiconductor Materials and Devices.” Reconsider “physics-validated” if the release evidence supports only analytical verification.

Suggested structure:

1. Abstract: actual scope, methods, and measured results.
2. Introduction: instructional motivation and intended use.
3. Educational objectives and module organization.
4. Physical models, assumptions, and governing equations.
5. Numerical methods and software architecture.
6. Verification and validation, including error metrics and convergence.
7. Representative teaching activities and demonstrations.
8. Limitations and future work.
9. Reproducibility, software availability, and references.

Generate manuscript figures from reproducible simulation outputs. Include selected complete derivations where they help the reader assess the implementation; move long supporting details to appendices or technical documentation.

“Peer-reviewed-style” describes the desired rigor and presentation. Do not describe the project or paper as peer reviewed unless actual peer review occurs. Do not invent novelty, learning gains, user studies, comparisons with competing tools, or professor endorsements. Separate demonstrated physical/numerical correctness from intended educational value.

## Professor-facing package

Prepare a compact package an instructor can evaluate quickly:

- A working live demo with no unnecessary account setup.
- A one-page overview of objectives, covered topics, prerequisites, and limitations.
- A reproducible 10–15 minute classroom demonstration.
- Guided assignments with instructor explanations and expected observations.
- A concise validation summary and links to the technical documentation.
- A tagged source release and the manuscript/report.

If feasible, invite professor feedback on accuracy, course alignment, and usability before proposing broad classroom use. Any future evaluation involving students should follow applicable institutional requirements. Until evaluated, describe learning benefits as goals rather than proven outcomes.

## Definition of success

A successful release lets a student explore a semiconductor concept, observe a physically consistent response, connect it to the governing equations, and explain the result. An instructor can independently assess its assumptions, reproduce its results, and use a prepared activity. A developer can run the project, understand the models, and safely extend it.

Prioritize correctness, teaching clarity, cohesion, and reproducibility over feature count. The goal is a platform I can confidently show my professor and maintain publicly, not merely ten attractive demonstrations.

## First action for the next assistant

Read this context and inspect the repository. Produce a concise audit of the ten modules and shared infrastructure, identifying implemented behavior, validation evidence, inconsistencies, and missing deliverables. Then work through the highest-impact corrections and integration tasks. Do not assume all ten modules are finished simply because this file is being supplied after the initial build phase.
