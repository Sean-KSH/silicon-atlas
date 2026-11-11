import React, { useState } from 'react';
import { useLinkedState } from './urlState';
import ProcessFigure from './ProcessFigure';
import GrowthLab from './GrowthLab';
import { downloadFigure, segregationFigure } from './exportFigure';
import './product.css';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  Legend,
} from 'recharts';
import { average, balance, profile } from './segregation';
const steps = [
  {
    name: 'Silica',
    tag: 'Starting material',
    change: 'Chemical identity',
    description:
      'Silica (SiO₂) contains silicon bound to oxygen. It is not elemental silicon and cannot serve directly as a device wafer.',
    detail:
      'Conceptual cross-section of silica feedstock. The symbols identify composition, not atomic positions or measured impurity levels.',
  },
  {
    name: 'Metallurgical silicon',
    tag: 'Reduction',
    change: 'Chemical identity · purity',
    description:
      'Carbothermic reduction removes oxygen from silica to produce elemental silicon. The course describes metallurgical-grade material as about 98–99% pure: substantial residual contamination remains.',
    detail:
      'Overall idealized reaction: SiO₂ + 2C → Si + 2CO. Furnace chemistry is more complex; no yield, thermal, or reaction-rate model is calculated.',
  },
  {
    name: 'Chemical purification',
    tag: 'Conversion + distillation',
    change: 'Chemical purity',
    description:
      'The course route converts metallurgical silicon to volatile chlorosilanes, including trichlorosilane. Distillation separates chemical species before silicon is deposited again.',
    detail:
      'Process illustration only. No purification factor is inferred from vessel size, temperature, or the segregation coefficient. This chemical route is distinct from directional solidification and zone refining.',
  },
  {
    name: 'Electronic-grade polysilicon',
    tag: 'Deposition',
    change: 'Purity · crystal structure',
    description:
      'Purified precursor is converted back to high-purity solid silicon, for example by deposition in a Siemens process. The deposited material is polycrystalline: many grains, rather than one continuous crystal.',
    detail:
      'High chemical purity does not imply single crystallinity. No grade certification, deposition rate, or impurity concentration is assigned by this illustration.',
  },
  {
    name: 'Single-crystal growth',
    tag: 'Czochralski',
    change: 'Crystal structure · impurity distribution',
    description:
      'A seed establishes crystal orientation as a crystal is pulled from molten silicon. Residual impurities partition between solid and liquid; the Scheil model below isolates that redistribution.',
    detail:
      'Seed, crystal, melt, and crucible are shown schematically. This drawing does not calculate growth. The separate thermal lab below models body dimensions under chosen heat-budget assumptions; rotation, defects, and oxygen incorporation remain outside scope. Scheil parameters are independent, not a calibrated CZ recipe.',
  },
  {
    name: 'Slicing + polishing',
    tag: 'Wafer preparation',
    change: 'Geometry · surface finish',
    description:
      'The ingot is shaped and sliced into wafers, then lapped, etched, and polished. These operations establish thickness, flatness, and surface quality; they do not establish bulk electronic-grade purity.',
    detail:
      'Conceptual cross-section: the prepared wafer inherits its bulk crystal orientation and impurity distribution from the ingot. Slice thickness and surface roughness are not calculated.',
  },
];
export default function Wafer() {
  const [growthReset, setGrowthReset] = useState(0),
    [stage, setStage] = useLinkedState('stage', 4),
    [c, setC] = useLinkedState('conc', 100),
    [k, setK] = useLinkedState('k', 0.1),
    [a, setA] = useLinkedState('from', 0),
    [b, setB] = useLinkedState('to', 0.8),
    [compare, setCompare] = useLinkedState('compare', true),
    [log, setLog] = useLinkedState('log', true);
  const c0 = c * 1e-9,
    avg = average(c0, k, a, b) * 1e9,
    m = balance(c0, k, b),
    data = profile(c0, k),
    st = steps[stage];
  const values = data.flatMap((p) => (compare ? [p.cs, p.low, p.unity, p.high] : [p.cs]));
  const yMin = Math.min(...values),
    yMax = Math.max(...values);
  const reset = () => {
    setGrowthReset((n) => n + 1);
    setStage(4);
    setC(100);
    setK(0.1);
    setA(0);
    setB(0.8);
    setCompare(true);
    setLog(true);
  };
  return (
    <div className="wafer-product">
      <header>
        <a className="brand" href="#wafer">
          <span className="brandmark">Si</span>
          <span>
            Silicon Atlas<span className="brand-sub">Materials & device physics</span>
          </span>
        </a>
        <span className="course">Silicon processing / 01</span>
        <button onClick={reset} title="Restore this module's tested default settings">
          Reset module
        </button>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">Materials laboratory / 01</div>
            <h1>From silica to silicon wafer</h1>
            <p>Trace the manufacturing pathway. Examine the material. Quantify what remains.</p>
          </div>
          <a className="pill growth-jump" href="#growth-lab">
            Open growth simulation ↓
          </a>
        </div>
        <nav className="process-nav" aria-label="Manufacturing stages">
          {steps.map((s, i) => (
            <button
              key={s.name}
              className={stage === i ? 'selected' : ''}
              aria-current={stage === i ? 'step' : undefined}
              onClick={() => setStage(i)}
            >
              <span className="process-number">{String(i + 1).padStart(2, '0')}</span>
              <small>{s.tag}</small>
              <strong>{s.name}</strong>
              <span className="process-arrow">{i < 5 ? '→' : '•'}</span>
            </button>
          ))}
        </nav>
        <section className="panel process-panel">
          <div className="stage-description">
            <div className="eyebrow">STAGE {stage + 1} OF 6 / PROCESS ILLUSTRATION</div>
            <h2>{st.name}</h2>
            <p>{st.description}</p>
            <div className="change-tag">Changes: {st.change}</div>
            <details className="stage-detail">
              <summary>Illustration scope & assumptions</summary>
              <p className="note">{st.detail}</p>
            </details>
            <div className="actions">
              <button disabled={stage === 0} onClick={() => setStage(stage - 1)}>
                ← Previous
              </button>
              <button disabled={stage === 5} onClick={() => setStage(stage + 1)}>
                Next stage →
              </button>
            </div>
          </div>
          <ProcessFigure stage={stage} />
        </section>
        <GrowthLab key={growthReset} />
        <div className="analysis-title">
          <div>
            <span className="eyebrow">Quantitative investigation</span>
            <h2>Impurity segregation</h2>
          </div>
          <p>A selected portion of the crystal. An exact mass balance.</p>
        </div>
        <div className="modelbar">
          <span>
            <i /> Scheil approximation
          </span>
          <span>
            Liquid <b>fully mixed</b>
          </span>
          <span>
            Solid diffusion <b>negligible</b>
          </span>
          <span>
            k <b>constant</b>
          </span>
        </div>
        <div className="workspace">
          <aside className="panel controls">
            <div className="eyebrow">Crystal-growth model</div>
            <h2>Segregation parameters</h2>
            <p className="note">
              Independent of the illustrative process above. Generic dilute impurity; no
              named-species k is assumed.
            </p>
            <label>
              Initial concentration C₀<strong>{c.toFixed(0)} ppb by mass</strong>
              <input
                aria-label="Initial concentration"
                type="range"
                min="1"
                max="1000"
                step="1"
                value={c}
                onChange={(e) => setC(+e.target.value)}
              />
              <span className="range">
                <span>1 ppb</span>
                <span>1000 ppb</span>
              </span>
            </label>
            <label>
              Segregation coefficient k = Cₛ / Cₗ<strong>{k.toFixed(2)}</strong>
              <input
                aria-label="Segregation coefficient"
                type="range"
                min=".01"
                max="2"
                step=".01"
                value={k}
                onChange={(e) => setK(+e.target.value)}
              />
              <span className="range">
                <span>0.01</span>
                <span>2.00 · dimensionless</span>
              </span>
            </label>
            <div className="actions">
              {[0.1, 1, 2].map((n) => (
                <button key={n} className={k === n ? 'selected' : ''} onClick={() => setK(n)}>
                  k = {n}
                </button>
              ))}
            </div>
            <label>
              Retained segment start a<strong>{(a * 100).toFixed(1)}%</strong>
              <input
                aria-label="Retained segment start"
                type="range"
                min="0"
                max={b - 0.01}
                step=".001"
                value={a}
                onChange={(e) => setA(+e.target.value)}
              />
            </label>
            <label>
              Retained segment end b<strong>{(b * 100).toFixed(1)}%</strong>
              <input
                aria-label="Retained segment end"
                type="range"
                min={a + 0.01}
                max=".999"
                step=".001"
                value={b}
                onChange={(e) => setB(+e.target.value)}
              />
            </label>
            <p className="note">
              Minimum segment width: 1%. Domain ends at f = 0.999; f = 1 is never evaluated.
              “Retained” denotes selected ingot mass, not finished wafer yield.
            </p>
          </aside>
          <section className="panel stage">
            <div className="sectiontop">
              <div>
                <div className="eyebrow">Figure 08 / Scheil approximation</div>
                <h2>Solid composition profile</h2>
              </div>
              <div className="figure-actions">
                <button
                  className="export-figure"
                  onClick={() => downloadFigure(segregationFigure(c0, k, a, b, log, compare))}
                >
                  Export figure ↗
                </button>
                <button
                  onClick={() => {
                    const text =
                      `# C0_mass_fraction=${c0},k=${k},a=${a},b=${b},average_mass_fraction=${avg * 1e-9}\nf,Cs_mass_fraction\n` +
                      data.map((p) => `${p.f},${p.cs * 1e-9}`).join('\n');
                    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'scheil-profile.csv';
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  ↓ CSV
                </button>
              </div>
            </div>
            <div className="metrics">
              <div>
                <span>Retained mass fraction · b − a</span>
                <strong>
                  {((b - a) * 100).toFixed(1)} <small>%</small>
                </strong>
              </div>
              <div>
                <span>Average Cₛ over [a, b]</span>
                <strong>
                  {avg.toPrecision(4)} <small>ppb</small>
                </strong>
              </div>
              <div>
                <span>Average / initial concentration</span>
                <strong>
                  {(avg / c).toFixed(3)} <small>×</small>
                </strong>
              </div>
            </div>
            <div className="retained-strip" aria-label={`Retained interval ${a} to ${b}`}>
              <div className="strip-label">
                <span>Retained ingot segment</span>
                <span>
                  {(a * 100).toFixed(1)}–{(b * 100).toFixed(1)}% of initial melt mass
                </span>
              </div>
              <div className="strip-track">
                <div style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }} />
              </div>
              <div className="strip-label">
                <span>First solid · f = 0</span>
                <span>Last evaluated · f = 0.999</span>
              </div>
            </div>
            <div className="actions plot-options">
              <button aria-pressed={compare} onClick={() => setCompare(!compare)}>
                {compare ? 'Hide' : 'Show'} k comparison
              </button>
              <button aria-pressed={log} onClick={() => setLog(!log)}>
                {log ? 'Logarithmic' : 'Linear'} concentration axis
              </button>
            </div>
            <p className="plotlabel">
              Solid impurity concentration Cₛ (ppb by mass)
              <span>Shaded region = retained segment</span>
            </p>
            <div className="chart wafer-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 12, right: 20, bottom: 26, left: 20 }}>
                  <CartesianGrid stroke="var(--c-28384c)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="f"
                    type="number"
                    domain={[0, 0.999]}
                    tick={{ fill: 'var(--c-a7b9ce)', fontSize: 12 }}
                    ticks={[0, 0.25, 0.5, 0.75, 0.999]}
                    tickFormatter={(x) => (Number(x) === 0.999 ? '0.999' : Number(x).toFixed(2))}
                    label={{
                      value: 'Solidified mass fraction f (dimensionless)',
                      position: 'bottom',
                      offset: 8,
                    }}
                  />
                  <YAxis
                    scale={log ? 'log' : 'linear'}
                    domain={log ? [yMin * 0.8, yMax * 1.25] : [0, yMax * 1.1]}
                    allowDataOverflow={false}
                    tick={{ fill: 'var(--c-a7b9ce)', fontSize: 12 }}
                    tickFormatter={(x) => Number(x).toPrecision(2)}
                    width={65}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--c-162437)', border: '1px solid #496077' }}
                    labelFormatter={(x) => `f = ${Number(x).toFixed(4)}`}
                    formatter={(x, name) => [`${Number(x).toPrecision(4)} ppb`, name]}
                  />
                  <ReferenceArea x1={a} x2={b} fill="var(--c-96bfe6)" fillOpacity={0.1} />
                  <Line
                    dataKey="cs"
                    name={`Selected k = ${k.toFixed(2)}`}
                    stroke="var(--c-74c8bd)"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {compare && (
                    <>
                      <Line
                        dataKey="low"
                        name="k = 0.1"
                        stroke="var(--c-edb785)"
                        strokeDasharray="5 3"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        dataKey="unity"
                        name="k = 1"
                        stroke="var(--c-b5c8e2)"
                        strokeDasharray="5 3"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        dataKey="high"
                        name="k = 2"
                        stroke="var(--c-b4a2ef)"
                        strokeDasharray="5 3"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </>
                  )}
                  <Legend verticalAlign="top" height={34} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="explanation" aria-live="polite">
              <h3>What changed and why?</h3>
              <p>
                {k < 1
                  ? 'k < 1: the growing solid rejects impurity into the liquid. Later solid becomes more contaminated; retaining the early portion can reduce its average concentration.'
                  : k === 1
                    ? 'k = 1: solid and liquid have the same concentration. No segregation occurs and every retained segment averages C₀.'
                    : 'k > 1: impurity preferentially enters the solid. Early solid is enriched, while later solid becomes cleaner. Removing only the tail is not a purification strategy for this case.'}{' '}
                Changing C₀ scales every concentration linearly. Your selected segment averages{' '}
                {(avg / c).toFixed(3)} times C₀.
              </p>
            </div>
            <p className="note">
              At b = {b.toFixed(3)}: {((100 * m.frozen) / c0).toFixed(3)}% of the initial impurity
              is in all solid formed from 0 to b, and {((100 * m.remaining) / c0).toFixed(3)}%
              remains in liquid. Relative mass-balance residual: {m.residual.toExponential(2)}. This
              accounts for all solid, including any excluded head.
            </p>
          </section>
        </div>
        <section className="panel experiments">
          <div className="eyebrow">Purity & electrical properties</div>
          <h2>Pure silicon can still be intentionally doped</h2>
          <p>
            High purity removes uncontrolled contaminants; controlled doping adds a known species
            and dose. Donors such as phosphorus and acceptors such as boron control carrier
            populations. Unwanted impurities may compensate intended dopants, introduce
            recombination centers, and change carrier lifetime. Chemical purity and electrical
            performance are therefore related, but are not interchangeable measurements.
          </p>
          <p className="note">
            This generic mass-fraction model cannot predict carrier density or resistivity. That
            requires impurity identity, atomic-mass conversion, electrical activation, compensation,
            temperature, and mobility. A chosen k is not automatically a value for boron or
            phosphorus. Intentional dopants can also segregate during growth.
          </p>
        </section>
        <div className="referencegrid">
          <details className="panel">
            <summary>Equations, assumptions & validity</summary>
            <div className="formula">
              k = Cₛ / Cₗ
              <br />
              Cₗ(f) = C₀(1 − f)^(k − 1)
              <br />
              Cₛ(f) = k C₀(1 − f)^(k − 1)
              <br />
              I[a,b] = C₀[(1 − a)^k − (1 − b)^k]
              <br />
              C̄ₛ[a,b] = I[a,b] / (b − a)
              <br />
              I[0,f] + (1 − f)Cₗ(f) = C₀
            </div>
            <p>
              C₀: initial impurity mass fraction; Cₛ: composition of newly formed solid; Cₗ:
              well-mixed liquid composition; k: constant dimensionless segregation coefficient; f:
              initial melt mass fraction solidified; a and b: selected retained-segment boundaries;
              I: impurity mass divided by initial melt mass; C̄ₛ: mass-weighted retained average.
              Internally all concentrations are dimensionless mass fractions; 1 ppb by mass = 10⁻⁹.
            </p>
            <p>
              Assume complete liquid mixing, negligible solid diffusion, constant k, interfacial
              partitioning, a closed initial melt, and a dilute impurity. No evaporation,
              replenishment, crucible contamination, or additional phases. This is a limiting
              approximation, not a quantitative prediction of a commercial CZ process or a
              moving-zone refining model.
            </p>
            <p>
              Domain: 1–1000 ppb initial concentration, 0.01 ≤ k ≤ 2, 0 ≤ f ≤ 0.999. For k &lt; 1,
              the idealized expression diverges as f → 1 and eventually violates dilute-solution
              assumptions. The endpoint is rejected, not clamped. Averages use an exact integral,
              not averages of plotted samples.
            </p>
          </details>
          <details className="panel">
            <summary>Sources & model distinctions</summary>
            <p>
              <b>Course Topic 5 — Making Si and MOSFET Process Flow:</b> PDF pp. 3–4, metallurgical
              silicon and chlorosilane purification; pp. 5–6, CZ growth and ingot; p. 8, starting
              wafer. The slide’s precursor-purity statement is not treated as a measured impurity
              concentration in the final wafer.
            </p>
            <p>
              <b>Neamen, Semiconductor Physics and Devices, 4th edition:</b> §1.6, printed pp. 15–17
              (PDF pp. 40–42), impurities and doping; §1.7.1, printed pp. 17–19 (PDF pp. 42–44),
              seed growth, segregation coefficient, separate zone-refining discussion, slicing and
              polishing. The book’s qualitative zone-refining discussion is not substituted for
              chemical purification.
            </p>
            <p>
              <a
                href="https://www.phase-trans.msm.cam.ac.uk/abstracts/AH.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Cambridge, H. K. D. H. Bhadeshia — The Scheil Equation, AH10
              </a>
              : closed-melt solute balance and Scheil relation. The relation is an additional
              quantitative teaching model; the course process slides do not specify a calibrated k.
            </p>
            <p>
              <a
                href="https://reports.wacker.com/2022/annual-report/sustainable-solutions/purity-is-our-recipe-for-success.html"
                target="_blank"
                rel="noreferrer"
              >
                WACKER — Purity Is Our Recipe for Success
              </a>
              : chlorosilane distillation and Siemens deposition of polysilicon.
            </p>
            <p>
              Electronic-grade polysilicon deposition is shown as a conventional precursor-to-solid
              step. All process cross-sections are conceptual and not to scale. No visual particle
              count, pulling motion, or rotation is evidence of calculated crystal quality.
            </p>
          </details>
        </div>
        <footer>
          Device lab / Materials
          <span>Process illustrations · Analytical segregation · Explicit assumptions</span>
        </footer>
      </main>
    </div>
  );
}
