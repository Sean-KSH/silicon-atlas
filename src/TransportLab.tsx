import React, { useEffect, useMemo, useState } from 'react';
import { useLinkedState } from './urlState';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { KB, Q } from './equilibrium';
import {
  TransportConfig,
  simulateTransport,
  transportRows,
  transportCsv,
  barLength,
  majorityDensity,
  packetPeak,
  packetSigma,
  ni300,
} from './transport';
import './transport.css';
const fmt = (x: number) =>
  x === 0
    ? '0'
    : Math.abs(x) < 0.001 || Math.abs(x) >= 1e5
      ? x.toExponential(2)
      : Number(x.toPrecision(4)).toString();
const modes = [
  { id: 'drift', name: 'Drift', sub: 'Field-driven translation' },
  { id: 'diffusion', name: 'Diffusion', sub: 'Packet spreading' },
  { id: 'combined', name: 'Drift + diffusion', sub: 'Transport and loss' },
  { id: 'decay', name: 'Pulse decay', sub: 'Uniform excess after light' },
  { id: 'steady', name: 'Steady generation', sub: 'Generation versus loss' },
];
function Range({
  name,
  value,
  min,
  max,
  step,
  set,
  unit,
  disabled = false,
}: {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  set: (x: number) => void;
  unit: string;
  disabled?: boolean;
}) {
  return (
    <label className={`tr-range ${disabled ? 'tr-disabled' : ''}`}>
      <span>
        {name}
        <b>
          {fmt(value)} {unit}
        </b>
      </span>
      <input
        aria-label={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => set(+e.target.value)}
      />
      <small>
        {min} → {max} {unit}
      </small>
    </label>
  );
}
const experiments = [
  {
    name: 'Signs and drift',
    prompt:
      'For a positive field, which direction do minority electrons move? Which direction is their conventional current?',
    answer:
      'Electrons drift opposite the electric field, because their charge is negative. Multiplying their particle flux by −q reverses the sign: the electron drift current points along the field. Holes and their conventional current move in the same direction.',
  },
  {
    name: 'Diffusion and boundaries',
    prompt:
      'With no field or recombination, does the packet lose carriers as it spreads? What changes at absorbing ends?',
    answer:
      'Before boundaries matter, variance increases as σ₀² + 2Dt while the total excess population is conserved. Reflecting ends conserve that population; absorbing contacts remove excess carriers. The outward face flux appears explicitly in the balance, so spreading is not mistaken for recombination.',
  },
  {
    name: 'Lifetime and generation',
    prompt:
      'After one lifetime, what fraction remains after a uniform light pulse? Under sustained generation, what balances G?',
    answer:
      'For uniform decay without boundary loss, u(t) = u₀ exp(−t/τ): about 36.8% remains after one lifetime. With uniform generation and reflecting ends, u tends to Gτ and recombination u/τ tends to G. Absorbing ends add a transport loss and can lower the steady population.',
  },
];
export default function TransportLab() {
  const [mode, setMode] = useLinkedState('mode', 'combined'),
    [species, setSpecies] = useLinkedState<'electron' | 'hole'>('species', 'electron'),
    [mobility, setMobility] = useLinkedState('mobility', 500),
    [D, setD] = useLinkedState('D', 12.9),
    [einstein, setEinstein] = useLinkedState('einstein', true),
    [field, setField] = useLinkedState('field', 5),
    [tau, setTau] = useLinkedState('tau', 0.5),
    [logG, setLogG] = useLinkedState('logG', 19),
    [boundary, setBoundary] = useLinkedState<TransportConfig['boundary']>('boundary', 'absorbing'),
    [center, setCenter] = useLinkedState('center', 200),
    [cells, setCells] = useLinkedState('cells', 200),
    [position, setPosition] = useState(0),
    [running, setRunning] = useState(false),
    [rate, setRate] = useState(0.25),
    [deep, setDeep] = useState(false),
    [densityTab, setDensityTab] = useState('excess'),
    [flowTab, setFlowTab] = useState('current'),
    [exp, setExp] = useState(0),
    [prediction, setPrediction] = useState(''),
    [reveal, setReveal] = useState(false);
  const diffusionOn = ['diffusion', 'combined', 'steady'].includes(mode),
    fieldOn = ['drift', 'combined'].includes(mode),
    lossOn = ['combined', 'decay', 'steady'].includes(mode);
  const c: TransportConfig = useMemo(
    () => ({
      species,
      mobility: mobility * 1e-4,
      diffusion: diffusionOn ? (einstein ? (mobility * 1e-4 * KB * 300) / Q : D * 1e-4) : 0,
      field: fieldOn ? field * 100 : 0,
      lifetime: lossOn ? tau * 1e-6 : Infinity,
      generation: mode === 'steady' ? 10 ** logG * 1e6 : 0,
      boundary,
      initial: mode === 'decay' ? 'uniform' : mode === 'steady' ? 'empty' : 'packet',
      center: center * 1e-6,
      cells,
      duration: 2e-6,
      frames: 120,
    }),
    [species, mobility, D, einstein, field, tau, logG, boundary, center, cells, mode],
  );
  const simulation = useMemo(() => {
    try {
      return { value: simulateTransport(c), error: '' };
    } catch (e) {
      return { value: null, error: String(e) };
    }
  }, [c]);
  useEffect(() => {
    setPosition(0);
    setRunning(false);
  }, [c]);
  useEffect(() => {
    if (!running) return;
    let raf = 0,
      last: number | undefined;
    const tick = (now: number) => {
      if (last !== undefined) {
        const elapsed = (now - last) / 1000;
        setPosition((p) => Math.min(120, p + ((elapsed * rate) / 2) * 120));
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const hidden = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [running, rate]);
  useEffect(() => {
    if (position >= 120) setRunning(false);
  }, [position]);
  const chooseMode = (m: string) => {
    setMode(m);
    setPosition(0);
    setRunning(false);
    if (m === 'decay' || m === 'steady') setBoundary('reflecting');
  };
  const reset = () => {
    chooseMode('combined');
    setSpecies('electron');
    setMobility(500);
    setD(12.9);
    setEinstein(true);
    setField(5);
    setTau(0.5);
    setLogG(19);
    setBoundary('absorbing');
    setCenter(200);
    setCells(200);
    setDeep(false);
    setDensityTab('excess');
    setFlowTab('current');
    setPrediction('');
    setReveal(false);
    setExp(0);
    setRate(0.25);
  };
  const sim = simulation.value,
    f = sim?.frames[Math.floor(position)],
    rows = f
      ? transportRows(f, c).map((r) => ({
          x: r.x * 1e6,
          n: r.n / 1e6,
          p: r.p / 1e6,
          u: r.u / 1e6,
          field: r.field / 100,
          gn: r.gn / 1e4,
          gp: r.gp / 1e4,
          jn: r.jn / 1e4,
          jp: r.jp / 1e4,
          jtotal: r.jtotal / 1e4,
          jexcess: r.jexcess / 1e4,
        }))
      : [],
    maximum = f ? Math.max(...f.u) : 0,
    refDensity = Math.max(
      packetPeak,
      c.generation * (Number.isFinite(c.lifetime) ? c.lifetime : 0),
      ...(sim?.frames.map((frame) => Math.max(...frame.u)) ?? []),
    ),
    diffusionLength = lossOn ? Math.sqrt(c.diffusion * c.lifetime) : null;
  const chart = (kind: 'density' | 'flow') => {
    const density = kind === 'density',
      keys = density
        ? densityTab === 'excess'
          ? [['u', 'Excess minority u', 'var(--c-8edac6)']]
          : [
              ['n', 'n · electrons', 'var(--c-8edac6)'],
              ['p', 'p · holes', 'var(--c-efbb87)'],
            ]
        : flowTab === 'flux'
          ? [
              ['gn', 'Γn · electron flux', 'var(--c-8edac6)'],
              ['gp', 'Γp · hole flux', 'var(--c-efbb87)'],
            ]
          : flowTab === 'field'
            ? [['field', 'Prescribed E', 'var(--c-b8a2dd)']]
            : flowTab === 'excess'
              ? [['jexcess', 'Excess minority current', 'var(--c-8edac6)']]
              : [
                  ['jn', 'Jn', 'var(--c-8edac6)'],
                  ['jp', 'Jp', 'var(--c-efbb87)'],
                  ['jtotal', 'Jn + Jp', 'var(--c-b8a2dd)'],
                ],
      unit = density
        ? 'cm⁻³'
        : flowTab === 'flux'
          ? 'cm⁻² s⁻¹'
          : flowTab === 'field'
            ? 'V/cm'
            : 'A/cm²';
    return (
      <>
        <div className="tr-plot-title">
          {density
            ? 'Concentration'
            : flowTab === 'flux'
              ? 'Particle flux'
              : flowTab === 'field'
                ? 'Electric field'
                : 'Conventional current density'}{' '}
          ({unit}) · {density && densityTab === 'total' ? 'log scale' : 'linear scale'}
        </div>
        <div className="tr-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
              <CartesianGrid stroke="var(--c-2c424e)" strokeDasharray="3 5" />
              <XAxis
                dataKey="x"
                type="number"
                domain={[0, 400]}
                tick={{ fill: 'var(--c-a5bdc8)', fontSize: 12 }}
                label={{
                  value: 'Position x (µm)',
                  position: 'bottom',
                  offset: 5,
                  fill: 'var(--c-a5bdc8)',
                }}
              />
              <YAxis
                width={78}
                scale={density && densityTab === 'total' ? 'log' : 'linear'}
                domain={
                  density
                    ? densityTab === 'total'
                      ? ['auto', 'auto']
                      : [0, refDensity / 1e6]
                    : ['auto', 'auto']
                }
                tickFormatter={fmt}
                tick={{ fill: 'var(--c-a5bdc8)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--c-152631)',
                  border: '1px solid #4c6876',
                  fontSize: 13,
                }}
                formatter={(v, name) => [`${fmt(Number(v))} ${unit}`, name]}
                labelFormatter={(v) => `${Number(v).toFixed(1)} µm`}
              />
              {keys.map(([key, name, color]) => (
                <Line
                  key={key}
                  dataKey={key}
                  name={name}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="tr-key">
          {keys.map(([key, name, color]) => (
            <span key={key} style={{ color }}>
              {name}
            </span>
          ))}
        </div>
      </>
    );
  };
  return (
    <div className="transport-lab">
      <header>
        <a className="brand" href="#transport">
          <span className="brandmark">Si</span>
          <span>
            Silicon Atlas<span className="brand-sub">Transport & lifetime</span>
          </span>
        </a>
        <button onClick={reset} title="Restore this module's tested default settings">
          Reset module
        </button>
      </header>
      <main>
        <div className="tr-hero">
          <span className="eyebrow">Neamen / Chapters 5—6</span>
          <h1>
            Carrier transport
            <br />
            and lifetime.
          </h1>
          <p>Follow an excess-carrier packet. Account for every source, sink, and boundary.</p>
          <div className="tr-actions">
            <button className={!deep ? 'selected' : ''} onClick={() => setDeep(false)}>
              Beginner
            </button>
            <button className={deep ? 'selected' : ''} onClick={() => setDeep(true)}>
              Deeper physics
            </button>
            <button
              disabled={!f}
              onClick={() => {
                if (!f) return;
                const url = URL.createObjectURL(
                    new Blob([transportCsv(f, c)], { type: 'text/csv' }),
                  ),
                  a = document.createElement('a');
                a.href = url;
                a.download = 'transport-snapshot-SI.csv';
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              ↓ Snapshot CSV
            </button>
          </div>
        </div>
        <nav className="tr-modes">
          {modes.map((m) => (
            <button
              className={mode === m.id ? 'selected' : ''}
              key={m.id}
              onClick={() => chooseMode(m.id)}
            >
              <b>{m.name}</b>
              <span>{m.sub}</span>
            </button>
          ))}
        </nav>
        <div className="tr-scope">
          <b>Low-injection minority-carrier model</b>
          <p>
            One mobile excess population u(x,t), a prescribed uniform field, and a fixed majority
            background. The majority perturbation and internal electric field are not solved. This
            is neither two independent charged packets nor a self-consistent ambipolar or Poisson
            solution.
          </p>
        </div>
        <div className="tr-workspace">
          <aside className="tr-card">
            <h2>Transport controls</h2>
            <label className="tr-select">
              Minority carrier
              <select
                aria-label="Minority carrier"
                value={species}
                onChange={(e) => setSpecies(e.target.value as typeof species)}
              >
                <option value="electron">Electrons in p-type Si</option>
                <option value="hole">Holes in n-type Si</option>
              </select>
            </label>
            <Range
              name="Minority mobility"
              value={mobility}
              set={setMobility}
              min={100}
              max={1500}
              step={10}
              unit="cm²/(V·s)"
            />
            <label className="tr-check">
              <input
                type="checkbox"
                checked={einstein}
                onChange={(e) => setEinstein(e.target.checked)}
              />
              Use Einstein relation · 300 K
            </label>
            <Range
              name="Independent diffusion coefficient"
              value={D}
              set={setD}
              min={0}
              max={50}
              step={0.1}
              unit="cm²/s"
              disabled={einstein || !diffusionOn}
            />
            <div className="tr-readout">
              Active D <b>{fmt(c.diffusion * 1e4)} cm²/s</b>
            </div>
            {!einstein && (
              <p className="tr-note">
                Independent D is a pedagogical override; it need not satisfy nondegenerate thermal
                equilibrium.
              </p>
            )}
            <Range
              name="Prescribed electric field"
              value={field}
              set={setField}
              min={-20}
              max={20}
              step={0.5}
              unit="V/cm"
              disabled={!fieldOn}
            />
            <Range
              name="Minority lifetime"
              value={tau}
              set={setTau}
              min={0.05}
              max={2}
              step={0.05}
              unit="µs"
              disabled={!lossOn}
            />
            <Range
              name="log₁₀(G / [cm⁻³ s⁻¹])"
              value={logG}
              set={setLogG}
              min={17}
              max={20}
              step={0.1}
              unit=""
              disabled={mode !== 'steady'}
            />
            {mode === 'steady' && <p>G = {fmt(c.generation / 1e6)} cm⁻³ s⁻¹, uniform.</p>}
            <label className="tr-select">
              Excess-carrier boundaries
              <select
                aria-label="Excess carrier boundaries"
                value={boundary}
                onChange={(e) => setBoundary(e.target.value as typeof boundary)}
              >
                <option value="absorbing">Absorbing · u = 0 at contacts</option>
                <option value="reflecting">Reflecting · zero excess flux</option>
                <option value="periodic">Periodic · wrap to opposite end</option>
              </select>
            </label>
            <Range
              name="Initial packet center"
              value={center}
              set={setCenter}
              min={40}
              max={360}
              step={5}
              unit="µm"
              disabled={c.initial !== 'packet'}
            />
            <label className="tr-select">
              Spatial resolution
              <select
                aria-label="Spatial resolution"
                value={cells}
                onChange={(e) => setCells(+e.target.value)}
              >
                <option value={100}>100 cells · coarse</option>
                <option value={200}>200 cells · standard</option>
                <option value={400}>400 cells · fine</option>
              </select>
            </label>
            <p className="tr-note">
              Parameter changes reset the run. The selected mode disables inactive terms: field{' '}
              {fieldOn ? 'on' : 'off'}, diffusion {diffusionOn ? 'on' : 'off'}, lifetime loss{' '}
              {lossOn ? 'on' : 'off'}, generation {mode === 'steady' ? 'on' : 'off'}.
            </p>
          </aside>
          <div className="tr-main">
            {!sim || !f ? (
              <section className="tr-card" role="alert">
                <h2>Simulation unavailable</h2>
                <p>{simulation.error}</p>
                <button onClick={reset}>Restore defaults</button>
              </section>
            ) : (
              <>
                <section className="tr-card">
                  <div className="tr-heading">
                    <div>
                      <span className="eyebrow">Calculated density / 1D bar</span>
                      <h2>
                        {modes.find((m) => m.id === mode)?.name} at {(f.time * 1e6).toFixed(3)} µs
                      </h2>
                    </div>
                    <span className="tr-badge">
                      {running ? 'Playing' : position >= 120 ? 'Run complete' : 'Paused'}
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 820 235"
                    role="img"
                    aria-label={`400 micrometer bar at ${f.time * 1e6} microseconds; minority ${species} density mapped to brightness`}
                  >
                    <text x="55" y="24">
                      {species === 'electron'
                        ? 'p-type · holes prescribed'
                        : 'n-type · electrons prescribed'}
                    </text>
                    <text x="760" y="24" textAnchor="end">
                      {boundary} excess boundaries
                    </text>
                    <rect
                      x="54"
                      y="63"
                      width="712"
                      height="72"
                      fill="var(--c-0c1923)"
                      stroke="var(--c-658497)"
                    />
                    {Array.from(f.u, (u, i) => (
                      <rect
                        key={i}
                        x={55 + (i * 710) / cells}
                        y="64"
                        width={710 / cells + 0.15}
                        height="70"
                        fill="var(--c-8ee0c6)"
                        opacity={u / refDensity}
                      />
                    ))}
                    <path
                      d="M55 148H765M55 143V153M410 143V153M765 143V153"
                      stroke="var(--c-8aa5b4)"
                    />
                    <text x="55" y="172">
                      0
                    </text>
                    <text x="410" y="172" textAnchor="middle">
                      200
                    </text>
                    <text x="765" y="172" textAnchor="end">
                      400 µm · x →
                    </text>
                    <text x="55" y="204">
                      Prescribed E: {fmt(c.field / 100)} V/cm{' '}
                      {c.field > 0 ? '→' : c.field < 0 ? '←' : '· zero'}
                    </text>
                    <text x="430" y="204">
                      Minority drift: {fmt(sim.velocity)} m/s{' '}
                      {sim.velocity > 0 ? '→' : sim.velocity < 0 ? '←' : '· zero'}
                    </text>
                  </svg>
                  <p className="tr-note">
                    Brightness is computed excess density on a fixed 0–{fmt(refDensity / 1e6)} cm⁻³
                    scale, not a count of particle icons. Playback shows {rate} µs of simulated
                    evolution per real second. It slows microscopic time; it does not simulate
                    individual scattering paths.
                  </p>
                  <div className="tr-actions">
                    <button
                      className="selected"
                      onClick={() => {
                        if (position >= 120) setPosition(0);
                        setRunning((r) => !r);
                      }}
                    >
                      {running ? 'Pause' : 'Play simulation'}
                    </button>
                    <button
                      onClick={() => {
                        setRunning(false);
                        setPosition((p) => Math.min(120, p + 1));
                      }}
                    >
                      Step snapshot
                    </button>
                    <button
                      onClick={() => {
                        setRunning(false);
                        setPosition(0);
                      }}
                    >
                      Rewind
                    </button>
                    <label className="tr-speed">
                      Playback
                      <select
                        aria-label="Transport playback speed"
                        value={rate}
                        onChange={(e) => setRate(+e.target.value)}
                      >
                        <option value={0.1}>0.1 µs/s</option>
                        <option value={0.25}>0.25 µs/s</option>
                        <option value={0.5}>0.5 µs/s</option>
                      </select>
                    </label>
                  </div>
                  <label className="tr-time">
                    Simulation time · 0–2 µs
                    <input
                      aria-label="Transport simulation time"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      value={Math.floor(position)}
                      onChange={(e) => {
                        setRunning(false);
                        setPosition(+e.target.value);
                      }}
                    />
                  </label>
                  <div className="tr-metrics">
                    <div>
                      <span>Diffusion length √(Dτ)</span>
                      <strong>
                        {diffusionLength === null
                          ? 'Loss disabled'
                          : `${fmt(diffusionLength * 1e6)} µm`}
                      </strong>
                    </div>
                    <div>
                      <span>Peak excess / majority</span>
                      <strong>{((100 * maximum) / majorityDensity).toFixed(3)}%</strong>
                    </div>
                    <div>
                      <span>Integrated excess ∫u dx</span>
                      <strong>{fmt(f.number / 1e4)} cm⁻²</strong>
                    </div>
                  </div>
                  {maximum / majorityDensity > 0.01 && (
                    <p className="tr-warning">
                      Low-injection caution: excess density exceeds 1% of the prescribed majority
                      background. The fixed-background approximation becomes less accurate as this
                      ratio increases.
                    </p>
                  )}
                </section>
                <section className="tr-card">
                  <div className="tr-heading">
                    <h2>Spatial concentrations</h2>
                    <div className="tr-actions">
                      <button
                        className={densityTab === 'excess' ? 'selected' : ''}
                        onClick={() => setDensityTab('excess')}
                      >
                        Excess minority
                      </button>
                      <button
                        className={densityTab === 'total' ? 'selected' : ''}
                        onClick={() => setDensityTab('total')}
                      >
                        n(x,t) and p(x,t)
                      </button>
                    </div>
                  </div>
                  {chart('density')}
                  <p className="tr-note">
                    Majority = 10¹⁶ cm⁻³, fixed. Equilibrium minority ={' '}
                    {fmt(ni300 ** 2 / majorityDensity / 1e6)} cm⁻³, from the previous equilibrium
                    module’s consistent 300 K Si parameters. Only the minority excess evolves. For
                    an optical pulse, the small majority excess is neglected in this reduced
                    low-injection approximation.
                  </p>
                </section>
                <section className="tr-card">
                  <h2>Flux, field, and conventional current</h2>
                  <div className="tr-actions">
                    {[
                      ['current', 'Jn, Jp and total'],
                      ['excess', 'Excess current'],
                      ['flux', 'Particle fluxes'],
                      ['field', 'Electric field'],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        className={flowTab === id ? 'selected' : ''}
                        onClick={() => setFlowTab(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {chart('flow')}
                  <div className="tr-explain">
                    <h3>Motion is not conventional current.</h3>
                    <p>
                      Γn = −μn nE − Dn ∂n/∂x, and Jn = −qΓn. Electrons moving toward −x carry
                      positive conventional current toward +x. For holes, Γp = +μp pE − Dp ∂p/∂x and
                      Jp = +qΓp. Diffusion follows a density gradient, so it can reinforce or oppose
                      drift.
                    </p>
                  </div>
                  <p className="tr-note">
                    Total shown = Jn + Jp, the local conduction-current sum in this
                    prescribed-background model. Majority current is a uniform reference drift
                    contribution using μp = 480 or μn = 1350 cm²/(V·s). It often dominates; select
                    “Excess current” to resolve the packet. No displacement current,
                    external-circuit response, majority continuity or self-consistent field is
                    calculated. Plotted currents average conservative face fluxes to cell centers.
                  </p>
                </section>
                <section className="tr-card">
                  <div className="tr-heading">
                    <div>
                      <span className="eyebrow">Conservative numerical accounting</span>
                      <h2>Where did the carriers go?</h2>
                    </div>
                    <span className="tr-badge">Per unit cross-sectional area</span>
                  </div>
                  <div className="tr-ledger">
                    {[
                      ['Initial', sim.initialNumber],
                      ['+ Generated', f.generated],
                      ['− Recombined', f.recombined],
                      ['− Left outward transfer', f.leftOut],
                      ['− Right outward transfer', f.rightOut],
                      ['= Present', f.number],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <span>{label}</span>
                        <b>{fmt(Number(value) / 1e4)} cm⁻²</b>
                      </div>
                    ))}
                  </div>
                  <p>
                    Balance residual: {fmt(f.balance / 1e4)} cm⁻² · relative{' '}
                    {Math.abs(f.balance) / Math.max(sim.initialNumber + f.generated, 1) > 0
                      ? (
                          Math.abs(f.balance) / Math.max(sim.initialNumber + f.generated, 1)
                        ).toExponential(2)
                      : '0'}
                    .
                  </p>
                  <p className="tr-note">
                    Outward transfers are signed: negative means net entry. For periodic boundaries,
                    left and right transfers cancel. Boundary conditions constrain excess flux only;
                    the uniform equilibrium background is maintained by the prescribed reservoirs.
                    No arbitrary cross-sectional area is assumed.
                  </p>
                  <div className="tr-explain">
                    <h3>What changed and why?</h3>
                    <p>
                      {mode === 'drift'
                        ? 'The field translates the packet with signed drift velocity v = ±μE. Physical diffusion and recombination are disabled; finite-volume upwinding still adds numerical broadening.'
                        : mode === 'diffusion'
                          ? 'With E = 0, the packet spreads down its gradients. Away from boundaries, variance grows as σ₀² + 2Dt, while peak density falls without losing total carriers.'
                          : mode === 'combined'
                            ? 'Drift moves the packet, diffusion spreads it, and the lifetime term removes excess carriers. Contact losses are counted separately from recombination.'
                            : mode === 'decay'
                              ? 'After the light pulse ends, the initially uniform excess decays. Reflecting or periodic ends give u = u₀ exp(−t/τ); absorbing boundaries can also remove carriers.'
                              : 'Uniform generation supplies carriers at rate G. With no boundary loss, the long-time density is Gτ; absorbing contacts introduce additional transport loss.'}{' '}
                      {boundary === 'absorbing'
                        ? 'The contacts hold excess density at zero.'
                        : boundary === 'reflecting'
                          ? 'No excess carriers cross the ends.'
                          : 'Excess leaving one end re-enters the other; this is a mathematical ring, not an isolated bar.'}
                    </p>
                  </div>
                  {deep && (
                    <p className="tr-note">
                      Δx = {fmt(sim.dx * 1e6)} µm; maximum step {fmt(sim.dtMax * 1e9)} ns; {f.steps}{' '}
                      internal steps completed. Snapshot spacing is 16.67 ns and is not the solver
                      step. First-order upwind advection adds grid-dependent spreading (spatial
                      contribution roughly |v|Δx/2). Compare 100, 200 and 400 cells before
                      interpreting packet width. Explicit time integration is also first order.
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
        <section className="tr-card tr-experiments">
          <span className="eyebrow">Guided experiments</span>
          <h2>Predict → simulate → account.</h2>
          <div className="tr-actions">
            {experiments.map((e, i) => (
              <button
                className={exp === i ? 'selected' : ''}
                key={i}
                onClick={() => {
                  setExp(i);
                  setPrediction('');
                  setReveal(false);
                }}
              >
                {i + 1}. {e.name}
              </button>
            ))}
          </div>
          <h3>{experiments[exp].prompt}</h3>
          <textarea
            aria-label="Transport prediction"
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder="Predict motion, spreading or the population balance…"
          />
          <div className="tr-actions">
            <button
              onClick={() => {
                chooseMode(exp === 0 ? 'drift' : exp === 1 ? 'diffusion' : 'decay');
                setSpecies('electron');
                setField(5);
                setBoundary('reflecting');
                setCenter(200);
                setTau(0.5);
              }}
            >
              Apply starting conditions
            </button>
            <button onClick={() => setReveal((v) => !v)}>
              {reveal ? 'Hide' : 'Reveal'} explanation
            </button>
          </div>
          {reveal && <p>{experiments[exp].answer}</p>}
        </section>
        <details className="tr-card tr-reference" open={deep}>
          <summary>Equations, solver, boundaries & validity</summary>
          <div className="tr-formula">
            ∂u/∂t = −∂Γu/∂x + G − u/τ
            <br />
            Γu = vu − D ∂u/∂x; v = −μE (electrons), +μE (holes)
            <br />D = μkBT/q (optional Einstein relation); LD = √(Dτ)
            <br />n = n₀+u, p ≈ p₀ for minority electrons; p = p₀+u, n ≈ n₀ for minority holes
            <br />
            Jn = −qΓn; Jp = +qΓp; Jcond = Jn+Jp
          </div>
          <p>
            u: excess minority density (m⁻³); x: position (m); t: time (s); Γu: excess particle flux
            (m⁻² s⁻¹); μ: positive mobility (m²/(V·s)); E: prescribed electric field (V/m); D:
            diffusion coefficient (m²/s); G: uniform excess generation (m⁻³ s⁻¹); τ: effective
            excess lifetime (s); LD: diffusion length (m); n₀, p₀: maintained equilibrium densities.
            q = 1.602176634×10⁻¹⁹ C, kB = 1.380649×10⁻²³ J/K, T = 300 K. Positive flux and current
            point toward +x. Electric potential would satisfy E = −dφ/dx; electron potential energy
            is −qφ. Neither energy nor potential is plotted as a particle path.
          </p>
          <h3>Finite-volume solver</h3>
          <div className="tr-formula">
            Γi+½ = v uupwind − D(ui+1−ui)/Δx
            <br />
            ui(new) = ui + Δt [(Γi−½−Γi+½)/Δx + G − ui/τ]
            <br />
            Δt ≤ min[2 ns, 0.01τ, 0.45/(|v|/Δx + 3D/Δx² + 1/τ)]
          </div>
          <p>
            Uniform cell-centered grid; first-order upwind drift, centered diffusive face flux,
            explicit forward Euler. This bound keeps the update monotone/positive, including the
            half-cell absorbing boundary distances. Infinite τ disables recombination. Steps are
            shortened to hit snapshot times exactly. A negative or nonfinite solution, excessive
            step count, or final relative balance error &gt;10⁻⁸ produces an error; no
            negative-density clipping is applied.
          </p>
          <p>
            <b>Boundary details:</b> absorbing ends prescribe excess u = 0 at x = 0 and L; diffusion
            uses half-cell distance and advection uses zero excess on inflow. Reflecting ends
            prescribe total excess face flux Γu = 0, including drift and diffusion. Periodic ends
            share the same face flux. G, recombination and signed boundary transfer use the same
            old-time values and time steps as the update, so their cumulative balance is
            algebraically consistent.
          </p>
          <div className="tr-formula">
            Nsheet(t) = ∫₀ᴸ u dx = Nsheet(0) + ∫GL dt − ∫∫u/τ dx dt − ∫[Γu(L)−Γu(0)]dt
            <br />
            Infinite-domain Gaussian: center = x₀+vt; variance = σ₀²+2Dt
            <br />
            G=0, uniform, no boundary loss: u=u₀exp(−t/τ)
            <br />
            Uniform generation, no boundary loss: u=Gτ[1−exp(−t/τ)] from u(0)=0
          </div>
          <p>
            Bar L = 400 µm; Gaussian σ₀ = 20 µm and peak = 10¹³ cm⁻³; uniform pulse uses the same
            initial density. Majority background = 10¹⁶ cm⁻³. Mobility control 100–1500 cm²/(V·s),
            independent D 0–50 cm²/s, field ±20 V/cm, lifetime 0.05–2 µs, generation 10¹⁷–10²⁰ cm⁻³
            s⁻¹. Background ni is calculated from Neamen’s 300 K Si Nc, Nv and Eg, consistent with
            the equilibrium explorer. A 1% excess/majority threshold flags increasing low-injection
            error.
          </p>
          <p>
            <b>Limits:</b> homogeneous low-field, nondegenerate, low-injection teaching model. No
            Poisson equation, self-consistent charge separation, majority-carrier evolution,
            ambipolar coupling, traps, field-dependent mobility, velocity saturation, surface-state
            model or external circuit. Pair creation and recombination require a majority reservoir;
            the tiny majority perturbation is neglected rather than evolved as a second packet.
            Fixed background current need not close a device-level continuity/electrostatic problem.
            Uniform pulse decay may be compared analytically; packet Gaussian comparisons apply
            before boundaries affect it.
          </p>
          <p>
            SI internally. cm⁻³ ×10⁶ → m⁻³; cm²/(V·s) and cm²/s ×10⁻⁴ → SI; V/cm ×100 → V/m; µs
            ×10⁻⁶ → s. Current A/m² ÷10⁴ → A/cm²; sheet population m⁻² ÷10⁴ → cm⁻². Flux and density
            CSV columns retain SI units.
          </p>
        </details>
        <details className="tr-card tr-reference">
          <summary>Neamen alignment & validation</summary>
          <p>
            <b>Neamen, Semiconductor Physics and Devices, Fourth Edition:</b> §5.1.1, printed pp.
            157–159 (PDF 182–184): drift and current signs; §5.2, pp. 172–176 (PDF 197–201):
            diffusion; §5.3.2, p. 178 (PDF 203): Einstein relation. §§6.1–6.2, pp. 193–200 (PDF
            218–225): excess generation/recombination, low injection, lifetime decay, continuity and
            time-dependent transport. §6.3, pp. 201–216: ambipolar transport and its low-injection
            limits, contrasted explicitly with the prescribed-field approximation here. Table B.4,
            p. 717 (PDF 742): reference majority mobilities and Si background parameters.
          </p>
          <p>
            Chapter 6 explains that separating photogenerated electrons and holes induces an
            internal field. That physics is deliberately not solved here; the app evolves only a
            minority excess density against a maintained background. User-adjustable mobility,
            diffusion, lifetime and generation are teaching inputs, not a fitted transport dataset.
            “Drift only” deliberately sets D = 0 to isolate drift even if the Einstein checkbox is
            selected; the active D readout makes this override explicit.
          </p>
          <p>
            <b>Validation:</b> Gaussian variance σ₀²+2Dt and center, signed drift displacement,
            uniform exponential decay, approach to Gτ, conventional-current signs, and full
            source/sink/boundary balance. Spatial refinement at 100/200/400 cells reduces drift and
            combined-profile error. Time-step refinement at 1, ½, ¼ step reduces decay error.
            First-order errors remain visible; stability does not imply grid independence.
          </p>
        </details>
        <footer>
          Carrier transport & lifetime{' '}
          <span>Finite volumes · Prescribed field · Explicit carrier balance</span>
        </footer>
      </main>
    </div>
  );
}
