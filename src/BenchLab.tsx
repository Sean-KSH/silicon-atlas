import React, { useMemo, useState } from 'react';
import { useLinkedState } from './urlState';
import { Chart } from './PhotonicsLab';
import {
  BenchSettings,
  benchDefaults,
  resistorBench,
  fetBench,
  inverterBench,
  inverterTransient,
  ring,
  opticalBench,
  receiver,
  measure,
  stageDelay,
} from './bench';
import './junction.css';
import './bench.css';
const fmt = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? '—'
    : v === 0
      ? '0'
      : Math.abs(v) < 0.001 || Math.abs(v) >= 1e5
        ? v.toExponential(3)
        : Number(v.toPrecision(4)).toString();
function Dial({
  label,
  value,
  min,
  max,
  step,
  unit,
  set,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  set: (n: number) => void;
}) {
  return (
    <label className="pn-control">
      <span>{label}</span>
      <b>
        {fmt(value)} {unit}
      </b>
      <input
        aria-label={label}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => set(+e.target.value)}
      />
      <small>
        {min}–{max} {unit}
      </small>
    </label>
  );
}
function Stats({ items }: { items: [string, number | null | undefined, string][] }) {
  return (
    <div className="pn-metrics">
      {items.map(([name, value, unit]) => (
        <div key={name}>
          <span>{name}</span>
          <b>
            {fmt(value)} <small>{unit}</small>
          </b>
        </div>
      ))}
    </div>
  );
}
function RingDiagram({ values, probe }: { values: number[]; probe: BenchSettings['probe'] }) {
  return (
    <svg
      viewBox="0 0 850 205"
      className="bench-diagram"
      role="img"
      aria-label="Five inverter stages in a feedback loop with capacitive nodes and optional external buffer"
    >
      <path d="M40 80 H755 V158 H40 V80" fill="none" stroke="var(--c-8ca7b8)" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${65 + i * 140} 0)`}>
          <path
            d="M0 55 L0 105 L48 80 Z"
            fill="var(--c-29473f)"
            stroke="var(--c-8bd8be)"
            strokeWidth="2"
          />
          <circle cx="53" cy="80" r="5" fill="var(--c-12232b)" stroke="var(--c-8bd8be)" />
          <circle cx="90" cy="80" r="4" fill="var(--c-edc58c)" />
          <path
            d="M90 80 V112 M78 112 H102 M78 119 H102 M90 119 V136 M80 136 H100"
            stroke="var(--c-adc0cb)"
            fill="none"
          />
          <text x="0" y="38">
            Stage {i + 1}
          </text>
          <text x="62" y="59">
            {fmt(values[i])} V
          </text>
        </g>
      ))}
      <text x="50" y="190">
        Calculated node voltages at scope cursor · capacitors to ground · feedback from node 5 to
        stage 1
      </text>
      {probe !== 'ideal' && (
        <>
          <path d="M755 80 H815 V24 H530" stroke="var(--c-edc58c)" fill="none" />
          <text x="320" y="28">
            {probe === 'buffer' ? '→ sixth buffer → scope' : '→ direct scope load'}
          </text>
        </>
      )}
    </svg>
  );
}
const labels = [
  'Resistors',
  'MOSFET extraction',
  'Inverter DC',
  'Loaded transient',
  'Five-stage ring',
  'Optical devices',
];
const links = [
  ['#fabrication', 'Fabrication: metal and diffused sheet geometry'],
  ['#mos', 'Gate Control: charge-sheet MOSFET equations'],
  ['#mos', 'Gate Control: pull-up and pull-down drive'],
  ['#transport', 'Transport: charge storage and finite response'],
  ['#fabrication', 'Fabrication: dimensions, oxide and gate capacitance'],
  ['#photonics', 'Photonics: absorption, collection and power budget'],
];
type Data = {
  res?: ReturnType<typeof resistorBench>;
  fet?: ReturnType<typeof fetBench>;
  inv?: ReturnType<typeof inverterBench>;
  trans?: ReturnType<typeof inverterTransient>;
  osc?: ReturnType<typeof ring>;
  opt?: ReturnType<typeof opticalBench>;
  rx?: ReturnType<typeof receiver>;
  convergence?: number | null;
  error?: string;
};
export default function BenchLab() {
  const [run, setRun] = useLinkedState<BenchSettings>('', { ...benchDefaults }),
    [draft, setDraft] = useState<BenchSettings>(run),
    [tab, setTab] = useLinkedState('station', 0),
    [deep, setDeep] = useState(false),
    [cursor, setCursor] = useState(0),
    [window, setWindow] = useState<'startup' | 'steady'>('steady'),
    [prediction, setPrediction] = useState(''),
    [reveal, setReveal] = useState(false);
  const set = <K extends keyof BenchSettings>(key: K, v: BenchSettings[K]) =>
    setDraft((old) => ({ ...old, [key]: v }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(run);
  const reset = () => {
    setDraft({ ...benchDefaults });
    setRun({ ...benchDefaults });
    setCursor(0);
  };
  const data = useMemo<Data>(() => {
    try {
      if (tab === 0) return { res: resistorBench(run) };
      if (tab === 1) return { fet: fetBench(run) };
      if (tab === 2) return { inv: inverterBench(run) };
      if (tab === 3) {
        const trans = inverterTransient(run),
          fine = stageDelay(run, trans.cap, 2, undefined, true);
        return { trans, convergence: Math.abs(fine.tp - trans.delay.tp) / fine.tp };
      }
      if (tab === 4) {
        const osc = ring(run),
          fine = run.perturb ? ring(run, 2) : null;
        return {
          osc,
          convergence:
            osc.frequency && fine?.frequency
              ? Math.abs(osc.frequency - fine.frequency) / fine.frequency
              : null,
        };
      }
      return { opt: opticalBench(run), rx: receiver(run) };
    } catch (e) {
      return { error: String(e) };
    }
  }, [run, tab]);
  const { res, fet, inv, trans, osc, opt, rx } = data;
  const trace = trans?.rows ?? osc?.rows ?? rx?.rows ?? [],
    visibleTrace = trace.filter((r, i) =>
      tab === 4 ? (window === 'startup' ? i < trace.length * 0.3 : i > trace.length * 0.7) : true,
    );
  const scopeRows = visibleTrace.map((r, i) => {
      const z: Record<string, number> = {
        x: r.t * 1e6,
        measured: measure(r.y[osc ? (run.probe === 'buffer' ? 5 : 4) : 0], run, i + 2000, 'V'),
      };
      r.y.forEach((v, j) => (z['v' + j] = v));
      return z;
    }),
    position = trace[Math.min(cursor, Math.max(0, trace.length - 1))];
  const exportData = () => {
    const rows =
      res?.rows ??
      fet?.transfer ??
      inv?.rows ??
      opt?.rows ??
      trace.map((r) => ({
        time_s: r.t,
        ...Object.fromEntries(r.y.map((v, j) => ['node' + j + '_V', v])),
      }));
    if (!rows.length) return;
    const keys = Object.keys(rows[0]),
      csv =
        '# Virtual ECE308 bench; SI units. Configuration: ' +
        JSON.stringify(run) +
        '\n' +
        keys.join(',') +
        '\n' +
        rows
          .map((r) => keys.map((k) => (r as unknown as Record<string, unknown>)[k] ?? '').join(','))
          .join('\n'),
      u = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      a = document.createElement('a');
    a.href = u;
    a.download = 'virtual-bench-' + tab + '-SI.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  return (
    <div className="pn-lab bench-lab">
      <header>
        <a className="brand" href="#bench">
          <span className="brandmark">I–V</span>
          <span>
            Silicon Atlas<span className="brand-sub">ECE 308 / Virtual measurement bench</span>
          </span>
        </a>
        <button onClick={reset} title="Restore this module's tested default settings">
          Reset module
        </button>
      </header>
      <main>
        <div className="pn-hero">
          <span className="eyebrow">Measurements manual / Fall 2025</span>
          <h1>
            Probe the device.
            <br />
            Understand the measurement.
          </h1>
          <p>
            Virtual SMUs, a DC supply and an oscilloscope. Every trace comes from a stated device or
            circuit equation; every extraction retains its ideal reference.
          </p>
          <div className="pn-actions">
            {labels.map((name, i) => (
              <button
                key={name}
                className={tab === i ? 'selected' : ''}
                onClick={() => {
                  setTab(i);
                  setCursor(0);
                  setReveal(false);
                }}
              >
                {i + 1} / {name}
              </button>
            ))}
          </div>
        </div>
        <section className="bench-rack">
          <div>
            <span>Source / Acquisition</span>
            <strong>{dirty ? 'Settings pending' : 'Acquisition ready'}</strong>
            <small>
              {tab === 0
                ? run.metal
                  ? 'SMU sweep 0–1 V'
                  : 'SMU sweep 0–5 V'
                : tab === 1
                  ? 'Dual SMU · gate + drain'
                  : tab === 5
                    ? 'Optical SMU · −1 to +1 V'
                    : `DC supply ${fmt(run.vdd)} V`}
            </small>
          </div>
          <div>
            <span>Current meter / Digitizer</span>
            <strong>
              {run.noise ? 'Synthetic noise on' : 'Noise off'} ·{' '}
              {run.resolution ? 'Quantized' : 'Ideal resolution'}
            </strong>
            <small>Seed {run.seed} · reference preserved</small>
          </div>
          <div className="pn-actions">
            <button
              className="selected"
              onClick={() => {
                setRun({ ...draft });
                setCursor(0);
              }}
            >
              Run acquisition
            </button>
            <button disabled={!!data.error} onClick={exportData}>
              ↓ Data CSV
            </button>
            <button onClick={() => setDeep(!deep)}>{deep ? 'Hide' : 'Show'} equations</button>
          </div>
        </section>
        <div className="pn-layout">
          <aside className="pn-card pn-controls">
            <h2>Bench controls</h2>
            <p className="pn-note">
              Edit settings, then Run acquisition. Graphs and readouts retain the last acquired
              configuration until you run again.
            </p>
            {tab === 0 && (
              <>
                <div className="pn-actions">
                  <button
                    className={draft.metal ? 'selected' : ''}
                    onClick={() => set('metal', true)}
                  >
                    Ti / Ag metal
                  </button>
                  <button
                    className={!draft.metal ? 'selected' : ''}
                    onClick={() => set('metal', false)}
                  >
                    Doped Si
                  </button>
                </div>
                <Dial
                  label="Probed resistor length"
                  value={draft.length * 1e3}
                  min={3}
                  max={24}
                  step={3}
                  unit="mm"
                  set={(v) => set('length', v * 1e-3)}
                />
                {draft.metal && (
                  <Dial
                    label="Assumed metal sheet resistance"
                    value={draft.sheet}
                    min={0.05}
                    max={1}
                    step={0.01}
                    unit="Ω/□"
                    set={(v) => set('sheet', v)}
                  />
                )}
                <p className="pn-note">
                  Manual width: 50 µm. Four extraction lengths: 3, 6, 12, 24 mm. Metal stack: 30 nm
                  Ti / 90 nm Ag; default 0.2 Ω/□ is an assumed sample value. Doped-Si reference uses
                  assumed uniform n = 10¹⁹ cm⁻³, μ = 50 cm²/(V·s), active depth 1 µm.
                </p>
              </>
            )}
            {tab === 1 && (
              <>
                <label className="bench-select">
                  Channel length
                  <select
                    aria-label="MOSFET channel length"
                    value={Math.round(draft.fetL * 1e6)}
                    onChange={(e) => set('fetL', +e.target.value / 1e6)}
                  >
                    {[25, 50, 100, 200].map((L) => (
                      <option key={L} value={L}>
                        {L} µm
                      </option>
                    ))}
                  </select>
                </label>
                <Dial
                  label="Selected output-sweep VGS"
                  value={draft.gate}
                  min={0}
                  max={5}
                  step={1}
                  unit="V"
                  set={(v) => set('gate', v)}
                />
                <div className="pn-actions">
                  <button
                    className={draft.method === 'linear' ? 'selected' : ''}
                    onClick={() => set('method', 'linear')}
                  >
                    Linear ID fit
                  </button>
                  <button
                    className={draft.method === 'sqrt' ? 'selected' : ''}
                    onClick={() => set('method', 'sqrt')}
                  >
                    √ID saturation fit
                  </button>
                </div>
                <Dial
                  label="Fit-window lower VGS"
                  value={draft.fitMin}
                  min={0}
                  max={4}
                  step={0.1}
                  unit="V"
                  set={(v) => set('fitMin', v)}
                />
                <Dial
                  label="Fit-window upper VGS"
                  value={draft.fitMax}
                  min={4.1}
                  max={5}
                  step={0.1}
                  unit="V"
                  set={(v) => set('fitMax', v)}
                />
                <p className="pn-note">
                  Manual W = 1 mm. Output sweeps: VDS 0–5 V in 0.1 V steps, VGS 0–5 V. Transfer
                  acquisition: 0.05 V gate steps. Linear fit uses VDS = 0.05 V; √ID fit uses VDS = 5
                  V.
                </p>
              </>
            )}
            {tab >= 2 && tab <= 4 && (
              <>
                <div className="pn-actions">
                  <button
                    className={draft.topology === 'nmos' ? 'selected' : ''}
                    onClick={() => setDraft((old) => ({ ...old, topology: 'nmos', ratio: 0.5 }))}
                  >
                    Course nMOS
                  </button>
                  <button
                    className={draft.topology === 'cmos' ? 'selected' : ''}
                    onClick={() => setDraft((old) => ({ ...old, topology: 'cmos', ratio: 5 }))}
                  >
                    CMOS comparison
                  </button>
                </div>
                <Dial
                  label="DC supply VDD"
                  value={draft.vdd}
                  min={5}
                  max={10}
                  step={0.5}
                  unit="V"
                  set={(v) => set('vdd', v)}
                />
                <Dial
                  label="Pull-up W/L"
                  value={draft.ratio}
                  min={0.04}
                  max={5}
                  step={0.02}
                  unit=""
                  set={(v) => set('ratio', v)}
                />
                <p className="pn-note">
                  Pull-down W/L = 250/50 = 5. Course nMOS pull-up: gate = drain = VDD, body = 0.
                  CMOS pMOS gate follows the input; its body/source are at VDD. Default pull-up
                  ratio 0.5 is a chosen intermediate design; the manual gives endpoint ratios 0.04
                  and 5.
                </p>
                {tab === 2 ? (
                  <Dial
                    label="Input source Vin"
                    value={draft.vin}
                    min={0}
                    max={10}
                    step={0.1}
                    unit="V"
                    set={(v) => set('vin', v)}
                  />
                ) : (
                  <>
                    <Dial
                      label="Additional node capacitance"
                      value={draft.extraC * 1e12}
                      min={0}
                      max={30}
                      step={0.5}
                      unit="pF"
                      set={(v) => set('extraC', v * 1e-12)}
                    />
                    <Dial
                      label="Oscilloscope capacitance"
                      value={draft.scopeC * 1e12}
                      min={0}
                      max={100}
                      step={1}
                      unit="pF"
                      set={(v) => set('scopeC', v * 1e-12)}
                    />
                    <div className="pn-actions">
                      <button
                        className={draft.scale === 1 ? 'selected' : ''}
                        onClick={() => set('scale', 1)}
                      >
                        Full W and L
                      </button>
                      <button
                        className={draft.scale === 0.5 ? 'selected' : ''}
                        onClick={() => set('scale', 0.5)}
                      >
                        Half W and L
                      </button>
                    </div>
                    <p className="pn-note">
                      Scaling both dimensions leaves W/L and ideal drive unchanged; gate capacitance
                      scales with area. Added capacitance remains fixed.
                    </p>
                  </>
                )}
                {tab === 4 && (
                  <>
                    <label className="bench-select">
                      Scope connection
                      <select
                        aria-label="Ring scope connection"
                        value={draft.probe}
                        onChange={(e) => set('probe', e.target.value as BenchSettings['probe'])}
                      >
                        <option value="ideal">Nonloading reference</option>
                        <option value="buffer">Sixth inverter buffer</option>
                        <option value="direct">Directly on node 5</option>
                      </select>
                    </label>
                    <label className="bench-check">
                      <input
                        type="checkbox"
                        checked={draft.perturb}
                        onChange={(e) => set('perturb', e.target.checked)}
                      />{' '}
                      Startup perturbation: node 1 + 0.1% VDD
                    </label>
                  </>
                )}
              </>
            )}
            {tab === 1 || (tab >= 2 && tab <= 4) ? (
              <>
                <h3>Assumed transistor parameters</h3>
                <Dial
                  label="Zero-body-bias threshold"
                  value={draft.vt}
                  min={1}
                  max={3}
                  step={0.1}
                  unit="V"
                  set={(v) => set('vt', v)}
                />
                <Dial
                  label="Electron channel mobility"
                  value={draft.mobility * 1e4}
                  min={100}
                  max={1000}
                  step={10}
                  unit="cm²/(V·s)"
                  set={(v) => set('mobility', v / 1e4)}
                />
                <Dial
                  label="Gate oxide thickness"
                  value={draft.tox * 1e9}
                  min={20}
                  max={100}
                  step={1}
                  unit="nm"
                  set={(v) => set('tox', v * 1e-9)}
                />
              </>
            ) : null}
            {tab === 5 && (
              <>
                <Dial
                  label="Monochromatic irradiance"
                  value={draft.irradiance}
                  min={0}
                  max={2000}
                  step={10}
                  unit="W/m²"
                  set={(v) => set('irradiance', v)}
                />
                <label className="bench-select">
                  Solar-cell area
                  <select
                    aria-label="Solar-cell area"
                    value={draft.solarArea}
                    onChange={(e) => set('solarArea', +e.target.value)}
                  >
                    <option value={25e-6}>5 × 5 mm</option>
                    <option value={6.25e-6}>2.5 × 2.5 mm</option>
                  </select>
                </label>
                <Dial
                  label="Assumed front reflection"
                  value={draft.reflection * 100}
                  min={0}
                  max={50}
                  step={1}
                  unit="%"
                  set={(v) => set('reflection', v / 100)}
                />
                <Dial
                  label="Receiver load resistance"
                  value={draft.receiverR / 1000}
                  min={1}
                  max={111}
                  step={1}
                  unit="kΩ"
                  set={(v) => set('receiverR', v * 1000)}
                />
                <Dial
                  label="Oscilloscope capacitance"
                  value={draft.scopeC * 1e12}
                  min={0}
                  max={100}
                  step={1}
                  unit="pF"
                  set={(v) => set('scopeC', v * 1e-12)}
                />
                <p className="pn-note">
                  Solar source: 650 nm monochromatic, not AM1.5. Receiver area: 1 mm², cathode
                  supply +5 V, load to ground. Filter exercise uses 700/810/900/1000 nm with the
                  same explicit irradiance at each wavelength.
                </p>
              </>
            )}
            <h3>Measurement imperfections</h3>
            <label className="bench-check">
              <input
                type="checkbox"
                checked={draft.contact}
                onChange={(e) => set('contact', e.target.checked)}
              />{' '}
              Ohmic contact resistance
            </label>
            {draft.contact && (
              <Dial
                label="Resistance per terminal contact"
                value={draft.rc}
                min={0}
                max={200}
                step={1}
                unit="Ω"
                set={(v) => set('rc', v)}
              />
            )}
            <label className="bench-check">
              <input
                type="checkbox"
                checked={draft.noise}
                onChange={(e) => set('noise', e.target.checked)}
              />{' '}
              Seeded synthetic Gaussian noise
            </label>
            <label className="bench-check">
              <input
                type="checkbox"
                checked={draft.resolution}
                onChange={(e) => set('resolution', e.target.checked)}
              />{' '}
              Finite digitizer resolution
            </label>
            {(draft.noise || draft.resolution) && (
              <>
                <Dial
                  label="Current noise σ"
                  value={draft.sigmaI * 1e6}
                  min={0}
                  max={10}
                  step={0.1}
                  unit="µA rms"
                  set={(v) => set('sigmaI', v * 1e-6)}
                />
                <Dial
                  label="Voltage noise σ"
                  value={draft.sigmaV * 1000}
                  min={0}
                  max={20}
                  step={0.5}
                  unit="mV rms"
                  set={(v) => set('sigmaV', v / 1000)}
                />
                <Dial
                  label="Current digitizer step"
                  value={draft.lsbI * 1e6}
                  min={0.1}
                  max={10}
                  step={0.1}
                  unit="µA"
                  set={(v) => set('lsbI', v * 1e-6)}
                />
                <Dial
                  label="Voltage digitizer step"
                  value={draft.lsbV * 1000}
                  min={0.1}
                  max={20}
                  step={0.1}
                  unit="mV"
                  set={(v) => set('lsbV', v / 1000)}
                />
                <button onClick={() => set('seed', draft.seed + 1)}>
                  New deterministic noise seed
                </button>
              </>
            )}
            <p className="pn-note">
              Noise is added to observations, not to circuit dynamics or oscillator startup. Same
              seed + setup reproduces the measurement. Instrument specifications here are chosen
              teaching settings, not Keithley/Tektronix calibration data.
            </p>
          </aside>
          <div className="pn-main">
            {data.error ? (
              <section className="pn-card pn-error" role="alert">
                <h2>Acquisition unavailable</h2>
                <p>{data.error}</p>
                <button onClick={reset}>Restore tested setup</button>
              </section>
            ) : (
              <>
                <section className="pn-card">
                  <span className="eyebrow">Virtual probe station / {labels[tab]}</span>
                  <h2>
                    {
                      [
                        'Separate geometry from contacts.',
                        'Extract parameters from a measured slope.',
                        'Two pull-up mechanisms. Two power budgets.',
                        'Capacitance makes switching take time.',
                        'Five nodes. One solved feedback loop.',
                        'Characterize light-to-current conversion.',
                      ][tab]
                    }
                  </h2>
                  {res && (
                    <>
                      <Stats
                        items={[
                          ['Reference sheet resistance', res.sheet, 'Ω/□'],
                          ['Extracted sheet resistance', res.extracted, 'Ω/□'],
                          ['Sheet extraction error', 100 * (res.extracted / res.sheet - 1), '%'],
                          ['Per-contact intercept estimate', res.contactEstimate, 'Ω'],
                          ['R vs L/W fit R²', res.fit.r2, ''],
                          ['Current compliance', 100, 'mA'],
                        ]}
                      />
                      <svg
                        viewBox="0 0 850 160"
                        className="bench-diagram"
                        role="img"
                        aria-label="SMU voltage source drives two contacts and a serpentine resistor with a current meter"
                      >
                        <rect x="40" y="35" width="140" height="80" fill="var(--c-354e63)" />
                        <text x="62" y="70">
                          SMU: V source
                        </text>
                        <text x="62" y="95">
                          I measurement
                        </text>
                        <path
                          d="M180 60 H280 V40 H650 V80 H300 V120 H650"
                          stroke="var(--c-dbb577)"
                          strokeWidth="6"
                          fill="none"
                        />
                        <path
                          d="M650 120 H750 V140 H180 V95"
                          stroke="var(--c-9ab6c7)"
                          fill="none"
                        />
                        <text x="320" y="25">
                          Width 50 µm · selected length {fmt(run.length * 1e3)} mm
                        </text>
                        <text x="570" y="105">
                          2Rc + R□ L/W
                        </text>
                      </svg>
                      <p className="pn-note">
                        Serpentine drawing is conceptual; extra corner/pad resistance is neglected.
                        The n+ sheet reference uses uniform effective doping and mobility, not a
                        solved diffusion profile. Rectifying or unopened contacts from the manual
                        require a different model; enabled Rc is strictly ohmic.
                      </p>
                    </>
                  )}
                  {fet && (
                    <>
                      <Stats
                        items={[
                          ['Reference VT', run.vt, 'V'],
                          ['Extracted VT', fet.extracted?.vt, 'V'],
                          ['Reference mobility', run.mobility * 1e4, 'cm²/(V·s)'],
                          [
                            'Extracted mobility',
                            fet.extracted ? fet.extracted.mobility * 1e4 : null,
                            'cm²/(V·s)',
                          ],
                          ['Transfer drain bias', fet.vds, 'V'],
                          ['Fit R²', fet.extracted?.fit.r2, ''],
                        ]}
                      />
                      {fet.error && (
                        <p className="pn-error" role="alert">
                          {fet.error}
                        </p>
                      )}
                      <p className="pn-note">
                        Gate SMU sets VGS; drain SMU measures ID; source and body are grounded.
                        Source/drain contacts, when enabled, are solved implicitly: VGS,int = VGS −
                        IRc and VDS,int = VDS − 2IRc. The noiseless reference has Rc = 0. Extraction
                        assumes known W, L and tox and neglects mobility degradation and
                        channel-length modulation.
                      </p>
                    </>
                  )}
                  {(inv || trans || osc) && (
                    <>
                      <svg
                        viewBox="0 0 850 280"
                        className="bench-diagram"
                        role="img"
                        aria-label={
                          run.topology === 'nmos'
                            ? 'Course enhancement-load nMOS inverter with gate and drain tied to supply'
                            : 'CMOS inverter with both gates connected to input'
                        }
                      >
                        <path
                          d="M500 35 V70 M500 110 V170 M500 210 V250 M500 140 H730 M210 195 H450"
                          stroke="var(--c-aac6d7)"
                          strokeWidth="3"
                          fill="none"
                        />
                        <rect x="455" y="70" width="90" height="40" rx="4" fill="var(--c-766448)" />
                        <rect
                          x="455"
                          y="170"
                          width="90"
                          height="40"
                          rx="4"
                          fill="var(--c-3f6d67)"
                        />
                        {run.topology === 'nmos' ? (
                          <path
                            d="M455 90 H400 V35 H500"
                            stroke="var(--c-e5c48f)"
                            fill="none"
                            strokeWidth="3"
                          />
                        ) : (
                          <path
                            d="M400 195 V90 H455"
                            stroke="var(--c-e5c48f)"
                            fill="none"
                            strokeWidth="3"
                          />
                        )}
                        <text x="470" y="22">
                          VDD = {fmt(run.vdd)} V
                        </text>
                        <text x="560" y="94">
                          {run.topology === 'nmos'
                            ? 'nMOS load: G = D = VDD'
                            : 'pMOS pull-up: gate = Vin'}
                        </text>
                        <text x="560" y="198">
                          nMOS pull-down
                        </text>
                        <text x="150" y="200">
                          Vin
                        </text>
                        <text x="690" y="128">
                          Vout
                        </text>
                        <text x="470" y="272">
                          Ground
                        </text>
                        <text x="50" y="60">
                          W/Ldown = 5
                        </text>
                        <text x="50" y="86">
                          W/Lup = {fmt(run.ratio)}
                        </text>
                      </svg>
                      <p className="pn-note">
                        {run.topology === 'nmos'
                          ? 'The pull-up is diode-connected and always in saturation when on. It stops charging before VDD because VGS falls toward its body-shifted threshold. A high input leaves a conducting VDD-to-ground path.'
                          : 'CMOS turns the pMOS off at a high input and the nMOS off at a low input. It approaches both rails and has only the declared 10 GΩ leakage load at steady logic levels. Both devices can conduct near the transition.'}{' '}
                        Circuit-only parameters: γ = 0.4 V½, 2φF = 0.7 V, continuous saturation CLM
                        λ = 0.02 V⁻¹. They are chosen teaching parameters.
                      </p>
                    </>
                  )}
                  {inv && (
                    <Stats
                      items={[
                        ['Applied Vin', run.vin, 'V'],
                        ['Measured Vout', measure(inv.point.v, run, 800, 'V'), 'V'],
                        ['Noise-free supply current', inv.point.up * 1e6, 'µA'],
                        ['Static supply power', inv.point.power * 1e3, 'mW'],
                        ['VOH at Vin = 0', inv.high, 'V'],
                        ['VOL at Vin = VDD', inv.low, 'V'],
                      ]}
                    />
                  )}
                  {trans && (
                    <Stats
                      items={[
                        ['Loaded node capacitance', trans.cap * 1e12, 'pF'],
                        ['Low-to-high delay', trans.delay.rise * 1e9, 'ns'],
                        ['High-to-low delay', trans.delay.fall * 1e9, 'ns'],
                        ['Average delay', trans.delay.tp * 1e9, 'ns'],
                        ['Numerical timestep', trans.dt * 1e9, 'ns'],
                        [
                          'Delay change at dt/2',
                          data.convergence === null ? null : (data.convergence ?? 0) * 100,
                          '%',
                        ],
                      ]}
                    />
                  )}
                  {osc && (
                    <>
                      <RingDiagram values={position?.y ?? []} probe={run.probe} />
                      <Stats
                        items={[
                          [
                            'Measured ring frequency',
                            osc.frequency ? osc.frequency / 1e6 : null,
                            'MHz',
                          ],
                          [
                            'Mean paired stage-edge delay',
                            osc.edgeDelay ? osc.edgeDelay * 1e9 : null,
                            'ns',
                          ],
                          [
                            '1 / (10 paired edge delay)',
                            osc.edgeDelay ? 1 / (10 * osc.edgeDelay) / 1e6 : null,
                            'MHz',
                          ],
                          ['Isolated-step estimate 1/(10tp)', osc.predicted / 1e6, 'MHz'],
                          ['Mean supply power, all stages', osc.meanPower * 1e3, 'mW'],
                          [
                            'Frequency change at dt/2',
                            data.convergence === null ? null : (data.convergence ?? 0) * 100,
                            '%',
                          ],
                        ]}
                      />
                      <p className="pn-note">
                        {osc.symmetric
                          ? 'No startup perturbation: the circuit is initialized at its solved DC equilibrium and remains there. For identical nonloading stages all five nodes equal the inverter fixed point. No arbitrary oscillation is drawn.'
                          : osc.frequency
                            ? 'Frequency is measured from three late rising-edge periods of node 1; edge delays independently pair input transitions with opposite output transitions through all five stages.'
                            : 'No established oscillation detected: fewer than four late rising crossings or swing below 10% VDD. An odd stage count alone does not guarantee oscillation at every drive ratio/load.'}{' '}
                        Ring-node capacitance = {fmt(osc.cap * 1e12)} pF; timestep ={' '}
                        {fmt(osc.dt * 1e9)} ns; {osc.steps.toLocaleString()} integration steps.
                      </p>
                      <p className="pn-note">
                        The isolated delay estimate uses abrupt 0↔VDD inputs; the ring has finite
                        slew and degraded nMOS levels, so that estimate can differ substantially.
                        The f ≈ 1/(2Ntp) check uses measured stage-edge delays at a common midpoint.
                        Buffer probing adds another input gate capacitance to node 5; direct probing
                        adds the scope’s capacitance and 1 MΩ resistance there. The buffer output is
                        a sixth dynamic node, outside the loop.
                      </p>
                    </>
                  )}
                  {opt && (
                    <>
                      <Stats
                        items={[
                          ['Reference ISC', opt.pv.isc * 1e3, 'mA'],
                          ['Measured ISC', opt.isc * 1e3, 'mA'],
                          ['Reference VOC', opt.pv.voc, 'V'],
                          ['Interpolated measured VOC', opt.voc, 'V'],
                          ['Reference Pmax', opt.pv.mpp.power * 1e3, 'mW'],
                          ['Sampled measured Pmax', opt.measuredMpp * 1e3, 'mW'],
                        ]}
                      />
                      <p className="pn-note">
                        Manual sweep: −1 to +1 V in 0.05 V steps with 100 mA compliance. At
                        compliance the source voltage changes to maintain the current limit; actual
                        voltage is exported separately. Positive diode current enters the p
                        terminal; delivered solar power is −VI. Finite sweep spacing introduces
                        extraction error even without noise.
                      </p>
                    </>
                  )}
                  <div className="pn-explain">
                    <h3>What changed and why?</h3>
                    <p>
                      {res
                        ? 'A constant contact resistance shifts R versus L/W upward. Its slope still yields sheet resistance, while a single two-terminal resistance confounds sheet and contact contributions.'
                        : fet
                          ? 'The chosen slope gives mobility only when geometry, oxide capacitance and operating region are known. Series contact drops reduce internal biases; noise and quantization perturb the fit. The reference values let you distinguish those errors.'
                          : inv
                            ? 'Pull-up strength sets the current balance. The nMOS load gives a degraded high level and nonzero low-output static power; the pMOS comparison actively pulls high and turns off at low output.'
                            : trans
                              ? 'The output capacitor must receive or lose charge through finite transistor currents. Scope capacitance is part of the circuit, not a cosmetic trace delay. Delays use the midpoint of the actual loaded high and low output levels.'
                              : osc
                                ? 'The frequency emerges from C dV/dt = Ipull-up − Ipull-down − Ileak at every node. Measurement noise never determines the oscillator frequency; the explicit initial perturbation breaks the equilibrium symmetry.'
                                : 'Solar-cell area scales photocurrent, while photodiode area changes capacitance. Reflection and collection remain distinct assumptions from the Photonics lab; the filter exercise uses specified monochromatic powers rather than an invented spectrum.'}
                    </p>
                    <a href={links[tab][0]}>{links[tab][1]} ↗</a>
                  </div>
                </section>
                {res && (
                  <>
                    <section className="pn-card">
                      <h2>Two-terminal resistor sweep</h2>
                      <Chart
                        data={res.rows.map((r) => ({
                          ...r,
                          reference: r.reference * 1e3,
                          physical: r.physical * 1e3,
                          measured: r.measured * 1e3,
                        }))}
                        lines={[
                          ['reference', 'Zero-contact reference', 'var(--c-bdb0e7)'],
                          ['physical', 'Noise-free with contacts', 'var(--c-8bd8be)'],
                          ['measured', 'Digitized current', 'var(--c-edc58c)'],
                        ]}
                        x="Commanded source voltage (V)"
                        y="Current (mA)"
                      />
                      <p className="pn-note">
                        {res.rows.filter((r) => r.compliance).length} samples are current-limited.
                        Fits use actual measured voltage, not the commanded setpoint.
                      </p>
                    </section>
                    <section className="pn-card">
                      <h2>Extract sheet resistance from geometry</h2>
                      <Chart
                        data={res.geometry}
                        lines={[
                          ['reference', 'Zero-contact reference', 'var(--c-bdb0e7)'],
                          ['physical', 'True two-terminal resistance', 'var(--c-8bd8be)'],
                          ['R', 'Extracted from I–V', 'var(--c-edc58c)'],
                        ]}
                        x="Number of squares L/W"
                        y="Resistance (Ω)"
                      />
                      <p>
                        Fit R = R□(L/W) + 2Rc. The slope is sheet resistance; half the intercept
                        estimates resistance of each identical contact. Each resistance is obtained
                        from a free-intercept linear fit to measured I versus measured V.
                      </p>
                    </section>
                  </>
                )}
                {fet && (
                  <>
                    <section className="pn-card">
                      <h2>Output sweeps and transfer extraction</h2>
                      <Chart
                        data={fet.output.map((r) =>
                          Object.fromEntries(
                            Object.entries(r).map(([k, v]) => [k, k === 'x' ? v : v * 1e3]),
                          ),
                        )}
                        lines={[
                          ['g1', 'VGS 1 V ref', 'var(--c-698fa8)'],
                          ['g2', '2 V ref', 'var(--c-93a7c3)'],
                          ['g3', '3 V ref', 'var(--c-b5a9dc)'],
                          ['g4', '4 V ref', 'var(--c-88d2b8)'],
                          ['g5', '5 V ref', 'var(--c-e4bf83)'],
                          ['measured', 'Selected VGS measured', 'var(--c-f2e5cf)'],
                        ]}
                        x="Drain SMU VDS (V)"
                        y="Drain current (mA)"
                      />
                      <Chart
                        data={fet.transfer.map((r) => ({
                          ...r,
                          reference: r.reference * 1e3,
                          physical: r.physical * 1e3,
                          measured: r.measured * 1e3,
                        }))}
                        lines={[
                          ['reference', 'Zero-contact reference', 'var(--c-bdb0e7)'],
                          ['physical', 'Noise-free with contacts', 'var(--c-8bd8be)'],
                          ['measured', 'Measured ID', 'var(--c-edc58c)'],
                        ]}
                        x="Gate SMU VGS (V)"
                        y="Drain current (mA)"
                      />
                      <Chart
                        data={fet.transfer.filter((r) => r.x >= run.fitMin && r.x <= run.fitMax)}
                        lines={[
                          [
                            'fitY',
                            run.method === 'sqrt' ? '√ID fit points' : 'ID fit points',
                            'var(--c-edc58c)',
                          ],
                        ]}
                        x="Commanded VGS (V); regression uses measured VGS"
                        y={run.method === 'sqrt' ? '√ID (A½)' : 'ID (A)'}
                      />
                      <p>
                        {run.method === 'linear'
                          ? 'Linear regime: slope m = μCox(W/L)VDS. μ = mL/(CoxWVDS); VT = −b/m − VDS/2. The finite-VDS correction is retained.'
                          : 'Saturation: √ID = m(VGS−VT). VT = −b/m; μ = 2m²L/(CoxW). Only positive current samples in a valid strong-inversion saturation window are accepted.'}
                      </p>
                    </section>
                  </>
                )}
                {inv && (
                  <section className="pn-card">
                    <h2>Voltage-transfer curve and static power</h2>
                    <Chart
                      data={inv.rows}
                      lines={[
                        ['reference', 'Zero-contact reference', 'var(--c-bdb0e7)'],
                        ['physical', 'Circuit solution', 'var(--c-8bd8be)'],
                        ['measured', 'Voltmeter reading', 'var(--c-edc58c)'],
                      ]}
                      x="Input source Vin (V)"
                      y="Output voltage (V)"
                      selected={run.vin}
                    />
                    <Chart
                      data={inv.rows.map((r) => ({
                        ...r,
                        power: r.power * 1e3,
                        referencePower: r.referencePower * 1e3,
                      }))}
                      lines={[
                        ['power', 'Supply power with contacts', 'var(--c-edc58c)'],
                        ['referencePower', 'Zero-contact reference', 'var(--c-bdb0e7)'],
                      ]}
                      x="Input source Vin (V)"
                      y="Static VDD × Isupply (mW)"
                      selected={run.vin}
                    />
                    <p className="pn-note">
                      The output voltmeter is not a voltage clamp. KCL is solved to its bracket
                      tolerance at each input. A 10 GΩ node leakage path defines a unique DC
                      equilibrium in the ideal cutoff limit; it is included in the displayed supply
                      power.
                    </p>
                  </section>
                )}
                {(trans || osc) && (
                  <section className="pn-card bench-scope">
                    <h2>Oscilloscope · calculated time domain</h2>
                    {osc && (
                      <div className="pn-actions">
                        <button
                          className={window === 'startup' ? 'selected' : ''}
                          onClick={() => setWindow('startup')}
                        >
                          Startup window
                        </button>
                        <button
                          className={window === 'steady' ? 'selected' : ''}
                          onClick={() => setWindow('steady')}
                        >
                          Late-time window
                        </button>
                      </div>
                    )}
                    <Chart
                      data={scopeRows}
                      lines={
                        osc
                          ? [
                              ['v0', 'Node 1', 'var(--c-8bd8be)'],
                              ['v1', 'Node 2', 'var(--c-b5a9dc)'],
                              ['v2', 'Node 3', 'var(--c-83bddb)'],
                              ['v3', 'Node 4', 'var(--c-dda0b0)'],
                              ['v4', 'Node 5', 'var(--c-edc58c)'],
                              ...(run.probe === 'buffer'
                                ? [
                                    ['v5', 'Buffer output', 'var(--c-bdcf85)'] as [
                                      string,
                                      string,
                                      string,
                                    ],
                                  ]
                                : []),
                              ['measured', 'Scope sample', 'var(--c-f5eee0)'],
                            ]
                          : [
                              ['v1', 'Generator input', 'var(--c-b5a9dc)'],
                              ['v0', 'Noise-free output', 'var(--c-8bd8be)'],
                              ['measured', 'Scope sample', 'var(--c-edc58c)'],
                            ]
                      }
                      x="Time (µs)"
                      y="Voltage (V)"
                      selected={position?.t !== undefined ? position.t * 1e6 : undefined}
                    />
                    <Dial
                      label="Scope sample cursor"
                      value={Math.min(cursor, Math.max(0, trace.length - 1))}
                      min={0}
                      max={Math.max(1, trace.length - 1)}
                      step={1}
                      unit="sample"
                      set={setCursor}
                    />
                    <p>
                      {position
                        ? `t = ${fmt(position.t * 1e6)} µs · ${position.y.map((v, i) => `CH${i + 1} ${fmt(v)} V`).join(' · ')}`
                        : ''}
                    </p>
                    <p className="pn-note">
                      The scope is 1 MΩ in parallel with the chosen input capacitance. Explicit RK4
                      advances all node voltages together; voltages outside the supply bounds cause
                      an error rather than being clamped. The displayed trace is decimated;
                      crossing-time calculations use interpolation. Half-step convergence is
                      reported above. No oscillation frequency is assigned by an animation timer.
                    </p>
                  </section>
                )}
                {opt && rx && (
                  <>
                    <section className="pn-card">
                      <h2>Solar characterization and filter response</h2>
                      <Chart
                        data={opt.rows.map((r) => ({
                          ...r,
                          measured: r.measured * 1e3,
                          physical: r.physical * 1e3,
                          dark: r.dark * 1e3,
                        }))}
                        lines={[
                          ['dark', 'Dark, with compliance', 'var(--c-b5a9dc)'],
                          ['physical', 'Illuminated noise-free', 'var(--c-8bd8be)'],
                          ['measured', 'Illuminated measured', 'var(--c-edc58c)'],
                        ]}
                        x="Commanded diode voltage (V)"
                        y="Terminal current (mA)"
                      />
                      <Chart
                        data={opt.rows
                          .filter((r) => r.v >= 0 && r.measured <= 0)
                          .map((r) => ({ x: r.v, power: -r.v * r.measured * 1e3 }))}
                        lines={[['power', 'Measured delivered power', 'var(--c-edc58c)']]}
                        x="Actual terminal voltage (V)"
                        y="Power delivered (mW)"
                      />
                      <p>
                        Reference fill factor {fmt(opt.pv.ff === null ? null : opt.pv.ff * 100)}%;
                        measured {fmt(opt.ff === null ? null : opt.ff * 100)}%. Reference
                        monochromatic efficiency{' '}
                        {fmt(opt.pv.efficiency === null ? null : opt.pv.efficiency * 100)}%.
                      </p>
                      <Chart
                        data={opt.filters.map((r) => ({
                          ...r,
                          reference: r.reference * 100,
                          measured: r.measured === null ? null : r.measured * 100,
                        }))}
                        lines={[
                          ['reference', 'External QE reference', 'var(--c-8bd8be)'],
                          ['measured', 'Extracted QE', 'var(--c-edc58c)'],
                        ]}
                        x="Filter wavelength (nm)"
                        y="External quantum efficiency (%)"
                      />
                      <p className="pn-note">
                        EQE = Iph hc/(qλPincident), using independently specified power per filter.
                        This filter reference assumes short-circuit collection and zero series loss;
                        contact-affected solar I–V is treated separately. Si absorption is the
                        explicitly illustrative law from Photonics, with collection 90%, thickness
                        30 µm and J0,300 = 10⁻⁶ A/m². AR comparison changes the assumed reflection,
                        not a thin-film optical calculation.
                      </p>
                    </section>
                    <section className="pn-card bench-scope">
                      <h2>Photodiode receiver · gain versus speed</h2>
                      <Stats
                        items={[
                          ['Receiver capacitance', rx.cap * 1e12, 'pF'],
                          ['RC time constant', rx.tau * 1e6, 'µs'],
                          ['Small-signal IphR expectation', rx.idealAmplitude, 'V'],
                          ['Solved peak output', rx.peak, 'V'],
                        ]}
                      />
                      <Chart
                        data={scopeRows}
                        lines={[
                          ['v1', 'Optical on/off command (0/1)', 'var(--c-b5a9dc)'],
                          ['v0', 'Solved receiver voltage', 'var(--c-8bd8be)'],
                          ['measured', 'Scope reading', 'var(--c-edc58c)'],
                        ]}
                        x="Time (µs)"
                        y="Receiver output (V); command dimensionless"
                      />
                      {!rx.validReverse && (
                        <p className="pn-error">
                          IphR exceeds the 5 V supply. The diode enters forward bias and the solved
                          nonlinear response departs from Vout = IphR. Reduce light or load
                          resistance for the manual’s reverse-biased receiver approximation.
                        </p>
                      )}
                      <p className="pn-note">
                        Manual circuit: diode cathode at +5 V, anode/output to R and ground. C
                        dVout/dt = Iph − Is[exp((Vout−5)/VT)−1] − Vout/R. Backward Euler and a
                        bracketed root solve the nonlinear circuit. The source switches every 5RC,
                        an explicitly chosen test stimulus, not a predicted laser modulation
                        response. C = εA/d + Cscope; carrier transit and diffusion tails are omitted
                        here. This receiver treats scope resistance as infinite; only its input
                        capacitance loads R. The ring and inverter scope instead include 1 MΩ. The
                        ideal current source turns light on/off instantaneously.
                      </p>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <section className="pn-card">
          <h2>Predict before acquiring</h2>
          <h3>
            {
              [
                'Can you separate contact resistance from sheet resistance using only one length?',
                'Will source resistance bias the mobility extracted from the external gate-voltage slope?',
                'Why does the course nMOS inverter consume power with a high input?',
                'If scope capacitance doubles, should the transistor suddenly drive twice the current?',
                'What happens with no initial perturbation, or when the probe loads a ring node directly?',
                'Why can increasing receiver resistance improve signal amplitude while slowing the response?',
              ][tab]
            }
          </h3>
          <textarea
            aria-label="Bench prediction"
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder="Make a prediction, change the setup, then Run acquisition…"
          />
          <button onClick={() => setReveal(!reveal)}>Reveal explanation</button>
          {reveal && (
            <p>
              {
                [
                  'No. R = R□L/W + 2Rc has two unknowns. A geometry series separates the slope from the intercept, provided contacts are comparable across structures.',
                  'Yes. IRs lowers internal VGS and VDS, flattening the measured transfer curve. The extraction assumes negligible contact drops, so the apparent mobility is biased.',
                  'The diode-connected nMOS pull-up and the conducting nMOS pull-down form a DC path. In CMOS the pMOS pull-up turns off at a high input, removing that path apart from leakage.',
                  'No. The same device current must move more charge, so charging takes longer. The circuit calculation includes the new capacitance instead of changing an animation speed.',
                  'An exact deterministic DC equilibrium remains stationary. A stated perturbation starts the unstable mode when sufficient stage gain exists. Direct scope loading changes a node’s capacitance and resistance; a buffer isolates most of that load but adds an extra gate input to the loop.',
                  'Vout ≈ IphR and τ = RC increase together. If Vout approaches the cathode supply, reverse bias is lost and the simple proportional-response assumption breaks down.',
                ][tab]
              }
            </p>
          )}
        </section>
        <details className="pn-card" open={deep}>
          <summary>Models, extraction methods and numerical assumptions</summary>
          <div className="pn-equations">
            Resistor: R = R□L/W + 2Rc; R□,Si = 1/(q μ n tactive)
            <br />
            C′ox = 3.9ε0/tox; β = μC′ox W/L; u = VGS − VT
            <br />
            ID = 0 for u ≤ 0; ID = β(uVDS−VDS²/2) for 0 ≤ VDS &lt; u<br />
            ID = βu²/2 in saturation; circuit-only multiplier 1+λ(VDS−u)
            <br />
            VT,body = VT0 + γ[√(2φF+VSB) − √(2φF)]
            <br />
            VGS,int = VGS − IDRc; VDS,int = VDS − 2IDRc
            <br />
            Linear extraction: μ = mL/(C′oxWVDS); VT = −b/m − VDS/2
            <br />
            √ID extraction: μ = 2m²L/(C′oxW); VT = −b/m
            <br />
            Inverter DC: Iup(Vin,Vout) − Idown(Vin,Vout) − GleakVout = 0<br />
            Transient/ring: Ci dVi/dt = Iup(Vi−1,Vi) − Idown(Vi−1,Vi) − GiVi
            <br />
            Five-stage ring: f ≈ 1/(2Ntp), N = 5; tp = (tpHL+tpLH)/2
          </div>
          <p>
            All calculations use SI: voltages V, currents A, lengths m, capacitance F, mobility
            m²/(V·s), time s. q is positive elementary charge, ε0 vacuum permittivity; n is electron
            density, tactive conducting depth, R□ sheet resistance, Rc resistance of each identical
            terminal contact. μ is chosen channel mobility; C′ox oxide capacitance per area; W,L are
            channel width and length; VT threshold, VSB source–body reverse bias. m,b are
            least-squares slope/intercept in the selected extraction coordinates. OLS uses measured
            voltage values; with voltage noise it is a teaching fit, not a full errors-in-variables
            estimator. A negative fitted contact intercept is retained as measurement error, not
            silently forced to zero.
          </p>
          <p>
            The circuit kernel applies the same charge-sheet physics as Gate Control but has
            separate course bench ranges (up to 10 V, lengths up to 1250 µm for the weak pull-up),
            rather than silently bypassing that module’s smaller device limits. VT0, oxide and
            mobility are assumed, not measured from the attached student reports. CMOS uses |VTp| =
            VTn and μp = 0.4μn. Common p-body nMOS devices include source body effect; pMOS
            source/body are at VDD. Each transistor’s contact current is solved implicitly; the
            internal body bias includes its source-contact drop. No diode breakdown, velocity
            saturation, gate leakage, subthreshold current or self-heating is modeled.
          </p>
          <p>
            For circuits, the pull-down geometry is 250 × 50 µm times the dimension scale. The
            driven input capacitance is C′oxWL; CMOS includes the pMOS gate area with the same L and
            the selected W/L. Extra node capacitance is explicit. nMOS load-gate and junction
            parasitics are omitted. Every node has a chosen 10 GΩ leakage path. An attached scope
            adds 1 MΩ and Cscope. Buffer mode adds the sixth gate’s input capacitance to node 5 and
            solves its output dynamically. Half-size W and L retain β but reduce gate area by four;
            parasitics and the scope do not scale.
          </p>
          <p>
            Transient equations use RK4 with a step based on C divided by a conservative transistor
            conductance scale. The scope receiver uses backward Euler with an implicit bracketed
            diode solve. Step refinement is checked in tests and reported for inverter delays/ring
            frequency. Ring frequency is obtained from late crossings; no frequency is prescribed.
            The exact unperturbed equilibrium is returned as a stationary analytical solution to
            avoid treating floating-point roundoff as physical startup noise. With startup enabled,
            only node 1 is increased by 0.1% VDD. Other nodes start at the solved equilibrium
            (asymmetric for direct scope loading). No noise is injected into the ODE.
          </p>
          <p>
            Noise is independent zero-mean Gaussian per observation, generated deterministically
            from the seed and sample index with a hashed uniform generator and Box–Muller transform.
            Finite resolution rounds to the nearest selected voltage/current increment. Default σI =
            0.2 µA, σV = 1 mV; LSB I = 0.1 µA, V = 1 mV; all are off initially. Voltage-source
            setpoints are ideal; these errors describe digitized readings. Errors are not clipped to
            preserve a plausible-looking extraction. Contact resistance is ohmic; bad rectifying
            contacts or unetched oxide would require different models.
          </p>
          <p>
            Optical characterization reuses Photonics’ monochromatic absorber and ideality-1 diode.
            Spectral filter powers are explicit assumptions, not the laboratory’s unavailable
            calibration file. Solar MPP extraction uses measured sweep samples; reference MPP solves
            the continuous circuit. ISC is the zero-bias sample, VOC linearly interpolates the
            current zero, FF = Pmax/(ISCVOC). Receiver amplitude saturates through the nonlinear
            forward diode when the reverse-bias approximation fails. The optical bench does not
            synthesize the solar simulator’s AM1.5 spectrum.
          </p>
        </details>
        <details className="pn-card">
          <summary>Course sources, discrepancies and verification</summary>
          <p>
            <b>Supplied ECE 308 Measurements, Fall 2025, v6:</b> PDF pp. 4–6, Ti/Ag and n+ resistor
            structures, 50 µm width, length series and voltage ranges; pp. 7–10, MOSFET equations
            and W = 1 mm, L = 25/50/100/200 µm sweeps; pp. 11–14, enhancement-load nMOS inverter,
            W/L ratios and VDD = 10 V; pp. 15–17, five-stage ring, sixth-stage buffer and probe
            loading; pp. 23–24, cell sizes, solar sweeps, compliance and filters; pp. 25–29,
            photodiode polarity and +5 V resistor receiver. <b>Topic 7 — FET circuits 2:</b> PDF
            slides 3–12 (nMOS pull-up, static power and 50% delay), 13–14 (ring and buffer loading),
            17–18 (capacitance and CMOS comparison).
          </p>
          <p>
            <b>Discrepancies:</b> The manual specifies 30 nm Ti / 90 nm Ag and explicitly says to
            ignore an older “Al” label. The fabrication teaching module uses an aluminum flow, so
            this bench does not silently reuse its metal resistivity. The manual’s overview mentions
            CMOS, but its actual fabricated inverter is the diode-connected enhancement-load nMOS
            circuit on p. 12. CMOS here is a separate comparison. The p. 14 instruction to hold Vout
            at 0 V conflicts with measuring a free voltage-transfer characteristic; this bench uses
            a high-impedance output voltmeter. The ring buffer does load the preceding stage’s input
            capacitance: the manual’s 6/5 period correction is approximate, not applied as an exact
            numerical factor. Loaded inverter step tests are an explicit extension of the manual’s
            ring-delay discussion.
          </p>
          <p>
            Validation checks resistor slope/intercept recovery, both mobility/threshold methods,
            reproducible instrument errors, nMOS/CMOS DC limits and KCL, delay scaling and timestep
            convergence, stationary ring equilibrium, oscillation frequency refinement, independent
            inter-stage crossing delays, direct versus buffered loading, solar compliance and
            receiver RC balance/refinement. Reference curves are model predictions, not measurements
            from your wafer.
          </p>
        </details>
        <footer>
          ECE 308 / Virtual measurement bench{' '}
          <span>Reproducible observations · Solved circuits · Explicit instrument loading</span>
        </footer>
      </main>
    </div>
  );
}
