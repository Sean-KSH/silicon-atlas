import { fabricationGuide } from './fabricationGuide';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Recipe,
  Mask,
  Snapshot,
  defaults,
  masks,
  maskNames,
  steps,
  simulateRecipe,
  inspect,
  exportRecipe,
  oxideGrowth,
  diffusivity,
  concentration,
  profileDose,
  aerial,
  width,
  height,
  resistThickness,
  metalThickness,
} from './fabrication';
import './fabrication.css';
const colors = {
  silicon: '#46596b',
  oxide: '#ff7948',
  resist: '#cf92e1',
  metal: '#f3ce79',
  doped: '#86d6a3',
  latent: '#ead3f0',
};
const fmt = (n: number) =>
  n === 0
    ? '0'
    : Math.abs(n) < 0.01 || Math.abs(n) > 1e5
      ? n.toExponential(2)
      : Number(n.toPrecision(4)).toString();
function download(name: string, data: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Control({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  change,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  change: (v: number) => void;
}) {
  return (
    <label className="fab-control">
      <span>
        {label}
        <b>
          {fmt(value)} {unit}
        </b>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => change(+e.target.value)}
      />
      <small>
        {min}–{max} {unit}
      </small>
    </label>
  );
}
function TopView({
  s,
  r,
  mask,
  slice,
  setSlice,
  dragMask,
  setAlignment,
  overlay,
}: {
  s: Snapshot;
  r: Recipe;
  mask: Mask;
  slice: number;
  setSlice: (y: number) => void;
  dragMask: boolean;
  setAlignment: (x: number, y: number) => void;
  overlay: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    gesture = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);
  useEffect(() => {
    const c = ref.current!,
      ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 800, 400);
    for (let y = 0; y < s.ny; y++)
      for (let x = 0; x < s.nx; x++) {
        const i = y * s.nx + x;
        ctx.fillStyle = s.metal[i]
          ? colors.metal
          : s.resist[i]
            ? colors.resist
            : s.oxide[i] > 0
              ? colors.oxide
              : s.doped[i]
                ? colors.doped
                : colors.silicon;
        ctx.fillRect((x * 800) / s.nx, (y * 400) / s.ny, 800 / s.nx + 0.2, 400 / s.ny + 0.2);
        if (s.resist[i] && s.dose[i] > 0 && [3, 10, 16, 21].includes(s.step)) {
          ctx.fillStyle = `rgba(255,255,255,${Math.min(s.dose[i], 1) * 0.7})`;
          ctx.fillRect((x * 800) / s.nx, (y * 400) / s.ny, 800 / s.nx + 0.2, 400 / s.ny + 0.2);
        }
      }
  }, [s]);
  return (
    <div
      className="fab-top"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const box = e.currentTarget.getBoundingClientRect(),
          x = ((e.clientX - box.left) / box.width) * width,
          y = ((e.clientY - box.top) / box.height) * height;
        if (dragMask)
          gesture.current = { x, y, dx: r.alignment[mask][0], dy: r.alignment[mask][1] };
        else setSlice(y);
      }}
      onPointerMove={(e) => {
        if (!e.buttons) return;
        const box = e.currentTarget.getBoundingClientRect(),
          x = ((e.clientX - box.left) / box.width) * width,
          y = ((e.clientY - box.top) / box.height) * height;
        if (dragMask && gesture.current) {
          const a = gesture.current;
          setAlignment(
            Math.max(-6e-6, Math.min(6e-6, a.dx + x - a.x)),
            Math.max(-6e-6, Math.min(6e-6, a.dy + y - a.y)),
          );
        } else if (!dragMask) setSlice(Math.max(0, Math.min(height - 1e-10, y)));
      }}
      onPointerUp={() => (gesture.current = null)}
    >
      <canvas
        ref={ref}
        width={800}
        height={400}
        role="img"
        aria-label={`Wafer top material map at ${steps[s.step][0]}, 40 by 20 micrometers`}
      />
      <svg viewBox="0 0 800 400" aria-hidden="true">
        {overlay &&
          masks[mask].map(([a, b, c, d], i) => (
            <rect
              key={i}
              x={(a + r.alignment[mask][0] * 1e6) * 20}
              y={(c + r.alignment[mask][1] * 1e6) * 20}
              width={(b - a) * 20}
              height={(d - c) * 20}
              fill="#10161a22"
              stroke="#fff"
              strokeWidth="2"
              strokeDasharray="7 5"
            />
          ))}
        {s.step >= 23 &&
          [9.5, 20, 30.5].map((x, i) => (
            <text
              key={i}
              x={(x + r.alignment.metal[0] * 1e6) * 20}
              y={(10 + r.alignment.metal[1] * 1e6) * 20 + 30}
              fill="#18232a"
              textAnchor="middle"
              fontSize="20"
              fontWeight="bold"
            >
              {['S', 'G', 'D'][i]}
            </text>
          ))}
        <path
          d={`M0 ${(slice / height) * 400}H800`}
          stroke="#fff"
          strokeWidth="2"
          strokeDasharray="10 7"
        />
        <text x="10" y={Math.max(20, (slice / height) * 400 - 8)} fill="white" fontSize="16">
          A — A′
        </text>
      </svg>
    </div>
  );
}
function Section({
  s,
  junction,
  slice,
  scale,
}: {
  s: Snapshot;
  junction: number | null;
  slice: number;
  scale: number;
}) {
  const yi = Math.min(s.ny - 1, Math.floor((slice / height) * s.ny)),
    sx = 700 / width,
    sy = sx * scale,
    base = 150,
    backBottom =
      340 +
      (s.backOxide + (s.backMetal ? metalThickness : 0) + (s.backResist ? resistThickness : 0)) *
        sy,
    viewHeight = Math.max(410, backBottom + 50);
  return (
    <svg
      className="fab-section-svg"
      viewBox={`0 0 800 ${viewHeight}`}
      role="img"
      aria-label={`Cross section at y ${(slice * 1e6).toFixed(2)} micrometers, vertical magnification ${scale}`}
    >
      <defs>
        <pattern id="fab-si" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 10L10 0" stroke="#607181" opacity=".16" />
        </pattern>
      </defs>
      <rect x="50" y={base} width="700" height="170" fill={colors.silicon} />
      <rect x="50" y={base} width="700" height="170" fill="url(#fab-si)" />
      {Array.from({ length: s.nx }, (_, x) => {
        const i = yi * s.nx + x,
          xx = 50 + (x * 700) / s.nx,
          w = 700 / s.nx + 0.1,
          surface = base + s.recess[i] * sy,
          top = surface - s.oxide[i] * sy;
        return (
          <g key={x} shapeRendering="crispEdges">
            <rect x={xx} y={base - 110} width={w} height={110 + s.recess[i] * sy} fill="#101b24" />
            {s.doped[i] && junction !== null && (
              <rect x={xx} y={surface} width={w} height={junction * sy} fill={colors.doped} />
            )}
            <rect x={xx} y={top} width={w} height={s.oxide[i] * sy} fill={colors.oxide} />
            {s.resist[i] > 0 && (
              <rect
                x={xx}
                y={top - resistThickness * sy}
                width={w}
                height={resistThickness * sy}
                fill={colors.resist}
              />
            )}{' '}
            {s.metal[i] > 0 && (
              <rect
                x={xx}
                y={top - (s.resist[i] ? resistThickness : 0) * sy - metalThickness * sy}
                width={w}
                height={metalThickness * sy}
                fill={colors.metal}
              />
            )}
          </g>
        );
      })}
      <text x="66" y="292" fill="#d7e0e5">
        p-type Si · substrate thickness truncated
      </text>
      <path d="M50 326l8 -5 8 10 8 -10 8 5H750" fill="none" stroke="#a5b5be" />
      {s.backOxide > 0 && (
        <rect x="50" y="340" width="700" height={s.backOxide * sy} fill={colors.oxide} />
      )}{' '}
      {s.backResist && (
        <rect
          x="50"
          y={340 + s.backOxide * sy}
          width="700"
          height={resistThickness * sy}
          fill={colors.resist}
        />
      )}{' '}
      {s.backMetal && (
        <rect
          x="50"
          y={340 + s.backOxide * sy}
          width="700"
          height={metalThickness * sy}
          fill={colors.metal}
        />
      )}
      <text x="50" y={viewHeight - 16} fill="#aebec8" fontSize="12">
        Backside drawn separately · oxide {fmt(s.backOxide * 1e9)} nm{' '}
        {s.backMetal ? '· substrate metal' : ''}
      </text>
      <path d="M50 28H750" stroke="#8097a5" />
      {[0, 10, 20, 30, 40].map((x) => (
        <g key={x}>
          <path d={`M${50 + x * 17.5} 24v8`} stroke="#8097a5" />
          <text x={50 + x * 17.5} y="18" fill="#aebec8" textAnchor="middle" fontSize="12">
            {x} µm
          </text>
        </g>
      ))}
      <text x="750" y="313" textAnchor="end" fill="#aebec8" fontSize="11">
        Vertical scale ×{scale} · no minimum layer thickness
      </text>
    </svg>
  );
}
export default function FabricationLab() {
  const [r, setR] = useState<Recipe>(() => structuredClone(defaults)),
    [step, setStep] = useState(0),
    [mask, setMask] = useState<Mask>('diffusion'),
    [slice, setSlice] = useState(10e-6),
    [scale, setScale] = useState(3),
    [deep, setDeep] = useState(false),
    [dragMask, setDragMask] = useState(false),
    [overlay, setOverlay] = useState(true),
    [playing, setPlaying] = useState(false),
    [seconds, setSeconds] = useState(4),
    [controlsOpen, setControlsOpen] = useState(false),
    [largeViews, setLargeViews] = useState(false),
    [plot, setPlot] = useState('diffusion'),
    [prediction, setPrediction] = useState(''),
    [experiment, setExperiment] = useState(0),
    [reveal, setReveal] = useState(false);
  const result = useMemo(() => {
    try {
      return { states: simulateRecipe(r), error: '' };
    } catch (e) {
      return { states: [], error: String(e) };
    }
  }, [r]);
  const s = result.states[step],
    m = s ? inspect(s, r) : null;
  const isDefault = JSON.stringify(r) === JSON.stringify(defaults),
    finalCheck = result.states[25] ? inspect(result.states[25], r) : null,
    passes =
      !!finalCheck &&
      finalCheck.sourceContact &&
      finalCheck.drainContact &&
      finalCheck.gateInsulated &&
      finalCheck.substrateContact;
  useEffect(() => {
    if (playing)
      setMask(step < 9 ? 'diffusion' : step < 15 ? 'gate' : step < 20 ? 'contact' : 'metal');
  }, [step, playing]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () =>
        setStep((v) => {
          if (v >= 24) {
            setPlaying(false);
            return 25;
          }
          return v + 1;
        }),
      seconds * 1000,
    );
    return () => clearInterval(id);
  }, [playing, seconds]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  const change = <K extends keyof Recipe>(key: K, value: Recipe[K]) => {
    setPlaying(false);
    setR((old) => ({ ...old, [key]: value }));
  };
  const align = (dx: number, dy: number) => {
    setPlaying(false);
    setR((old) => ({
      ...old,
      alignment: {
        ...old.alignment,
        [mask]: [Math.round(dx * 1e7) / 1e7, Math.round(dy * 1e7) / 1e7],
      },
    }));
  };
  const selectStep = (n: number) => {
    setPlaying(false);
    setStep(n);
    setMask(n < 9 ? 'diffusion' : n < 15 ? 'gate' : n < 20 ? 'contact' : 'metal');
  };
  const reset = () => {
    setR(structuredClone(defaults));
    setStep(0);
    setPlaying(false);
    setMask('diffusion');
    setSlice(10e-6);
    setScale(3);
    setDragMask(false);
    setOverlay(true);
    setControlsOpen(false);
  };
  const fieldOx = oxideGrowth(0, r.fieldTime, r.fieldT, true),
    gateOx = oxideGrowth(0, r.gateTime, r.gateT, false),
    zmax = 10 * Math.sqrt(diffusivity(r.diffT) * r.diffTime),
    data = Array.from({ length: 201 }, (_, i) => {
      const z = (i / 200) * zmax,
        t = (i / 200) * r.fieldTime,
        x = (i / 200) * width;
      return {
        x: plot === 'diffusion' ? z * 1e6 : plot === 'oxidation' ? t / 60 : x * 1e6,
        donor: concentration(z, r) > 0 ? concentration(z, r) / 1e6 : null,
        acceptor: r.acceptor / 1e6,
        wet: oxideGrowth(0, t, r.fieldT, true) * 1e9,
        dry: oxideGrowth(0, (i / 200) * r.gateTime, r.gateT, false) * 1e9,
        image: aerial(x, slice, mask, r),
        threshold: 0.5,
      };
    });
  const issues: string[] = [];
  if (step >= 7 && s && !s.doped.some(Boolean))
    issues.push(
      'No n-type source/drain: the diffusion oxide windows did not open, or the surface donor density is below the acceptor background.',
    );
  if (step >= 14 && m && m.gateOxide > gateOx * 1.5)
    issues.push(
      'Residual field oxide under the channel: the gate-window mask or etch failed to clear it.',
    );
  if (step >= 24 && m) {
    if (!m.sourceContact)
      issues.push(
        'Source is electrically unopened in the ideal geometry check: residual oxide or lost mask overlap.',
      );
    if (!m.drainContact)
      issues.push(
        'Drain is electrically unopened in the ideal geometry check: residual oxide or lost mask overlap.',
      );
    if (m.metalBridge)
      issues.push(
        'Metal islands are connected: exposure/blur merged the intended source, gate or drain patterns.',
      );
    if (!m.gateInsulated)
      issues.push('Gate coverage/insulation check fails. Inspect the gate and metal masks.');
    if (!m.substrateContact) issues.push('Backside oxide blocks the substrate contact.');
    if (m.unintendedSiliconContact)
      issues.push('Unintended metal-to-p-substrate contact on the front surface.');
  }
  if (gateOx < 50e-9)
    issues.push(
      'Dry gate oxide below 50 nm: classical Deal–Grove underestimates rapid initial growth. Treat this prediction as qualitative.',
    );
  const exportCsv = () => {
    if (!s || !m) return;
    download(
      'mosfet-process-profile-SI.csv',
      [
        'depth_m,donor_m-3,acceptor_m-3,net_doping_m-3,corner_oxide_m,center_channel_oxide_m,channel_length_m,source_drain_overlap_width_m,step',
        ...Array.from({ length: 401 }, (_, i) => {
          const z = (i / 400) * zmax,
            c = step >= 7 ? concentration(z, r) : 0;
          return [
            z,
            c,
            r.acceptor,
            c - r.acceptor,
            s.oxide[0],
            m.gateOxide,
            m.channel ?? '',
            m.sourceDrainOverlapWidth,
            step,
          ].join(',');
        }),
      ].join('\n'),
      'text/csv',
    );
  };
  return (
    <div
      className={`fab-lab ${controlsOpen ? 'fab-editing' : 'fab-viewing'} ${largeViews ? 'fab-large-views' : ''}`}
    >
      <header className="fab-header">
        <a href="#fabrication" className="brand">
          <span className="brandmark">Si</span>
          <span>
            SILICON ATLAS<span className="brand-sub">Process integration / 06</span>
          </span>
        </a>
        <button onClick={reset}>Restore tested defaults</button>
      </header>
      <main>
        <div className="fab-hero">
          <div>
            <span className="eyebrow">THE FOUR-MASK TEACHING PROCESS</span>
            <h1>Fabricate a MOSFET.</h1>
            <p>
              Pattern. Diffuse. Connect.
              <br />
              See how every process decision becomes device geometry.
            </p>
          </div>
          <div className="fab-hero-badge">
            <span>nMOS</span>
            <small>
              METAL GATE
              <br />
              P-TYPE SILICON
              <br />
              COURSE LAB FLOW
            </small>
          </div>
        </div>
        <div className="fab-toolbar">
          <div>
            <button className={!deep ? 'selected' : ''} onClick={() => setDeep(false)}>
              Beginner
            </button>
            <button className={deep ? 'selected' : ''} onClick={() => setDeep(true)}>
              Model details
            </button>
          </div>
          <div>
            <button disabled={!s} onClick={exportCsv}>
              ↓ Profile CSV
            </button>
            <button
              disabled={!s}
              onClick={() =>
                download(
                  'mosfet-process-state.json',
                  JSON.stringify(exportRecipe(r, result.states, step)),
                )
              }
            >
              ↓ Recipe + all states
            </button>
          </div>
        </div>
        <section className="fab-baseline">
          <div>
            <b>
              {isDefault && passes
                ? '✓ Tested default recipe'
                : passes
                  ? 'Modified recipe · geometry checks pass'
                  : 'Modified recipe · inspect final geometry'}
            </b>
            <p>
              {isDefault
                ? 'All four final terminal checks pass in this teaching model. Start here before changing the recipe.'
                : 'Your changes are active. Restore defaults to recover the tested starting point.'}
            </p>
          </div>
          <button
            className="selected"
            onClick={() => {
              reset();
              setPlaying(true);
            }}
          >
            ▶ Run tested demo
          </button>
          <button onClick={reset}>↺ Restore tested defaults</button>
        </section>
        <div className="fab-timeline" aria-label="Process timeline">
          {steps.map(([name], i) => (
            <button
              key={i}
              className={i === step ? 'active' : i < step ? 'done' : ''}
              onClick={() => selectStep(i)}
              aria-current={i === step ? 'step' : undefined}
            >
              <span>{String(i).padStart(2, '0')}</span>
              {name}
            </button>
          ))}
        </div>
        <div className="fab-stage">
          <div>
            <span className="eyebrow">STEP {String(step).padStart(2, '0')} / 25</span>
            <h2>{steps[step][0]}</h2>
            <p>{steps[step][1]}</p>
          </div>
          <div className="fab-navigation">
            <button disabled={step === 0} onClick={() => selectStep(step - 1)}>
              ← Back
            </button>
            <button
              onClick={() => {
                if (step === 25) setStep(0);
                setPlaying((v) => !v);
              }}
            >
              {playing ? 'Pause' : 'Continue animation'}
            </button>
            <button disabled={step === 25} onClick={() => selectStep(step + 1)}>
              Next →
            </button>
            <label className="fab-pace">
              Pace
              <select
                aria-label="Animation pace"
                value={seconds}
                onChange={(e) => setSeconds(+e.target.value)}
              >
                <option value={2}>2 s / step</option>
                <option value={4}>4 s / step</option>
                <option value={7}>7 s / step</option>
              </select>
            </label>
          </div>
        </div>
        <div className="fab-instruction" aria-live="polite">
          <div>
            <span>DO THIS</span>
            <p>{fabricationGuide[step][0]}</p>
          </div>
          <div>
            <span>LOOK FOR</span>
            <p>{fabricationGuide[step][1]}</p>
          </div>
          <small>
            {playing
              ? 'Playing once · stops after step 25'
              : step === 25
                ? 'Process complete · inspect or replay'
                : 'Paused · step manually or continue'}{' '}
            · Guided snapshot animation; timing is instructional, not furnace time.
          </small>
        </div>
        <div className="fab-view-tools">
          <button onClick={() => setLargeViews((v) => !v)}>
            {largeViews ? 'Side-by-side views' : 'Enlarge diagrams'}
          </button>
          <button
            className={controlsOpen ? 'selected' : ''}
            onClick={() => setControlsOpen((v) => !v)}
          >
            {controlsOpen ? 'Hide recipe controls · enlarge views' : 'Edit recipe & mask alignment'}
          </button>
          <button
            onClick={() => {
              setSlice(10e-6);
              setScale(3);
              setDragMask(false);
              setOverlay(true);
            }}
          >
            Reset view / section
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setR(structuredClone(defaults));
              setSlice(10e-6);
              setScale(3);
              setDragMask(false);
              setMask(
                step < 9 ? 'diffusion' : step < 15 ? 'gate' : step < 20 ? 'contact' : 'metal',
              );
            }}
          >
            Reset recipe at this step
          </button>
        </div>
        <div className="fab-workspace">
          <aside className="fab-card fab-controls">
            <h2>Process recipe</h2>
            <p className="fab-note">
              Edits rebuild every snapshot deterministically. Back/Next never undo by approximation.
              The current step stays selected.
            </p>
            <details open>
              <summary>Oxidation · wet field / dry gate</summary>
              <Control
                label="Field oxidation temperature"
                value={r.fieldT - 273.15}
                min={900}
                max={1100}
                step={10}
                unit="°C"
                change={(v) => change('fieldT', v + 273.15)}
              />
              <Control
                label="Field oxidation time"
                value={r.fieldTime / 60}
                min={30}
                max={360}
                step={10}
                unit="min"
                change={(v) => change('fieldTime', v * 60)}
              />
              <Control
                label="Gate oxidation temperature"
                value={r.gateT - 273.15}
                min={900}
                max={1100}
                step={10}
                unit="°C"
                change={(v) => change('gateT', v + 273.15)}
              />
              <Control
                label="Gate oxidation time"
                value={r.gateTime / 60}
                min={10}
                max={180}
                step={5}
                unit="min"
                change={(v) => change('gateTime', v * 60)}
              />
            </details>
            <details>
              <summary>Phosphorus diffusion</summary>
              <label>
                Boundary condition
                <select
                  aria-label="Diffusion profile"
                  value={r.profile}
                  onChange={(e) => change('profile', e.target.value as Recipe['profile'])}
                >
                  <option value="erfc">Constant source · erfc</option>
                  <option value="gaussian">Limited dose · Gaussian</option>
                </select>
              </label>
              <p className="fab-note">
                The course uses a gas source. Gaussian diffusion is an alternative comparison, not a
                second sequential recipe step.
              </p>
              <Control
                label="Diffusion temperature"
                value={r.diffT - 273.15}
                min={900}
                max={1100}
                step={10}
                unit="°C"
                change={(v) => change('diffT', v + 273.15)}
              />
              <Control
                label="Diffusion time"
                value={r.diffTime / 60}
                min={5}
                max={180}
                step={5}
                unit="min"
                change={(v) => change('diffTime', v * 60)}
              />
              {r.profile === 'erfc' ? (
                <Control
                  label="log₁₀ surface concentration [cm⁻³]"
                  value={Math.log10(r.surface / 1e6)}
                  min={17}
                  max={20}
                  step={0.1}
                  unit=""
                  change={(v) => change('surface', 10 ** v * 1e6)}
                />
              ) : (
                <Control
                  label="log₁₀ dose [cm⁻²]"
                  value={Math.log10(r.dose / 1e4)}
                  min={11}
                  max={14}
                  step={0.1}
                  unit=""
                  change={(v) => change('dose', 10 ** v * 1e4)}
                />
              )}
              <Control
                label="log₁₀ substrate acceptors [cm⁻³]"
                value={Math.log10(r.acceptor / 1e6)}
                min={14}
                max={17}
                step={0.1}
                unit=""
                change={(v) => change('acceptor', 10 ** v * 1e6)}
              />
            </details>
            <details open>
              <summary>Lithography & alignment</summary>
              <label>
                Editable mask
                <select
                  aria-label="Editable mask"
                  value={mask}
                  onChange={(e) => setMask(e.target.value as Mask)}
                >
                  {Object.entries(maskNames).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <Control
                label="Mask offset x"
                value={r.alignment[mask][0] * 1e6}
                min={-6}
                max={6}
                step={0.1}
                unit="µm"
                change={(v) => align(v * 1e-6, r.alignment[mask][1])}
              />
              <Control
                label="Mask offset y"
                value={r.alignment[mask][1] * 1e6}
                min={-6}
                max={6}
                step={0.1}
                unit="µm"
                change={(v) => align(r.alignment[mask][0], v * 1e-6)}
              />
              <Control
                label="Normalized exposure"
                value={r.exposure}
                min={0.2}
                max={2}
                step={0.05}
                unit="×"
                change={(v) => change('exposure', v)}
              />
              <Control
                label="Gaussian blur σ"
                value={r.blur * 1e6}
                min={0.2}
                max={1.5}
                step={0.1}
                unit="µm"
                change={(v) => change('blur', v * 1e-6)}
              />
              <p className="fab-note">
                Exposure and blur apply to all four masks. Offsets are independent. Resist clears at
                dose ≥ 0.5; no resist chemistry calibration is claimed.
              </p>
            </details>
            <details>
              <summary>Etch geometry</summary>
              <select
                aria-label="Etch geometry"
                value={r.etch}
                onChange={(e) => change('etch', e.target.value as Recipe['etch'])}
              >
                <option value="isotropic">Isotropic · lateral undercut</option>
                <option value="anisotropic">Ideal directional · vertical only</option>
              </select>
              <Control
                label="Diffusion-window etch"
                value={r.fieldEtch / 60}
                min={0}
                max={25}
                step={0.5}
                unit="min"
                change={(v) => change('fieldEtch', v * 60)}
              />
              <Control
                label="Gate-window etch"
                value={r.gateEtch / 60}
                min={0}
                max={25}
                step={0.5}
                unit="min"
                change={(v) => change('gateEtch', v * 60)}
              />
              <Control
                label="Contact etch"
                value={r.contactEtch / 60}
                min={0}
                max={5}
                step={0.1}
                unit="min"
                change={(v) => change('contactEtch', v * 60)}
              />
              <p className="fab-note">
                Chosen teaching rate: 100 nm/min. Ideal selectivity to Si and resist. Directional is
                a comparison; the lecture’s HF oxide etch is isotropic.
              </p>
            </details>
          </aside>
          <div className="fab-main">
            {result.error ? (
              <div role="alert" className="fab-error">
                {result.error}
              </div>
            ) : (
              s &&
              m && (
                <>
                  <div className="fab-views">
                    <section className="fab-card">
                      <div className="fab-panel-heading">
                        <div>
                          <span className="eyebrow">SYNCHRONIZED MATERIAL GEOMETRY</span>
                          <h2>Wafer top view</h2>
                        </div>
                        <span className="fab-chip">40 × 20 µm</span>
                      </div>
                      <div className="fab-toolbar">
                        <label>
                          <input
                            type="checkbox"
                            checked={overlay}
                            onChange={(e) => setOverlay(e.target.checked)}
                          />{' '}
                          Mask outline
                        </label>
                        <button
                          className={dragMask ? 'selected' : ''}
                          onClick={() => setDragMask((v) => !v)}
                        >
                          {dragMask ? 'Drag: move selected mask' : 'Drag: move section line'}
                        </button>
                      </div>
                      <TopView
                        s={s}
                        r={r}
                        mask={mask}
                        slice={slice}
                        setSlice={(y) =>
                          setSlice(Math.min(19.9e-6, Math.max(0, Math.round(y * 1e7) / 1e7)))
                        }
                        dragMask={dragMask}
                        setAlignment={align}
                        overlay={overlay}
                      />
                      <p className="fab-note">
                        {dragMask
                          ? 'Drag the wafer to align the selected mask. Only this mask offset changes.'
                          : 'Drag vertically to move the A–A′ section. Use the slider for keyboard control.'}{' '}
                        Dashed rectangles show the selected design mask, not developed edges. Top
                        colors show the uppermost material.
                      </p>
                      <div className="fab-legend">
                        {Object.entries(colors)
                          .filter(([k]) => k !== 'latent')
                          .map(([k, v]) => (
                            <span key={k}>
                              <i style={{ background: v }} />
                              {k === 'doped' ? 'n-type Si' : k === 'silicon' ? 'p-type Si' : k}
                            </span>
                          ))}
                      </div>
                      <Control
                        label="Cross-section position y"
                        value={slice * 1e6}
                        min={0}
                        max={19.9}
                        step={0.1}
                        unit="µm"
                        change={(v) => setSlice(v * 1e-6)}
                      />
                    </section>
                    <section className="fab-card">
                      <div className="fab-panel-heading">
                        <div>
                          <span className="eyebrow">SECTION A–A′ / COMPUTED LAYERS</span>
                          <h2>Cross-section</h2>
                        </div>
                        <label>
                          Vertical scale
                          <select
                            aria-label="Vertical magnification"
                            value={scale}
                            onChange={(e) => setScale(+e.target.value)}
                          >
                            <option value={1}>1× · equal x/z scale</option>
                            <option value={3}>3× · exaggerated</option>
                          </select>
                        </label>
                      </div>
                      <Section s={s} junction={m.junction} slice={slice} scale={scale} />
                      <p className="fab-note">
                        Oxide and metal thicknesses are drawn at the stated scale, with no
                        artificial minimum. Substrate depth is truncated. n-type depth uses the
                        computed Nᴅ = Nᴀ junction; abrupt lateral edges are the 1D-column
                        approximation.
                      </p>
                      <div className="fab-metrics">
                        <div>
                          <span>Center gate-region oxide</span>
                          <b>{fmt(m.gateOxide * 1e9)} nm</b>
                        </div>
                        <div>
                          <span>Centerline S–D gap</span>
                          <b>{m.channel === null ? 'Not formed' : `${fmt(m.channel * 1e6)} µm`}</b>
                        </div>
                        <div>
                          <span>Diffusion junction depth</span>
                          <b>
                            {m.junction === null ? 'Not formed' : `${fmt(m.junction * 1e6)} µm`}
                          </b>
                        </div>
                      </div>
                      <p className="fab-note">
                        Nominal mask channel: L = 12 µm, W = 8 µm. Gap above measures the actual
                        diffused footprint at y = 10 µm; lateral diffusion and electrical effective
                        channel shortening are not calculated.
                      </p>
                    </section>
                  </div>
                  <section className="fab-card">
                    <span className="eyebrow">PROCESS CONSEQUENCES</span>
                    <h2>{issues.length ? 'Inspect before proceeding' : 'Geometry checks'}</h2>
                    {issues.map((v, i) => (
                      <p className="fab-warning" key={i}>
                        {v}
                      </p>
                    ))}
                    {step < 24 ? (
                      <p>
                        Terminal checks become active after lift-off. Explore a failure preset to
                        see its cause propagate through the sequence.
                      </p>
                    ) : (
                      <div className="fab-terminals">
                        {[
                          ['Source', m.sourceContact],
                          ['Gate insulation', m.gateInsulated],
                          ['Drain', m.drainContact],
                          ['Substrate', m.substrateContact],
                        ].map(([name, ok]) => (
                          <span key={String(name)} className={ok ? 'pass' : 'fail'}>
                            {ok ? '●' : '×'} {name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="fab-toolbar">
                      <button
                        onClick={() => {
                          reset();
                          setStep(25);
                        }}
                      >
                        Nominal finished device
                      </button>
                      <button
                        onClick={() => {
                          setR({ ...structuredClone(defaults), contactEtch: 0 });
                          selectStep(25);
                        }}
                      >
                        Fault: unopened contacts
                      </button>
                      <button
                        onClick={() => {
                          const next = structuredClone(defaults);
                          next.alignment.contact = [6e-6, 0];
                          setR(next);
                          selectStep(25);
                          setMask('contact');
                        }}
                      >
                        Fault: contact misalignment
                      </button>
                      <button
                        onClick={() => {
                          setR({ ...structuredClone(defaults), exposure: 0.35 });
                          selectStep(4);
                        }}
                      >
                        Fault: underexposure
                      </button>
                    </div>
                  </section>
                </>
              )
            )}
            <section className="fab-card">
              <div className="fab-panel-heading">
                <div>
                  <span className="eyebrow">ANALYTICAL RECIPE SUBMODELS</span>
                  <h2>Predict the process window</h2>
                </div>
              </div>
              <div className="fab-toolbar">
                {[
                  ['diffusion', 'Dopant profile'],
                  ['oxidation', 'Oxide growth'],
                  ['lithography', 'Exposure & threshold'],
                ].map(([key, name]) => (
                  <button
                    key={key}
                    className={plot === key ? 'selected' : ''}
                    onClick={() => setPlot(key)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="fab-note">
                {plot === 'diffusion'
                  ? `Recipe prediction under an open window. ${step < 7 ? 'Diffusion has not been applied to this snapshot. ' : ''}D = ${fmt(diffusivity(r.diffT))} m²/s; dose = ${fmt(profileDose(r) / 1e4)} cm⁻².`
                  : plot === 'oxidation'
                    ? 'Wet-field growth from bare Si at the field temperature. Gate prediction shown numerically below; successive oxidation uses the existing local oxide.'
                    : 'Selected mask at the current A–A′ section. Gaussian image blur followed by a binary threshold is a conceptual lithography model.'}
              </p>
              <div className="fab-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 25, bottom: 30, left: 15 }}>
                    <CartesianGrid stroke="#30434d" strokeDasharray="3 5" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      tick={{ fill: '#a5bdc8', fontSize: 11 }}
                      label={{
                        value:
                          plot === 'diffusion'
                            ? 'Depth into Si (µm)'
                            : plot === 'oxidation'
                              ? 'Wet oxidation time (min)'
                              : 'Position x (µm)',
                        position: 'bottom',
                        fill: '#a5bdc8',
                        offset: 8,
                      }}
                    />
                    <YAxis
                      width={85}
                      scale={plot === 'diffusion' ? 'log' : 'linear'}
                      domain={plot === 'diffusion' ? [1e10, 'auto'] : [0, 'auto']}
                      allowDataOverflow
                      tickFormatter={fmt}
                      tick={{ fill: '#a5bdc8', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ background: '#152631', border: '1px solid #4c6876' }}
                      formatter={(v) => fmt(Number(v))}
                    />
                    {plot === 'diffusion' ? (
                      <>
                        <Line
                          dataKey="donor"
                          name="Donors (cm⁻³)"
                          stroke="#83c7a5"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          dataKey="acceptor"
                          name="Acceptors (cm⁻³)"
                          stroke="#e1bc79"
                          dot={false}
                        />
                      </>
                    ) : plot === 'oxidation' ? (
                      <Line
                        dataKey="wet"
                        name="Oxide (nm)"
                        stroke={colors.oxide}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ) : (
                      <>
                        <Line
                          dataKey="image"
                          name="Normalized dose"
                          stroke="#bf86c8"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <ReferenceLine
                          y={0.5}
                          stroke="#e1bc79"
                          strokeDasharray="5 5"
                          label={{
                            value: 'Clear threshold 0.5',
                            fill: '#e1bc79',
                            position: 'insideTopRight',
                          }}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="fab-note">
                {plot === 'diffusion'
                  ? 'Log concentration axis (cm⁻³). Donor tail below 10¹⁰ cm⁻³ is outside the plotting window, not clipped in calculations or CSV. Green: donors; gold: uniform acceptors.'
                  : plot === 'oxidation'
                    ? `Oxide thickness axis in nm. Field end: ${fmt(fieldOx * 1e9)} nm. Bare-Si dry gate prediction: ${fmt(gateOx * 1e9)} nm.`
                    : 'Vertical axis: dimensionless dose. Positive resist remains below the threshold.'}
              </p>
            </section>
          </div>
        </div>
        <section className="fab-card fab-experiments">
          <span className="eyebrow">THREE GUIDED EXPERIMENTS</span>
          <h2>Predict → fabricate → inspect.</h2>
          <div className="fab-toolbar">
            {['1. Oxidation time', '2. Conserved dose', '3. Contact failure'].map((name, i) => (
              <button
                key={i}
                className={experiment === i ? 'selected' : ''}
                onClick={() => {
                  setExperiment(i);
                  setReveal(false);
                  setPrediction('');
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <h3>
            {
              [
                'Will doubling oxidation time double the oxide thickness?',
                'With a fixed dopant dose, what happens to the peak and junction when diffusion time increases?',
                'Can aluminum deposition repair an unopened source contact?',
              ][experiment]
            }
          </h3>
          <textarea
            aria-label="Fabrication prediction"
            placeholder="Record your prediction…"
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
          />
          <div className="fab-toolbar">
            <button
              onClick={() => {
                setR({
                  ...structuredClone(defaults),
                  ...(experiment === 1
                    ? { profile: 'gaussian' as const }
                    : experiment === 2
                      ? { contactEtch: 0 }
                      : {}),
                });
                selectStep(experiment === 0 ? 1 : experiment === 1 ? 7 : 25);
                setPlot(experiment === 0 ? 'oxidation' : 'diffusion');
              }}
            >
              Load experiment
            </button>
            <button onClick={() => setReveal((v) => !v)}>Reveal explanation</button>
          </div>
          {reveal && (
            <p>
              {
                [
                  'Initially x ≈ (B/A)t; for thick oxide x ≈ √(Bt). The growing oxide slows further oxidant transport, so doubling time approaches √2 times thickness in the parabolic limit.',
                  'A Gaussian profile integrates to the fixed dose Q. The surface peak falls as 1/√t and the profile spreads. Junction depth need not increase forever: sufficiently diluted donors can fall below the background everywhere.',
                  'Metal on oxide does not contact the semiconductor. Clearing the contact oxide and aligning the contact with n-type silicon are separate necessary conditions. Lift-off cannot repair either failure.',
                ][experiment]
              }
            </p>
          )}
        </section>
        <details className="fab-card" open={deep}>
          <summary>Equations, parameter provenance & model limits</summary>
          <h3>Thermal oxidation · Deal–Grove</h3>
          <p className="fab-equation">
            x² + Ax = x₀² + Ax₀ + Bt · B = C₁ exp(−b₁/T) · B/A = (C₂/1.68) exp(−b₂/T)
          </p>
          <p>
            x, x₀: final/initial oxide thickness (m); t: time (s); T: absolute temperature (K); B:
            parabolic rate (m²/s); A: length (m). (100) silicon with Illinois GT8 orientation
            correction. Wet: C₁ = 5.940×10⁻¹⁴ m²/s, C₂ = 0.02490 m/s, b₁ = 8237 K. Dry: C₁ =
            2.144×10⁻¹³ m²/s, C₂ = 0.00173 m/s, b₁ = 14270 K. Both b₂ = 23200 K. Fixed reference
            ambient; pressure is not a control. Use 900–1100 °C. No fitted initial rapid-growth
            correction; dry oxide below 50 nm is flagged. Consumption: ΔzSi = 0.4407 Δx.
          </p>
          <h3>Phosphorus diffusion · two alternative boundary conditions</h3>
          <p className="fab-equation">
            D = 1.05×10⁻³ exp(−42800/T) m²/s
            <br />
            Constant source: Nᴅ(z,t) = Cₛ erfc[z/(2√Dt)] · dose = 2Cₛ√(Dt/π)
            <br />
            Limited dose: Nᴅ(z,t) = Q/√(πDt) exp[−z²/(4Dt)] · ∫₀∞Nᴅ dz = Q<br />
            Junction: Nᴅ(xⱼ,t) − Nᴀ = 0
          </p>
          <p>
            D: concentration-independent diffusivity; z: depth from local Si surface (m); Cₛ:
            maintained surface donors (m⁻³); Q: half-space dose (m⁻²); Nᴀ: uniform acceptors.
            Constant source begins from zero donors with fixed Cₛ at z = 0. Gaussian assumes an
            initial sheet dose and zero surface loss. Both are semi-infinite, isothermal, fully
            activated teaching solutions. Junction uses bracketed bisection; no crossing returns
            “Not formed.” No concentration-enhanced diffusion, clustering, solubility enforcement,
            lateral diffusion, subsequent thermal redistribution or oxidation segregation.
            Especially at high concentrations, the model is qualitative.
          </p>
          <h3>Lithography and etching</h3>
          <p className="fab-equation">
            Dose(x,y) = exposure × [binary clear mask ∗ Gaussian(σ)]
            <br />
            Positive resist removed if dose ≥ 0.5
            <br />
            Directional removal = R t in open pixels
            <br />
            Isotropic height-field removal = max over openings √[(Rt)² − d²] for d ≤ Rt
          </p>
          <p>
            σ is a chosen blur width, not wavelength/NA; no Rayleigh resolution claim, standing
            waves or resist kinetics. d is lateral distance to an open grid cell; R = 100 nm/min is
            a selected teaching rate. Isotropic etching is an ideal rounded-front height-field
            approximation, not a full 3D moving-interface solution. Removal stops at Si (perfect
            selectivity); resist does not erode. Grid: 160 × 80 cells, Δx = Δy = 0.25 µm. Dimensions
            below this lateral scale are unresolved. Metal thickness is a chosen 250 nm; PR is 1.2
            µm. Ideal lift-off assumes broken metal at resist edges, without a calculated undercut
            or sidewall coating. Contact checks use connected metal components, contact overlap and
            gate coverage along the centerline; they do not predict minimum manufacturable contact
            area or resistance.
          </p>
          <p>
            <b>Thermal-budget discrepancy:</b> real gate oxidation redistributes phosphorus; this
            first version deliberately keeps the earlier diffusion profile fixed. Exported geometry
            and profile carry this limitation. The lecture also shows backside gate oxide followed
            by backside metal without detailing a final backside oxide clear. This simulator
            explicitly adds that clear at the contact-etch stage so it does not silently label an
            insulated backside as a working substrate contact. Si–O–P cleanup is narrative only.
          </p>
          <p>
            Internally SI. UI converts minutes ×60 to seconds; °C +273.15 to K; µm ×10⁻⁶ and nm
            ×10⁻⁹ to m; cm⁻³ ×10⁶ to m⁻³; cm⁻² ×10⁴ to m⁻². JSON stores every material snapshot and
            recipe, grid and selected-step metrics. CSV contains the selected-step under-window
            depth profile, net doping and geometry; a device solver still needs a coupled
            process/electrical model.
          </p>
        </details>
        <details className="fab-card">
          <summary>Course sources & why this is not modern self-aligned CMOS</summary>
          <p>
            <b>Topic 5 — Making Si and MOSFET Process Flow:</b> PDF pp. 8–17 substrate, wet field
            oxide, positive resist and oxide windows; pp. 18–20 phosphorus and glass cleanup; pp.
            21–25 gate opening and dry oxide; pp. 26–30 contacts; pp. 31–37 aluminum lift-off, four
            terminals and mask registration. The top-view layout follows the relationships on p. 37,
            with explicitly chosen dimensions. The course’s roughly 900 nm field oxide is an
            illustrative target; changing the thermal recipe is allowed to depart from it.
          </p>
          <p>
            <b>Topic 2.5 — Photoresist lecture:</b> PDF p. 2 process cycle; pp. 4–5 resolution/NA;
            p. 7 (slide 8) aerial-image to resist-pattern response; p. 12 (slide 15) DNQ/novolak
            dissolution. The blur/threshold model illustrates those ideas and is not a chemical or
            optical fit.
          </p>
          <p>
            <a
              href="https://fabweb.ece.illinois.edu/gt/gt/gt8.aspx"
              target="_blank"
              rel="noreferrer"
            >
              Illinois ECE444 GT8
            </a>
            : oxidation coefficients and (100) correction.{' '}
            <a
              href="https://fabweb.ece.illinois.edu/gt/gt/gt10.aspx"
              target="_blank"
              rel="noreferrer"
            >
              Illinois ECE444 GT10
            </a>
            : phosphorus Arrhenius diffusivity.{' '}
            <a href="https://toolbox.nanofab.ualberta.ca/sithox/" target="_blank" rel="noreferrer">
              Alberta nanoFAB
            </a>
            : thin dry-oxide limitation and silicon consumption ratio.
          </p>
          <p>
            This course flow forms source/drain before a separately aligned metal gate and uses four
            simple masks and lift-off. In a self-aligned flow the gate or a gate-defining structure
            establishes the source/drain alignment, reducing overlay dependence. Modern CMOS also
            integrates complementary devices, isolation, spacers and more complex gate/contact
            stacks. This is a planar teaching sequence, not a modern CMOS foundry recipe or a yield
            predictor.
          </p>
        </details>
        <footer>
          FABRICATE A MOSFET{' '}
          <span>Deterministic snapshots · Analytical kernels · Geometry-aware failure checks</span>
        </footer>
      </main>
    </div>
  );
}
