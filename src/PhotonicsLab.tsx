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
import {
  OpticalInput,
  EmitterInput,
  opticalDefault,
  emitterDefault,
  optical,
  absorptionProfile,
  photodiode,
  solar,
  emitter,
  h,
  lightSpeed,
} from './photonics';
import './junction.css';
import './photonics.css';
const fmt = (v: number) =>
  v === 0
    ? '0'
    : Math.abs(v) < 0.001 || Math.abs(v) >= 1e5
      ? v.toExponential(2)
      : Number(v.toPrecision(4)).toString();
function Slider({
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
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(+e.target.value)}
      />
      <small>
        {min}–{max} {unit}
      </small>
    </label>
  );
}
export function Chart({
  data,
  lines,
  x,
  y,
  selected,
  log = false,
  sync,
}: {
  data: object[];
  lines: [string, string, string][];
  x: string;
  y: string;
  selected?: number;
  log?: boolean;
  sync?: string;
}) {
  return (
    <div className="op-plot">
      <p>
        {y}
        {log ? ' · logarithmic' : ''}
      </p>
      <div className="op-chart">
        <ResponsiveContainer>
          <LineChart
            data={data}
            syncId={sync}
            syncMethod="value"
            margin={{ top: 10, right: 24, left: 10, bottom: 28 }}
          >
            <CartesianGrid stroke="var(--c-324856)" strokeDasharray="3 6" />
            <XAxis
              type="number"
              dataKey="x"
              domain={['dataMin', 'dataMax']}
              tickFormatter={fmt}
              tick={{ fill: 'var(--c-acc4d0)', fontSize: 12 }}
              label={{
                value: x,
                position: 'bottom',
                offset: 8,
                fill: 'var(--c-acc4d0)',
                fontSize: 13,
              }}
            />
            <YAxis
              width={76}
              scale={log ? 'log' : 'linear'}
              domain={['auto', 'auto']}
              tickFormatter={fmt}
              tick={{ fill: 'var(--c-acc4d0)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--c-122733)',
                border: '1px solid #496575',
                fontSize: 13,
              }}
              formatter={(v, n) => [fmt(Number(v)), n]}
            />
            {selected !== undefined && (
              <ReferenceLine x={selected} stroke="var(--c-edc58c)" strokeDasharray="4 4" />
            )}
            {lines.map(([key, label, color]) => (
              <Line
                key={key}
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                strokeDasharray={key === 'load' ? '5 5' : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="pn-legend">
        {lines.map(([key, label, color]) => (
          <span key={key} style={{ color }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
function save(name: string, text: string) {
  const u = URL.createObjectURL(new Blob([text], { type: 'text/csv' })),
    a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
const names = ['Absorption & generation', 'Photodiode', 'Solar cell', 'LED & laser'];
export default function PhotonicsLab() {
  const [c, setC] = useLinkedState<OpticalInput>('', { ...opticalDefault }),
    [e, setE] = useLinkedState<EmitterInput>('led.', { ...emitterDefault }),
    [part, setPart] = useLinkedState('part', 0),
    [deep, setDeep] = useState(false),
    [animate, setAnimate] = useState(false),
    [time, setTime] = useState(0),
    [prediction, setPrediction] = useState(''),
    [reveal, setReveal] = useState(false);
  const set = <K extends keyof OpticalInput>(key: K, v: OpticalInput[K]) =>
    setC((old) => ({ ...old, [key]: v }));
  const setLED = <K extends keyof EmitterInput>(key: K, v: EmitterInput[K]) => {
    setE((old) => ({ ...old, [key]: v }));
    setTime(0);
    setAnimate(false);
  };
  const reset = () => {
    setC({ ...opticalDefault });
    setE({ ...emitterDefault });
    setTime(0);
    setAnimate(false);
  };
  useEffect(() => {
    if (!animate) return;
    const id = setInterval(
      () =>
        setTime((t) => {
          if (t >= 4.96) {
            setAnimate(false);
            return 5;
          }
          return t + 0.04;
        }),
      50,
    );
    return () => clearInterval(id);
  }, [animate]);
  useEffect(() => {
    const stop = () => {
      if (document.hidden) setAnimate(false);
    };
    document.addEventListener('visibilitychange', stop);
    return () => document.removeEventListener('visibilitychange', stop);
  }, []);
  const model = useMemo(() => {
    try {
      return { a: optical(c), pd: photodiode(c), pv: solar(c), led: emitter(c, e), error: '' };
    } catch (err) {
      return { a: null, pd: null, pv: null, led: null, error: String(err) };
    }
  }, [c, e]);
  const { a, pd, pv, led } = model;
  const profile = useMemo(
    () =>
      a
        ? absorptionProfile(c).map((r) => ({
            ...r,
            x: r.x * 1e6,
            positiveGeneration: r.generation > 0 ? r.generation : null,
          }))
        : [],
    [c, a],
  );
  const spectral = useMemo(
    () =>
      Array.from({ length: 131 }, (_, i) => {
        const wavelength = (300 + i * 10) * 1e-9;
        const z = optical({ ...c, wavelength });
        return { x: wavelength * 1e9, energy: z.ev, alpha: z.alpha > 0 ? z.alpha / 100 : null };
      }),
    [c],
  );
  const pvRows = useMemo(
    () =>
      pv
        ? [
            ...new Set([
              ...Array.from({ length: 121 }, (_, i) => pv.voc * (i / 120)),
              pv.operating.v,
              pv.mpp.v,
            ]),
          ]
            .sort((a, b) => a - b)
            .map((v) => {
              const r = pv.at(v);
              return { x: v, i: r.i * 1e3, p: r.power * 1e3, load: (v / c.load) * 1e3 };
            })
        : [],
    [pv, c.load],
  );
  const pdRows = useMemo(() => {
    if (!a) return [];
    const end = Math.min(a.gap * 0.85, a.vt * Math.log1p(Math.max(a.iph * 3, 1e-8) / a.is));
    return [
      ...Array.from({ length: 101 }, (_, i) => -10 + i / 10),
      ...Array.from({ length: 100 }, (_, i) => (end * (i + 1)) / 100),
    ].map((v) => {
      const dark = a.is * Math.expm1(v / a.vt);
      return { x: v, dark: dark * 1e3, light: (dark - a.iph) * 1e3 };
    });
  }, [a]);
  const ledRows = useMemo(
    () =>
      led
        ? Array.from({ length: 101 }, (_, i) => {
            const current = i * 0.001,
              z = emitter(c, { ...e, current });
            return { x: current * 1e3, optical: z.output * 1e3, electrical: z.electrical * 1e3 };
          })
        : [],
    [led, c, e],
  );
  return (
    <div className="pn-lab op-lab">
      <header>
        <a className="brand" href="#photonics">
          <span className="brandmark">hν</span>
          <span>
            Silicon Atlas<span className="brand-sub">Electronic → photonic devices</span>
          </span>
        </a>
        <button onClick={reset} title="Restore this module's tested default settings">
          Reset module
        </button>
      </header>
      <main>
        <div className="pn-hero">
          <span className="eyebrow">Neamen / Chapter 14 + optoelectronics lectures</span>
          <h1>
            From photons to current.
            <br />
            From current to light.
          </h1>
          <p>
            Follow one photon budget through absorption, detection and power generation. Then
            reverse the conversion with an emitter.
          </p>
          <div className="pn-actions">
            {names.map((v, i) => (
              <button
                key={v}
                className={part === i ? 'selected' : ''}
                onClick={() => {
                  setPart(i);
                  setReveal(false);
                  setAnimate(false);
                }}
              >
                {i + 1} / {v}
              </button>
            ))}
            <button
              className={deep ? 'selected' : ''}
              aria-pressed={deep}
              onClick={() => setDeep(!deep)}
            >
              Deeper physics
            </button>
          </div>
        </div>
        <div className="pn-layout">
          <aside className="pn-card pn-controls">
            <h2>{part === 3 ? 'Emitter material' : 'Shared optical input'}</h2>
            <div className="pn-actions">
              {(['Si', 'GaAs'] as const).map((m) => (
                <button
                  key={m}
                  className={c.material === m ? 'selected' : ''}
                  onClick={() => {
                    set('material', m);
                    setLED('tauRad', m === 'Si' ? 1e-3 : 10e-9);
                  }}
                >
                  {m} · {m === 'Si' ? 'indirect' : 'direct'}
                </button>
              ))}
            </div>
            <p className="pn-note">
              Fixed reference gaps (Neamen Table B.4): Si 1.12 eV; GaAs 1.42 eV. Absorption and
              lifetime presets are illustrative, not calibrated material datasets.
            </p>
            {part !== 3 ? (
              <>
                <Slider
                  label="Monochromatic wavelength"
                  value={c.wavelength * 1e9}
                  min={300}
                  max={1600}
                  step={5}
                  unit="nm"
                  set={(v) => set('wavelength', v * 1e-9)}
                />
                <Slider
                  label="Incident irradiance"
                  value={c.irradiance}
                  min={0}
                  max={2000}
                  step={10}
                  unit="W/m²"
                  set={(v) => set('irradiance', v)}
                />
                <Slider
                  label="Active absorber thickness"
                  value={c.thickness * 1e6}
                  min={0.5}
                  max={200}
                  step={0.5}
                  unit="µm"
                  set={(v) => set('thickness', v * 1e-6)}
                />
                <Slider
                  label="log₁₀ illuminated area [mm²]"
                  value={Math.log10(c.area * 1e6)}
                  min={-3}
                  max={1}
                  step={0.1}
                  unit=""
                  set={(v) => set('area', 10 ** v * 1e-6)}
                />
                <Slider
                  label="Front reflection"
                  value={c.reflection * 100}
                  min={0}
                  max={90}
                  step={1}
                  unit="%"
                  set={(v) => set('reflection', v / 100)}
                />
                <Slider
                  label="Assumed collection efficiency"
                  value={c.collection * 100}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  set={(v) => set('collection', v / 100)}
                />
                <label className="op-check">
                  <input
                    type="checkbox"
                    checked={c.alphaOverride}
                    onChange={(ev) => set('alphaOverride', ev.target.checked)}
                  />{' '}
                  Override illustrative absorption curve
                </label>
                {c.alphaOverride && (
                  <Slider
                    label="log₁₀ chosen α [m⁻¹]"
                    value={Math.log10(c.alpha)}
                    min={2}
                    max={7}
                    step={0.1}
                    unit=""
                    set={(v) => set('alpha', 10 ** v)}
                  />
                )}
                <p className="pn-note">
                  Below Eg, interband α is zero even with override. No defect, free-carrier or
                  multiphoton absorption. Reflection and collection are independent assumed
                  constants.
                </p>
                {part > 0 && (
                  <>
                    <h3>Electrical conditions</h3>
                    <Slider
                      label="Temperature"
                      value={c.temperature}
                      min={280}
                      max={400}
                      step={5}
                      unit="K"
                      set={(v) => set('temperature', v)}
                    />
                    <Slider
                      label="log₁₀ assumed J0 at 300 K [A/m²]"
                      value={Math.log10(c.j0300)}
                      min={-10}
                      max={-2}
                      step={0.2}
                      unit=""
                      set={(v) => set('j0300', 10 ** v)}
                    />
                    <p className="pn-note">
                      J0 is an explicit compact-model parameter. Fixed-gap T³ exp(−Eg/kBT) scaling
                      is used; it is not a measured device fit.
                    </p>
                  </>
                )}
                {part === 1 && (
                  <>
                    <Slider
                      label="Reverse bias magnitude"
                      value={c.reverse}
                      min={0}
                      max={10}
                      step={0.1}
                      unit="V"
                      set={(v) => set('reverse', v)}
                    />
                    <Slider
                      label="Readout resistance"
                      value={c.readout}
                      min={10}
                      max={1000}
                      step={10}
                      unit="Ω"
                      set={(v) => set('readout', v)}
                    />
                    <Slider
                      label="Parasitic capacitance"
                      value={c.parasitic * 1e12}
                      min={0}
                      max={20}
                      step={0.1}
                      unit="pF"
                      set={(v) => set('parasitic', v * 1e-12)}
                    />
                  </>
                )}
                {part === 2 && (
                  <>
                    <Slider
                      label="log₁₀ load resistance [Ω]"
                      value={Math.log10(c.load)}
                      min={1}
                      max={7}
                      step={0.1}
                      unit=""
                      set={(v) => set('load', 10 ** v)}
                    />
                    <label className="op-check">
                      <input
                        type="checkbox"
                        checked={c.series}
                        onChange={(ev) => set('series', ev.target.checked)}
                      />{' '}
                      Series resistance
                    </label>
                    {c.series && (
                      <Slider
                        label="Series resistance Rs"
                        value={c.rs}
                        min={0}
                        max={1000}
                        step={5}
                        unit="Ω"
                        set={(v) => set('rs', v)}
                      />
                    )}
                    <label className="op-check">
                      <input
                        type="checkbox"
                        checked={c.shunt}
                        onChange={(ev) => set('shunt', ev.target.checked)}
                      />{' '}
                      Shunt leakage
                    </label>
                    {c.shunt && (
                      <Slider
                        label="log₁₀ shunt resistance [Ω]"
                        value={Math.log10(c.rsh)}
                        min={2}
                        max={7}
                        step={0.1}
                        unit=""
                        set={(v) => set('rsh', 10 ** v)}
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Slider
                  label="LED injection current"
                  value={e.current * 1e3}
                  min={0}
                  max={100}
                  step={1}
                  unit="mA"
                  set={(v) => setLED('current', v * 1e-3)}
                />
                <Slider
                  label="log₁₀ radiative lifetime [s]"
                  value={Math.log10(e.tauRad)}
                  min={-9}
                  max={-2}
                  step={0.1}
                  unit=""
                  set={(v) => setLED('tauRad', 10 ** v)}
                />
                <Slider
                  label="log₁₀ nonradiative lifetime [s]"
                  value={Math.log10(e.tauNonrad)}
                  min={-9}
                  max={-2}
                  step={0.1}
                  unit=""
                  set={(v) => setLED('tauNonrad', 10 ** v)}
                />
                <Slider
                  label="Injection efficiency"
                  value={e.injection * 100}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  set={(v) => setLED('injection', v / 100)}
                />
                <Slider
                  label="Extraction efficiency"
                  value={e.extraction * 100}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  set={(v) => setLED('extraction', v / 100)}
                />
                <Slider
                  label="LED series resistance"
                  value={e.resistance}
                  min={0}
                  max={100}
                  step={1}
                  unit="Ω"
                  set={(v) => setLED('resistance', v)}
                />
                <p className="pn-note">
                  The Si/GaAs buttons choose illustrative τr = 1 ms / 10 ns, with adjustable losses.
                  These are teaching examples, not material lifetime data.
                </p>
              </>
            )}
          </aside>
          <div className="pn-main">
            {model.error && (
              <section role="alert" className="pn-card pn-error">
                {model.error}
              </section>
            )}
            {a && pd && pv && led && (
              <>
                <section className="pn-card">
                  <div className="op-kicker">
                    <span className="eyebrow">
                      Experiment {part + 1} / {names[part]}
                    </span>
                    <span className="op-badge">
                      {part === 3
                        ? 'Lumped rate balance'
                        : a.alpha === 0
                          ? 'Below interband edge'
                          : 'Monochromatic source'}
                    </span>
                  </div>
                  <h2>
                    {
                      [
                        'Where does the photon go?',
                        'Collect a pair. Measure a current.',
                        'A diode that delivers power.',
                        'Competition between light and heat.',
                      ][part]
                    }
                  </h2>
                  <div className="pn-metrics">
                    {(part === 0
                      ? [
                          ['Photon energy', a.ev, 'eV'],
                          ['Bandgap', a.gap, 'eV'],
                          ['Incident photon flux', a.flux, 'm⁻²s⁻¹'],
                          ['Illustrative α', a.alpha / 100, 'cm⁻¹'],
                          ['Single-pass absorption', a.absorption * 100, '%'],
                          ['Incident optical power', a.pin * 1e3, 'mW'],
                        ]
                      : part === 1
                        ? [
                            ['External QE', a.eta * 100, '%'],
                            ['Responsivity', a.responsivity, 'A/W'],
                            ['Photocurrent magnitude', a.iph * 1e3, 'mA'],
                            ['Signed terminal current', pd.current * 1e3, 'mA'],
                            ['Junction capacitance', pd.cj * 1e12, 'pF'],
                            [
                              'Combined bandwidth',
                              pd.bandwidthValid ? pd.bandwidth / 1e6 : NaN,
                              'MHz',
                            ],
                          ]
                        : part === 2
                          ? [
                              ['Short-circuit ISC', pv.isc * 1e3, 'mA'],
                              ['Open-circuit VOC', pv.voc, 'V'],
                              ['Maximum power', pv.mpp.power * 1e3, 'mW'],
                              ['Fill factor', pv.ff === null ? NaN : pv.ff * 100, '%'],
                              [
                                'Monochromatic efficiency',
                                pv.efficiency === null ? NaN : pv.efficiency * 100,
                                '%',
                              ],
                              ['Load operating voltage', pv.operating.v, 'V'],
                            ]
                          : [
                              ['Radiative / internal QE', led.iqe * 100, '%'],
                              ['External photons / electron', led.eqe * 100, '%'],
                              ['Optical output', led.output * 1e3, 'mW'],
                              ['Electrical input', led.electrical * 1e3, 'mW'],
                              [
                                'Wall-plug efficiency',
                                led.wall === null ? NaN : led.wall * 100,
                                '%',
                              ],
                              ['Assumed emission wavelength', led.wavelength * 1e9, 'nm'],
                            ]
                    ).map(([label, value, unit]) => (
                      <div key={String(label)}>
                        <span>{label}</span>
                        <b>
                          {Number.isFinite(Number(value)) ? fmt(Number(value)) : '—'}{' '}
                          <small>{unit}</small>
                        </b>
                      </div>
                    ))}
                  </div>
                  {part < 3 ? (
                    <svg
                      className="op-device"
                      viewBox="0 0 880 240"
                      role="img"
                      aria-label="Illuminated semiconductor with photon absorption and electron hole collection"
                    >
                      <defs>
                        <linearGradient id="op-depth">
                          <stop stopColor="var(--c-3b857c)" />
                          <stop offset="1" stopColor="var(--c-243b50)" />
                        </linearGradient>
                        <marker
                          id="op-arrow"
                          markerWidth="7"
                          markerHeight="7"
                          refX="6"
                          refY="3.5"
                          orient="auto"
                        >
                          <path d="M0 0 L7 3.5 L0 7 Z" fill="var(--c-edc58c)" />
                        </marker>
                      </defs>
                      <rect x="190" y="65" width="550" height="100" rx="7" fill="url(#op-depth)" />
                      <rect x="190" y="65" width="20" height="100" fill="var(--c-ad6984)" />
                      <rect x="720" y="65" width="20" height="100" fill="var(--c-7890b0)" />
                      <text x="30" y="45">
                        {fmt(c.wavelength * 1e9)} nm
                      </text>
                      <path
                        d="M30 105 L170 105"
                        stroke="var(--c-edc58c)"
                        strokeWidth="4"
                        markerEnd="url(#op-arrow)"
                      />
                      <text x="30" y="142">
                        hν = {fmt(a.ev)} eV
                      </text>
                      <text x="260" y="45">
                        p contact
                      </text>
                      <text x="615" y="45">
                        n contact
                      </text>
                      <text x="300" y="102">
                        {a.alpha > 0 ? 'e⁻ → n' : 'No interband pairs'}
                      </text>
                      <text x="300" y="135">
                        {a.alpha > 0 ? 'p ← h⁺' : 'Photon transmitted'}
                      </text>
                      <text x="570" y="120">
                        {fmt(a.absorption * 100)}% absorbed
                      </text>
                      <path
                        d="M750 105 L845 105"
                        stroke="var(--c-edc58c)"
                        strokeWidth="2"
                        markerEnd="url(#op-arrow)"
                      />
                      <text x="190" y="198">
                        Conceptual geometry · arrows show particle collection, not electron
                        conventional current
                      </text>
                      <text x="190" y="223">
                        Field points n → p; electron drift is opposite the field; hole drift is
                        along it.
                      </text>
                    </svg>
                  ) : (
                    <svg
                      className="op-device"
                      viewBox="0 0 880 245"
                      role="img"
                      aria-label="LED energy-conversion diagram with radiative and nonradiative recombination"
                    >
                      <rect x="55" y="70" width="210" height="100" fill="var(--c-37516c)" rx="8" />
                      <rect x="330" y="70" width="210" height="100" fill="var(--c-286455)" rx="8" />
                      <rect x="620" y="70" width="210" height="100" fill="var(--c-755743)" rx="8" />
                      <text x="80" y="110">
                        Injected pairs
                      </text>
                      <text x="80" y="142">
                        ηinj I / q
                      </text>
                      <text x="350" y="110">
                        Radiative: N / τr
                      </text>
                      <text x="350" y="142">
                        Extraction: ηout
                      </text>
                      <text x="640" y="110">
                        Nonradiative loss
                      </text>
                      <text x="640" y="142">
                        N / τnr → heat
                      </text>
                      <path
                        d="M265 120 L330 120 M540 120 L620 120"
                        stroke="var(--c-b6c9d4)"
                        strokeWidth="2"
                      />
                      <text x="55" y="210">
                        Conceptual conversion paths · emission assumed monochromatic at Eg; no
                        linewidth predicted
                      </text>
                    </svg>
                  )}
                  <div className="pn-explain">
                    <h3>What changed and why?</h3>
                    <p>
                      {part === 0
                        ? `At ${fmt(a.ev)} eV, the photon is ${a.ev > a.gap ? 'above' : 'below'} the ${a.gap} eV gap. Increasing thickness increases absorbed photon count but does not increase each photon’s energy. The illustrative ${a.direct ? 'direct' : 'indirect'} absorption law is not a fitted ${c.material} spectrum.`
                        : part === 1
                          ? `Absorption efficiency (${fmt(a.absorption * 100)}% after entry) and assumed collection (${fmt(c.collection * 100)}%) are distinct. External QE also includes front reflection. Reverse bias changes the transit estimate, but collection stays at the user’s assumed value; this is not a solved transport model.`
                          : part === 2
                            ? `Illumination shifts the diode current. Temperature changes the assumed dark saturation current and thermal voltage. Maximum power occurs between short circuit and open circuit; the selected resistor delivers ${fmt(pv.operating.power * 1e3)} mW, compared with ${fmt(pv.mpp.power * 1e3)} mW at MPP.`
                            : `Radiative and nonradiative channels compete for the same injected population. Longer nonradiative lifetime raises IQE; extraction changes external output without changing the internal branching ratio. Electrical power also includes a chosen 0.2 V overhead and I²Rs loss.`}
                    </p>
                  </div>
                </section>
                {part === 0 && (
                  <>
                    <section className="pn-card">
                      <h2>Photon energy and absorption edge</h2>
                      <Chart
                        data={spectral}
                        lines={[['energy', 'Photon energy', 'var(--c-edc58c)']]}
                        x="Wavelength (nm)"
                        y="Photon energy (eV)"
                        selected={c.wavelength * 1e9}
                      />
                      <Chart
                        data={spectral}
                        lines={[['alpha', 'Illustrative α, not measured data', 'var(--c-8bd8be)']]}
                        x="Wavelength (nm)"
                        y="Absorption coefficient (cm⁻¹)"
                        log
                        selected={c.wavelength * 1e9}
                      />
                      <p className="pn-note">
                        Direct transitions approximately conserve electron wavevector without a
                        phonon; indirect transitions require a phonon for momentum balance. The toy
                        α(E) uses a sharp gap cutoff and omits phonon sidebands, excitons and
                        temperature-dependent edge shifts. Zero α is omitted from the logarithmic
                        axis.
                      </p>
                      <svg
                        className="op-bands"
                        viewBox="0 0 850 180"
                        role="img"
                        aria-label="Schematic direct and indirect energy versus wavevector transitions"
                      >
                        <path
                          d="M60 30 Q180 90 300 30 M60 150 Q180 90 300 150 M480 30 Q600 90 720 30 M380 150 Q500 90 620 150"
                          fill="none"
                          stroke="var(--c-92cbb9)"
                          strokeWidth="3"
                        />
                        <path
                          d="M180 120 L180 60 M500 120 L500 60 L600 60"
                          fill="none"
                          stroke="var(--c-efc381)"
                          strokeWidth="2"
                        />
                        <text x="70" y="165">
                          Direct: photon · same k
                        </text>
                        <text x="430" y="165">
                          Indirect: photon + phonon · Δk
                        </text>
                        <text x="10" y="25">
                          E
                        </text>
                        <text x="780" y="140">
                          k →
                        </text>
                      </svg>
                      <p className="pn-note">
                        Conceptual E(k) sketches, not energy-versus-position or calculated Si/GaAs
                        bands.
                      </p>
                    </section>
                    <section className="pn-card">
                      <h2>Beer–Lambert generation through the absorber</h2>
                      <Chart
                        data={profile}
                        lines={[['intensity', 'Optical intensity', 'var(--c-edc58c)']]}
                        x="Depth (µm)"
                        y="Intensity (W/m²)"
                        sync="op-depth"
                      />
                      {a.alpha > 0 && c.irradiance > 0 ? (
                        <Chart
                          data={profile}
                          lines={[['positiveGeneration', 'Pair generation G', 'var(--c-8bd8be)']]}
                          x="Depth (µm)"
                          y="Generation (m⁻³s⁻¹)"
                          log
                          sync="op-depth"
                        />
                      ) : (
                        <p>G(x) = 0 throughout the absorber; zero is not plotted on a log axis.</p>
                      )}
                      <button
                        onClick={() =>
                          save(
                            'photon-generation-SI.csv',
                            'depth_m,intensity_W_m2,photon_flux_m-2_s-1,generation_m-3_s-1\n' +
                              absorptionProfile(c)
                                .map((r) => [r.x, r.intensity, r.flux, r.generation].join(','))
                                .join('\n'),
                          )
                        }
                      >
                        ↓ Generation CSV
                      </button>
                      <p className="pn-note">
                        One pair per absorbed above-gap photon, no gain. G = αI/Eγ with Eγ in
                        joules. A∫G dx = Pabsorbed/Eγ. Excess photon energy above Eg becomes
                        thermalization loss, not extra pairs.
                      </p>
                    </section>
                  </>
                )}
                {part === 1 && (
                  <>
                    <section className="pn-card">
                      <h2>Dark and illuminated I–V</h2>
                      <Chart
                        data={pdRows}
                        lines={[
                          ['dark', 'Dark current', 'var(--c-c3b1e8)'],
                          ['light', 'Illuminated current', 'var(--c-8bd8be)'],
                        ]}
                        x="Diode voltage, forward positive (V)"
                        y="Conventional terminal current (mA)"
                        selected={-c.reverse}
                      />
                      <p className="pn-note">
                        I = Is[exp(V/VT) − 1] − Iph. Collected electrons go to n, holes to p; their
                        conventional contributions both produce reverse photocurrent. The ideal
                        signal current is flat with reverse bias because ηcollection is prescribed.
                        The forward branch is a compact reference, not a high-injection solution. No
                        avalanche gain or breakdown is predicted.
                      </p>
                    </section>
                    <section className="pn-card">
                      <h2>Absorption–speed tradeoff</h2>
                      <div className="pn-metrics">
                        {[
                          ['Assumed mean field', pd.field, 'V/m'],
                          ['Effective drift velocity', pd.velocity, 'm/s'],
                          ['Transit time', pd.transit * 1e9, 'ns'],
                          ['Transit bandwidth', pd.ft / 1e6, 'MHz'],
                          ['RC bandwidth', pd.frc / 1e6, 'MHz'],
                          ['Combined estimate', pd.bandwidth / 1e6, 'MHz'],
                        ].map(([n, v, u]) => (
                          <div key={String(n)}>
                            <span>{n}</span>
                            <b>
                              {fmt(Number(v))} <small>{u}</small>
                            </b>
                          </div>
                        ))}
                      </div>
                      {!pd.bandwidthValid && (
                        <p role="alert" className="pn-error">
                          The assumed mean field exceeds 10 MV/m. Bandwidth estimates are outside
                          the teaching range; no breakdown or high-field transport solution is
                          available.
                        </p>
                      )}
                      <p className="pn-note">
                        A fully depleted PIN slab is assumed at every selected bias. Thickness d is
                        both the optical path and drift distance; depletion width is not solved. E =
                        (0.7 V + VR)/d uses a chosen built-in voltage, not a universal material
                        value. Chosen effective slower-carrier parameters μ = 0.05 m²/(V·s), vsat =
                        10⁵ m/s give v = μE/(1+μE/vsat). Transit f ≈ 0.45v/d; RC f = 1/[2πR(Cj+Cp)],
                        Cj = εA/d. Their inverse-square bandwidth combination is an estimate, not an
                        exact transfer function. Diffusion tails and circuit amplification are
                        excluded.
                      </p>
                    </section>
                  </>
                )}
                {part === 2 && (
                  <>
                    <section className="pn-card">
                      <h2>Power-generating quadrant and load line</h2>
                      <Chart
                        data={pvRows.map((r) => ({
                          ...r,
                          load: r.load <= pv.isc * 1e3 * 1.2 ? r.load : null,
                        }))}
                        lines={[
                          ['i', 'Delivered current', 'var(--c-8bd8be)'],
                          ['load', 'Load I = V/R', 'var(--c-d5b2ed)'],
                        ]}
                        x="Terminal voltage (V)"
                        y="Current delivered to load (mA)"
                        selected={pv.operating.v}
                      />
                      <Chart
                        data={pvRows}
                        lines={[['p', 'Electrical output power', 'var(--c-edc58c)']]}
                        x="Terminal voltage (V)"
                        y="Power (mW)"
                        selected={pv.mpp.v}
                      />
                      <p>
                        MPP: {fmt(pv.mpp.v)} V × {fmt(pv.mpp.i * 1e3)} mA. Matching load ≈{' '}
                        {pv.mpp.i > 0 ? fmt(pv.mpp.v / pv.mpp.i) : 'undefined'} Ω. Selected load:{' '}
                        {fmt(pv.operating.v)} V, {fmt(pv.operating.i * 1e3)} mA.
                      </p>
                      <p className="pn-note">
                        The load line is displayed only up to 1.2 ISC to keep the cell curve
                        readable; its intersection is included explicitly. Positive I here means
                        power delivered from the cell, opposite the photodiode terminal-current
                        convention. The entire incident beam is monochromatic at{' '}
                        {fmt(c.wavelength * 1e9)} nm. “1000 W/m²” specifies intensity only, not
                        AM1.5. FF is undefined in darkness; efficiency is undefined at zero incident
                        power.
                      </p>
                      <button
                        onClick={() =>
                          save(
                            'monochromatic-solar-SI.csv',
                            'voltage_V,current_A,power_W,load_line_A\n' +
                              pvRows
                                .map((r) => [r.x, r.i / 1e3, r.p / 1e3, r.load / 1e3].join(','))
                                .join('\n'),
                          )
                        }
                      >
                        ↓ Solar I–V CSV
                      </button>
                    </section>
                    <section className="pn-card">
                      <h2>Every incident watt is accounted for</h2>
                      <div className="op-budget">
                        {[
                          ['Reflected', pv.reflected],
                          ['Transmitted', pv.transmitted],
                          ['Above-gap thermalization', pv.thermal],
                          ['Uncollected pair energy', pv.uncollected],
                          ['Collected-carrier voltage loss', pv.collectedThermal],
                          ['Diode branch', pv.diodeLoss],
                          ['Shunt loss', pv.shuntLoss],
                          ['Series loss', pv.seriesLoss],
                          ['Useful maximum power', pv.mpp.power],
                        ].map(([label, v]) => (
                          <div key={String(label)}>
                            <span>{label}</span>
                            <i
                              style={{ width: `${pv.pin > 0 ? (100 * Number(v)) / pv.pin : 0}%` }}
                            />
                            <b>{fmt(Number(v) * 1e3)} mW</b>
                          </div>
                        ))}
                      </div>
                      <p className="pn-note">
                        Budget evaluated at MPP. “Diode branch” is electrical energy diverted to the
                        model’s forward diode; it does not distinguish radiative re-emission from
                        heat. Residual = {fmt(pv.balance)} W; circuit residual ={' '}
                        {fmt(pv.mpp.residual)} V. Power-limit violations are exposed, never clamped
                        to 100% efficiency.
                      </p>
                    </section>
                  </>
                )}
                {part === 3 && (
                  <>
                    <section className="pn-card">
                      <h2>Steady recombination and LED turn-on</h2>
                      <p>
                        Injected pairs: {fmt(led.supply)} s⁻¹. Radiative: {fmt(led.radiative)} s⁻¹;
                        nonradiative: {fmt(led.nonradiative)} s⁻¹. Rate-balance residual:{' '}
                        {fmt(led.balance)} s⁻¹.
                      </p>
                      <Chart
                        data={ledRows}
                        lines={[
                          ['optical', 'External optical power', 'var(--c-8bd8be)'],
                          ['electrical', 'Electrical input', 'var(--c-edc58c)'],
                        ]}
                        x="Injection current (mA)"
                        y="Power (mW)"
                        selected={e.current * 1e3}
                      />
                      <div className="pn-actions">
                        <button
                          onClick={() => {
                            setTime(0);
                            setAnimate(true);
                          }}
                        >
                          Play LED turn-on
                        </button>
                        <button
                          onClick={() => {
                            setAnimate(false);
                            setTime(0);
                          }}
                        >
                          Reset animation
                        </button>
                      </div>
                      <Slider
                        label="Normalized turn-on time"
                        value={time}
                        min={0}
                        max={5}
                        step={0.01}
                        unit="τeff"
                        set={(v) => {
                          setAnimate(false);
                          setTime(v);
                        }}
                      />
                      <div className="op-turnon">
                        <i style={{ width: `${100 * -Math.expm1(-time)}%` }} />
                        <span>
                          {fmt(-Math.expm1(-time) * led.output * 1e3)} mW at t ={' '}
                          {fmt(time * led.tau * 1e9)} ns
                        </span>
                      </div>
                      <p className="pn-note">
                        Exact first-order population step: N(t) = N∞[1−exp(−t/τeff)]. Playback
                        stretches time; bar length shows the calculated fraction of steady output,
                        not photon trajectories or perceived brightness. Constant lifetimes omit
                        density-dependent Bnp, Auger droop and thermal feedback. Optical power uses
                        an assumed monochromatic emission line Eemit = Eg (no line broadening or
                        spectrum prediction). Laser controls below do not modify this LED power
                        curve.
                      </p>
                    </section>
                    <section className="pn-card">
                      <h2>Introductory laser: gain must exceed cavity loss</h2>
                      <svg
                        className="op-device"
                        viewBox="0 0 850 150"
                        role="img"
                        aria-label="Conceptual laser cavity with two mirrors, active region and output"
                      >
                        <rect
                          x="100"
                          y="40"
                          width="600"
                          height="65"
                          rx="7"
                          fill="var(--c-2b5e59)"
                        />
                        <rect x="90" y="25" width="10" height="95" fill="var(--c-adc9db)" />
                        <rect x="700" y="25" width="10" height="95" fill="var(--c-adc9db)" />
                        <path
                          d="M140 72 L660 72 M710 72 L820 72"
                          stroke="var(--c-edc58c)"
                          strokeWidth="3"
                        />
                        <text x="130" y="60">
                          Active medium · stimulated emission reinforces the optical mode
                        </text>
                        <text x="70" y="145">
                          R₁ = 0.9
                        </text>
                        <text x="580" y="145">
                          R₂ variable · output coupling
                        </text>
                      </svg>
                      <Slider
                        label="Imposed material gain"
                        value={e.gain / 100}
                        min={0}
                        max={200}
                        step={1}
                        unit="cm⁻¹"
                        set={(v) => setLED('gain', v * 100)}
                      />
                      <Slider
                        label="Output mirror intensity reflectivity"
                        value={e.mirror * 100}
                        min={5}
                        max={95}
                        step={1}
                        unit="%"
                        set={(v) => setLED('mirror', v / 100)}
                      />
                      <div className="pn-metrics">
                        <div>
                          <span>Calculated gain threshold</span>
                          <b>
                            {fmt(led.threshold / 100)} <small>cm⁻¹</small>
                          </b>
                        </div>
                        <div>
                          <span>Round-trip intensity multiplier</span>
                          <b>
                            {fmt(led.roundTrip)} <small>×</small>
                          </b>
                        </div>
                        <div>
                          <span>Linear cavity criterion</span>
                          <b>{led.roundTrip >= 1 ? 'Gain ≥ loss' : 'Below threshold'}</b>
                        </div>
                      </div>
                      <p>
                        Spontaneous emission seeds photons with uncorrelated phases. Stimulated
                        emission adds photons to an occupied optical mode. Feedback and net modal
                        gain enable laser oscillation; population inversion is necessary but must
                        also overcome loss.
                      </p>
                      <p className="pn-note">
                        Illustrative Fabry–Pérot cavity: length 300 µm, confinement Γ = 0.3,
                        internal intensity loss αi = 10 cm⁻¹, R₁ = 0.9. gth = [αi +
                        ln(1/R₁R₂)/(2L)]/Γ. Gain is imposed, not derived from LED current or carrier
                        density. Above threshold the linear multiplier cannot predict unbounded
                        power: gain saturation is required. No laser rate-equation output,
                        linewidth, longitudinal spectrum or threshold current is claimed. The
                        sketch’s single path is conceptual; lasing wavelength would require a gain
                        spectrum and resonance model.
                      </p>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <section className="pn-card">
          <h2>Predict, change, explain</h2>
          <h3>
            {
              [
                'If thickness doubles, do absorbed photon count and photon energy both double?',
                'Can two detectors with identical absorption have different responsivity?',
                'Does the resistor that draws the most current also receive the most power?',
                'Does raising extraction efficiency change the internal radiative branching ratio?',
              ][part]
            }
          </h3>
          <textarea
            aria-label="Photonics prediction"
            value={prediction}
            onChange={(ev) => setPrediction(ev.target.value)}
            placeholder="Make a prediction, then use the controls above…"
          />
          <div className="pn-actions">
            <button onClick={() => setReveal(!reveal)}>Reveal explanation</button>
            <button
              onClick={() => {
                reset();
                if (part === 0) setC({ ...opticalDefault, thickness: 60e-6 });
                if (part === 1) setC({ ...opticalDefault, collection: 0.45 });
                if (part === 2) setC({ ...opticalDefault, load: 10 });
                if (part === 3) {
                  setC({ ...opticalDefault, material: 'GaAs' });
                  setE({ ...emitterDefault, tauRad: 10e-9, extraction: 0.5 });
                }
              }}
            >
              Apply experiment preset
            </button>
          </div>
          {reveal && (
            <p>
              {
                [
                  'Absorption follows 1−exp(−αd) and saturates. Photon energy hc/λ is unchanged; doubling thickness does not double the energy of each photon.',
                  'Yes. Collection losses and front reflection reduce external QE. Responsivity is ηqλ/(hc), and η includes absorption and collection separately.',
                  'No. A short circuit can carry ISC but delivers zero terminal power. A very large load approaches VOC with nearly zero current. MPP lies between them.',
                  'No in this model. Extraction multiplies external output after the radiative event; IQE remains τnr/(τr+τnr). Real photon recycling can couple these processes, but it is excluded here.',
                ][part]
              }
            </p>
          )}
        </section>
        <details className="pn-card" open={deep}>
          <summary>Equations, symbols and validity</summary>
          <div className="pn-equations">
            Eγ = hc/λ; Φin = H/Eγ; I(x) = H(1−r)exp(−αx); G(x) = αI(x)/Eγ
            <br />
            ηabs = 1−exp(−αd); ηext = (1−r)ηabs ηcol; Iph = qAΦinηext
            <br />
            Responsivity ℛ = Iph/Pin = ηext qλ/(hc); Pin = HA
            <br />
            VT = kBT/q; Is(T) = AJ0,300(T/300)³ exp[(Eg/kB)(1/300−1/T)]
            <br />
            Photodiode: Iterminal = Is[exp(V/VT)−1] − Iph
            <br />
            Solar: Iout = Iph − Is[exp(Vj/VT)−1] − Vj/Rsh; V = Vj − IoutRs
            <br />P = VIout; FF = Pmax/(ISCVOC); ηpower = Pmax/Pin; Iload = V/Rload
            <br />
            Photon budget: Pin = Preflected + Ptransmitted + Pthermalization + Puncollected +
            Pcarrier-voltage-loss + Pdiode + Pshunt + Pseries + Pmax
            <br />
            LED: dN/dt = ηinj ILED/q − N/τr − N/τnr; τeff⁻¹ = τr⁻¹ + τnr⁻¹
            <br />
            N∞ = ηinj ILED τeff/q; IQE = τeff/τr; EQE = ηinj IQE ηout
            <br />
            Popt = ηout(N∞/τr)Eg; Pelec = ILED[Eg/q + 0.2 V + ILEDRs,LED]
            <br />
            Laser criterion: R₁R₂ exp[2(Γg−αi)L] ≥ 1
          </div>
          <p>
            h is Planck’s constant (6.62607015×10⁻³⁴ J·s), c the vacuum speed of light (299792458
            m/s), q the positive elementary charge, and kB Boltzmann’s constant. λ and x,d,L are
            lengths in metres; Eγ and Eg are joules in calculations (displayed in eV); H and I(x)
            are optical irradiance in W/m², Φ photon flux in m⁻²s⁻¹, G pairs m⁻³s⁻¹, α inverse
            metres, A illuminated area in m². r, ηabs, ηcol, ηext, ηinj, ηout and Γ are
            dimensionless. T is kelvin; VT,V,Vj,VOC are volts; electrical currents are amperes; R
            values are ohms; J0 is A/m². N counts excess pairs in a lumped emitting region;
            lifetimes are seconds. IQE is radiative fraction per recombining pair, EQE external
            photons per terminal electron, and wall-plug efficiency Popt/Pelec. Cj,Cp are
            capacitances in farads, μ mobility m²/(V·s), v speed m/s, f bandwidth Hz. g, αi are
            gain/loss m⁻¹ and R₁,R₂ are intensity reflectivities.
          </p>
          <h3>Illustrative absorption law — not a material dataset</h3>
          <p>
            For ΔE = Eγ − Eg in eV: direct α = 10⁶√(ΔE/0.5) m⁻¹; indirect α = 10⁴(ΔE/0.5)² m⁻¹, with
            α = 0 for ΔE ≤ 0. The coefficients are selected teaching scales motivated by the
            lecture’s strong/weak absorption examples. They are not fitted Si/GaAs curves and do not
            resolve phonon-assisted thresholds. A manual override specifies a chosen constant α
            above gap. Beer–Lambert assumes a uniform single-pass absorber with no interference,
            back reflection, scattering or photon recycling.
          </p>
          <h3>Electrical and thermal limits</h3>
          <p>
            The shared photodiode/solar model uses ideality 1, constant collection and fixed
            bandgap. J0,300 is user-assumed, not derived from device doping. Temperature only
            changes VT and J0; it does not update absorption, lifetime, gap or collection. Supported
            T is 280–400 K, λ 300–1600 nm, irradiance 0–2000 W/m². No AM1.5 spectrum,
            photoconductive gain, avalanche multiplication, tunneling, space-charge screening or
            self-heating is included.
          </p>
          <p>
            Solar solutions use bracketed roots for voltage/current and load intersection, plus a
            bounded maximum-power search. Residuals and power accounting are shown. The circuit
            budget uses VjIph = Pdiode + Pshunt + Pseries + Pout. Collected-carrier voltage loss is
            Iph(Eg/q−Vj). VOC above Eg/q or optical-power violations cause an error instead of a
            silent clamp. The LED model has fixed first-order lifetimes and a chosen electrical
            overhead; it does not predict the electrical I–V or density-dependent efficiency droop.
            The optional animation is its exact turn-on solution, not a numerical trajectory.
          </p>
        </details>
        <details className="pn-card">
          <summary>Course sources, discrepancies and validation</summary>
          <p>
            <b>Neamen, Semiconductor Physics and Devices, Fourth Edition, Chapter 14:</b>{' '}
            §§14.1.1–14.1.2, printed pp. 619–623 (PDF 644–648), photon absorption/generation; §14.2
            pp. 624–628 (PDF 649–653), illuminated diode, VOC, MPP, FF and efficiency;
            §14.3.2–14.3.3 pp. 635–641 (PDF 660–666), photodiodes/PIN collection; §14.4.2 p.
            645–646, radiative efficiency; §14.5 pp. 648–654, LEDs/extraction; §14.6 pp. 654–660,
            stimulated emission and cavity feedback. Si and GaAs gaps (1.12 eV, 1.42 eV) are the
            shared Appendix B Table B.4 values used by every module; Eq. 14.52 at zero Al fraction
            gives 1.424 eV, a difference below the precision this lab claims. Permittivity uses the
            same reference Si/GaAs values as the electronic labs.
          </p>
          <p>
            <b>Topic 4 — Absorption and Nonequilibrium:</b> PDF slides 3–4, 8–9, 19–22 and 25–27
            (energy, direct/indirect transitions, Beer–Lambert, generation, recombination).{' '}
            <b>Topic 10 — Optoelectronic devices:</b> PDF slides 3–9 and 14–15 (illuminated
            junction/PV and losses), 29–32 (photodiode/PIN/time response), 33–37 (emission and
            quantum efficiency). Slide numbers refer to PDF page order, not the differing printed
            footer numbers.
          </p>
          <p>
            <b>Discrepancies kept explicit:</b> Topic 4 slide 25 writes G = αI/(qhν). The factor q
            is needed only if the numerical photon energy is in eV; here hν is in joules, so G =
            αI/(hν). Slide 22’s illustrative transmissions are not treated as exact data: at α = 10⁴
            cm⁻¹ through 1 µm, exp(−αd) = 0.3679; at 10 cm⁻¹ it is 0.9990. The lecture’s AM1.5
            graphic is not a numerical spectrum input. Historical solar efficiencies in the sources
            are not presented as current records. Fixed-gap temperature scaling and selected
            absorption/lifetime coefficients are declared approximations.
          </p>
          <p>
            Validation: photon-flux units and integrated generation with quadrature refinement;
            zero/subgap limits; ηqλ/(hc) responsivity; exact ideal ISC/VOC; resistive circuit and
            load residuals; independent dense-sweep MPP comparison; optical/electrical power
            accounting; temperature trends; steady LED rate balance and turn-on differential
            balance; cavity round-trip threshold.
          </p>
        </details>
        <footer>
          ELECTRONIC → PHOTONIC{' '}
          <span>One photon budget · Explicit efficiencies · Monochromatic illumination</span>
        </footer>
      </main>
    </div>
  );
}
