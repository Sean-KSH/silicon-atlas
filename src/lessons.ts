/**
 * Learning-guide content shown around each module: goals, reading, prerequisites, section
 * shortcuts, a short classroom demonstration and self-check questions.
 *
 * This file is lesson text only. It does not feed any calculation. Numbers quoted in answers
 * follow the platform's own parameters (src/materials.ts) unless an answer says otherwise.
 */

export interface SectionTarget {
  /** Label shown in the "On this page" bar. */
  label: string;
  /** Jump to the first h2 whose text starts with this string. */
  heading?: string;
  /** Jump to the first <summary> whose text starts with this string (its <details> is opened). */
  summary?: string;
  /** Jump to the first element matching this selector. */
  selector?: string;
}

export interface CheckQuestion {
  question: string;
  answer: string;
}

export interface Lesson {
  id: string;
  minutes: number;
  reading: string;
  buildsOn: string[];
  goals: string[];
  sections: SectionTarget[];
  demo: string;
  check: CheckQuestion[];
}

export const LESSONS: Record<string, Lesson> = {
  wafer: {
    id: 'wafer',
    minutes: 20,
    reading: 'Neamen §§1.6–1.7',
    buildsOn: [],
    goals: [
      'Follow silicon from quartz to a polished single-crystal wafer, and tell apart purity, crystal structure and intentional doping.',
      'Use the Scheil equation to predict how an impurity redistributes along an ingot as it grows.',
      'See how melt temperature and pull speed set the diameter of the growing crystal in a simple heat balance.',
    ],
    sections: [
      { label: 'Process stages', selector: '.process-nav' },
      { label: 'Crystal growth', heading: 'Temperature. Pull speed' },
      { label: 'Impurity segregation', heading: 'Impurity segregation' },
      { label: 'Purity and doping', heading: 'Pure silicon can still' },
      { label: 'Equations and sources', summary: 'Equations, assumptions' },
    ],
    demo: 'Step through the six process stages. In the segregation plot, compare k = 0.1, 1 and 2 and ask which end of the ingot gives the purest wafers. Finish with the hotter-melt and faster-pull growth presets.',
    check: [
      {
        question:
          'An impurity has segregation coefficient k = 0.1. Where along the ingot is it most concentrated, and why?',
        answer:
          'At the last-frozen (tail) end. With k < 1 the growing solid rejects impurity into the melt, so the melt becomes richer as growth continues. The Scheil result Cs = k·C0·(1 − f)^(k − 1) rises steeply as the fraction solidified f approaches 1.',
      },
      {
        question:
          'Electronic-grade polysilicon is already extremely pure. Why is it not ready to become device wafers?',
        answer:
          'It is polycrystalline. Devices need a single crystal with a known orientation, because grain boundaries scatter carriers and trap charge. Czochralski growth supplies the crystal order, and the dopant is added to the melt on purpose.',
      },
    ],
  },
  atomic: {
    id: 'atomic',
    minutes: 30,
    reading: 'Neamen Chapters 1–3',
    buildsOn: [],
    goals: [
      'Recognize the diamond-cubic lattice, its four nearest neighbors and common Miller planes.',
      'Explain why confinement gives discrete energies that scale as n²/(mL²), and why a particle can tunnel through a barrier.',
      'Connect coupling between atoms to a band of allowed energies, band curvature to effective mass, and a negative band-top mass to the idea of a hole.',
    ],
    sections: [
      { label: 'Crystal structure', heading: 'Order in three dimensions' },
      { label: 'Wells and barriers', heading: 'Boundaries select the states' },
      { label: 'From states to a band', heading: 'Many states. One band' },
      { label: 'Guided experiments', heading: 'Predict. Adjust. Explain' },
      { label: 'Equations and sources', summary: 'Equations, symbols' },
    ],
    demo: 'Rotate the unit cell and highlight the (111) plane. In the infinite well, double the width and show that the ground-state energy falls to a quarter. Then widen the barrier and watch transmission fall by orders of magnitude.',
    check: [
      {
        question:
          'Why does transmission through a barrier fall off so quickly as the barrier gets wider?',
        answer:
          'Inside a barrier taller than the particle’s energy, the wavefunction decays as exp(−κx) with κ = √(2m(U0 − E))/ħ. For a thick barrier the transmission is roughly proportional to exp(−2κa), so each extra bit of width multiplies it by the same small factor.',
      },
      {
        question:
          'Why does an electron near the top of a band respond to a field as if its mass were negative?',
        answer:
          'The band curves downward there, so d²E/dk² < 0 and m* = ħ²/(d²E/dk²) is negative. Describing the empty state as a positive hole with positive mass gives the same response and is easier to reason about.',
      },
    ],
  },
  equilibrium: {
    id: 'equilibrium',
    minutes: 25,
    reading: 'Neamen Chapter 4',
    buildsOn: ['atomic'],
    goals: [
      'Build electron and hole populations from the density of states multiplied by the Fermi–Dirac occupation.',
      'Use charge neutrality to find the Fermi level and the carrier concentrations in doped and compensated silicon.',
      'Explain freeze-out, the extrinsic plateau and intrinsic behavior as temperature changes.',
    ],
    sections: [
      { label: 'States and occupation', heading: 'States, occupation' },
      { label: 'Charge balance', heading: 'Charge is balanced' },
      { label: 'Temperature regimes', heading: 'Freeze-out' },
      { label: 'Guided experiments', heading: 'Predict before changing' },
      { label: 'Equations and sources', summary: 'Equations, numerical method' },
    ],
    demo: 'Start from the intrinsic 300 K preset, then load the extrinsic preset and show EF moving toward the conduction band. Finish with the freeze-out (40 K) and intrinsic-dominated (800 K) presets to trace the three temperature regimes.',
    check: [
      {
        question: 'What does it tell you when the Fermi level sits above the intrinsic level Ei?',
        answer:
          'Electrons are the majority carrier. In the Boltzmann limit n = ni·exp((EF − Ei)/kT) is larger than ni and p = ni·exp((Ei − EF)/kT) is smaller, so the sample is n-type. Each kT·ln 10 (about 60 meV at 300 K) above Ei is another factor of ten in n.',
      },
      {
        question: 'Why does a doped sample behave as intrinsic at high enough temperature?',
        answer:
          'ni rises roughly as exp(−Eg/2kT). Once it exceeds the net doping, thermally generated electron–hole pairs outnumber the carriers from dopants and EF moves toward midgap.',
      },
    ],
  },
  transport: {
    id: 'transport',
    minutes: 25,
    reading: 'Neamen Chapters 5–6',
    buildsOn: ['equilibrium'],
    goals: [
      'Separate drift (driven by the field) from diffusion (driven by a gradient), and particle flux direction from conventional current direction.',
      'Relate mobility and diffusion coefficient through the Einstein relation.',
      'Use the continuity equation to see how lifetime and generation set excess-carrier decay and the diffusion length.',
    ],
    sections: [
      { label: 'Concentrations', heading: 'Spatial concentrations' },
      { label: 'Flux and current', heading: 'Flux, field, and conventional' },
      { label: 'Carrier ledger', heading: 'Where did the carriers go' },
      { label: 'Guided experiments', heading: 'Predict → simulate' },
      { label: 'Equations and solver', summary: 'Equations, solver' },
    ],
    demo: 'Play the drift mode, then switch the carrier from electrons to holes and compare the direction of motion with the direction of current. Use pulse decay to show the exponential loss set by the lifetime, and check the carrier ledger.',
    check: [
      {
        question:
          'A packet of excess carriers spreads by diffusion alone. How does its width grow with time?',
        answer:
          'Its standard deviation grows as √(2Dt). Four times as long gives twice the width, so diffusion is fast over short distances and slow over long ones.',
      },
      {
        question:
          'If the minority-carrier lifetime is quadrupled, what happens to the diffusion length?',
        answer: 'It doubles, because L = √(Dτ).',
      },
    ],
  },
  fabrication: {
    id: 'fabrication',
    minutes: 30,
    reading: 'Course process-flow notes',
    buildsOn: ['wafer'],
    goals: [
      'Walk through a four-mask metal-gate nMOS process and read each step in top view and cross-section.',
      'Predict oxide thickness with the Deal–Grove model and phosphorus profiles with diffusion, including why doubling time does not double thickness.',
      'Diagnose how mask misalignment, underexposure or unopened contacts break a device.',
    ],
    sections: [
      { label: 'Process steps', heading: 'Process recipe' },
      { label: 'Top view and section', heading: 'Wafer top view' },
      { label: 'Geometry checks', heading: 'Geometry checks' },
      { label: 'Process window', heading: 'Predict the process window' },
      { label: 'Guided experiments', heading: 'Predict → fabricate' },
      { label: 'Equations and sources', summary: 'Equations, parameter provenance' },
    ],
    demo: 'Run the tested demo once at four seconds per step. Then load the contact-misalignment fault and ask the class which terminal fails and why, using the cross-section.',
    check: [
      {
        question:
          'During a drive-in from a fixed phosphorus dose, what happens to the surface concentration as the profile deepens?',
        answer:
          'The dose Q is conserved, so the Gaussian profile spreads and its peak falls: C(0, t) = Q/√(πDt) decreases as 1/√t while the junction moves deeper.',
      },
      {
        question: 'How does this course flow differ from a modern self-aligned CMOS process?',
        answer:
          'Here the gate metal is patterned after the source and drain are diffused, so the gate-to-diffusion overlap depends on mask alignment. In a self-aligned process the gate itself masks the source/drain implant, so the edges line up automatically.',
      },
    ],
  },
  junction: {
    id: 'junction',
    minutes: 25,
    reading: 'Neamen Chapter 7',
    buildsOn: ['equilibrium'],
    goals: [
      'Trace doping into space charge, electric field, potential and band bending across an abrupt junction.',
      'Calculate built-in potential, depletion width and junction capacitance, and see how they change with doping and reverse bias.',
      'Compare the depletion approximation with a numerical Poisson–Boltzmann solution and see where the approximation holds.',
    ],
    sections: [
      { label: 'Depletion geometry', heading: 'Abrupt depletion geometry' },
      { label: 'Aligned profiles', heading: 'Aligned spatial profiles' },
      { label: 'Guided experiments', heading: 'Three guided experiments' },
      { label: 'Equations and sources', summary: 'Equations, boundary' },
    ],
    demo: 'Start symmetric, then load the p⁺–n preset and ask which side the depletion region extends into. Apply reverse bias and show the width growing as the square root of the total barrier while the capacitance falls.',
    check: [
      {
        question: 'Why is the electric field strongest at the metallurgical junction?',
        answer:
          'The field is the running integral of charge. Starting from the p-side depletion edge, negative acceptor charge builds up the field until the junction; beyond it, positive donor charge brings it back to zero at the n-side edge. The peak is |E| = q·NA·xp/εs = q·ND·xn/εs.',
      },
      {
        question:
          'How do the depletion width and the junction capacitance change with reverse bias VR?',
        answer:
          'W grows as √(Vbi + VR), so the capacitance per area C′ = εs/W falls as 1/√(Vbi + VR).',
      },
    ],
  },
  diode: {
    id: 'diode',
    minutes: 25,
    reading: 'Neamen Chapter 8',
    buildsOn: ['junction', 'transport'],
    goals: [
      'Connect forward bias to minority-carrier injection and the exponential current I = Is[exp(V/VT) − 1].',
      'See why a diode has no fixed turn-on voltage: current scales with area, and the ideal semilog slope is about 60 mV per decade at 300 K.',
      'Relate stored minority charge to lifetime and to the delay when the diode is switched off.',
    ],
    sections: [
      { label: 'Operating point', heading: 'Calculated operating point' },
      { label: 'I–V curves', heading: 'Terminal I–V' },
      { label: 'Injection profiles', heading: 'Injection in the quasi-neutral' },
      { label: 'Bands', heading: 'Bands and quasi-Fermi' },
      { label: 'Switching', heading: 'Turn-on & reverse-storage' },
      { label: 'Guided experiments', heading: 'Predict, then compare' },
      { label: 'Equations and sources', summary: 'Equations, assumptions' },
    ],
    demo: 'Show the linear and semilog I–V side by side, then double the area: the semilog curve shifts by a constant, the slope does not change. Play the switching demonstration and point at the stored-charge plot during the storage delay.',
    check: [
      {
        question:
          'At 300 K, how much must the forward voltage increase to raise an ideal diode’s current tenfold?',
        answer:
          'About 60 mV. With I ≈ Is·exp(V/VT), a factor of ten needs ΔV = VT·ln 10 = 0.02585 V × 2.303 ≈ 59.5 mV. This is the slope you see on the semilog plot.',
      },
      {
        question:
          'Why does a diode keep conducting for a short time after being switched from forward to reverse bias?',
        answer:
          'Excess minority charge is stored in the neutral regions. It must be removed by reverse current and recombination before the junction can support a reverse voltage.',
      },
    ],
  },
  mos: {
    id: 'mos',
    minutes: 30,
    reading: 'Neamen Chapters 10–11',
    buildsOn: ['junction', 'fabrication'],
    goals: [
      'Identify accumulation, depletion and inversion from gate voltage, surface potential and charge.',
      'Relate oxide thickness, doping and work function to flat-band voltage, threshold voltage and the C–V curve.',
      'Use the long-channel model to explain the linear and saturation regions, pinch-off and the body effect.',
    ],
    sections: [
      { label: 'Gate stack', heading: 'The gate balances' },
      { label: 'Gate sweep and C–V', heading: 'Gate sweep' },
      { label: 'Band bending', heading: 'Calculated semiconductor band bending' },
      { label: 'From the process', heading: 'Bring the process' },
      { label: 'Guided experiments', heading: 'Predict, then test' },
      { label: 'Equations and sources', summary: 'Equations, symbols' },
    ],
    demo: 'Click through accumulation, flat band, depletion and inversion and watch the charge stack and band bending. Import the nominal fabrication result, then switch to Part B and sweep VDS through pinch-off.',
    check: [
      {
        question:
          'Why does the high-frequency C–V curve stay low in inversion while the quasi-static curve rises back toward Cox?',
        answer:
          'At high frequency the inversion-layer electrons cannot be generated and removed fast enough to follow the small signal, so the response comes from the depletion edge and C stays near Cox in series with the maximum depletion capacitance. In the quasi-static measurement the inversion charge follows the gate, and C returns toward Cox.',
      },
      {
        question: 'What does pinch-off mean in the long-channel model?',
        answer:
          'When VDS reaches VGS − VT, the inversion charge at the drain end falls to zero. Extra drain voltage drops across the short pinched-off region near the drain, so the current stays nearly constant (saturation).',
      },
    ],
  },
  photonics: {
    id: 'photonics',
    minutes: 30,
    reading: 'Neamen Chapter 14',
    buildsOn: ['diode', 'transport'],
    goals: [
      'Relate photon energy to wavelength and band gap, and use Beer–Lambert absorption to find where carriers are generated.',
      'Compute photodiode responsivity and quantum efficiency, and follow where the incident optical power goes.',
      'Read a solar-cell I–V curve for short-circuit current, open-circuit voltage, maximum power and fill factor, then reverse the process in an LED.',
    ],
    sections: [
      { label: 'Photon budget', heading: 'Where does the photon go' },
      { label: 'Absorption edge', heading: 'Photon energy and absorption' },
      { label: 'Generation profile', heading: 'Beer–Lambert generation' },
      { label: 'Guided experiments', heading: 'Predict, change, explain' },
      { label: 'Equations and sources', summary: 'Equations, symbols' },
    ],
    demo: 'Sweep the wavelength across the silicon absorption edge and watch the photon budget. Switch to the solar-cell tab and locate the maximum-power point on the I–V curve, then compare Si with GaAs.',
    check: [
      {
        question: 'Why does silicon absorb 650 nm light but not 1300 nm light?',
        answer:
          'Photon energy is E = hc/λ: about 1.91 eV at 650 nm and 0.95 eV at 1300 nm. Only the first exceeds silicon’s 1.12 eV band gap.',
      },
      {
        question:
          'At the same quantum efficiency, why is responsivity (A/W) higher at longer wavelength?',
        answer:
          'Responsivity is R = η·qλ/(hc). Each absorbed photon yields at most one electron, and at longer wavelength one watt of light contains more photons.',
      },
    ],
  },
  bench: {
    id: 'bench',
    minutes: 35,
    reading: 'Lab measurements manual; Neamen Chapter 11',
    buildsOn: ['mos', 'fabrication'],
    goals: [
      'Separate sheet resistance from contact resistance using resistors of several lengths.',
      'Extract threshold voltage and mobility from MOSFET sweeps, and see how the method and sweep spacing affect the result.',
      'Measure inverter transfer curves, propagation delay and a five-stage ring oscillator, including how the oscilloscope probe loads the circuit.',
    ],
    sections: [
      { label: 'Bench controls', heading: 'Bench controls' },
      { label: 'Guided question', heading: 'Predict before acquiring' },
      { label: 'Models and methods', summary: 'Models, extraction' },
      { label: 'Sources', summary: 'Course sources' },
    ],
    demo: 'In the resistor station, acquire the length sweep and read sheet and contact resistance from the slope and intercept. Then open the five-stage ring and compare the frequency with the probe buffered and connected directly.',
    check: [
      {
        question:
          'Why does connecting an oscilloscope probe directly to a ring-oscillator node lower the frequency you measure?',
        answer:
          'The probe adds capacitance to that node, so the stage driving it takes longer to charge and discharge. Its delay grows, and with it the ring period. A buffer stage between the ring and the probe isolates the ring from that load.',
      },
      {
        question: 'How does a five-stage ring oscillator’s frequency relate to the stage delay?',
        answer:
          'A signal must pass around the ring twice for one full period, so f = 1/(2·N·tpd) = 1/(10·tpd) for N = 5.',
      },
    ],
  },
};

export interface CoursePath {
  title: string;
  audience: string;
  modules: string[];
}

export const COURSE_PATHS: CoursePath[] = [
  {
    title: 'Solid-state device physics',
    audience:
      'Follows the order of a semiconductor physics text: quantum foundations, carriers, junctions, then transistors and light.',
    modules: ['atomic', 'equilibrium', 'transport', 'junction', 'diode', 'mos', 'photonics'],
  },
  {
    title: 'Electronic and photonic devices',
    audience:
      'Starts from how devices are made, builds the device physics needed to understand them, and ends at the measurement bench.',
    modules: [
      'wafer',
      'fabrication',
      'equilibrium',
      'junction',
      'diode',
      'mos',
      'photonics',
      'bench',
    ],
  },
];
