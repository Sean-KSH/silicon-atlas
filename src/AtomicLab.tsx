import React, { useMemo, useRef, useState } from 'react';
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
  qe,
  hbar,
  m0,
  wellEnergy,
  wellPsi,
  transmission,
  band,
  chainLevels,
  diamondAtoms,
  diamondBonds,
  Point3,
} from './atomicPhysics';
import { useSvgDrag } from './useSvgDrag';
import './atomic.css';
const fmt = (v: number) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toPrecision(3)).toString());
function Slider({
  name,
  value,
  set,
  min,
  max,
  step = 1,
  unit = '',
}: {
  name: string;
  value: number;
  set: (v: number) => void;
  min: number;
  max: number;
  step?: number | 'any';
  unit?: string;
}) {
  return (
    <label className="al-slider">
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
        onChange={(e) => set(+e.target.value)}
      />
      <small>
        {min} — {max} {unit}
      </small>
    </label>
  );
}
function Plot({
  data,
  x,
  ys,
  label,
  xlabel,
  space = 'position',
  marker,
  log = false,
}: {
  data: Record<string, number>[];
  x: string;
  ys: { key: string; color: string; name: string }[];
  label: string;
  xlabel: string;
  space?: string;
  marker?: number;
  log?: boolean;
}) {
  return (
    <div className={`al-plot ${space === 'wavevector' ? 'al-kplot' : ''}`}>
      <div className="al-plothead">
        <b>{label}</b>
        <span>
          {space === 'wavevector'
            ? 'WAVEVECTOR SPACE'
            : space === 'energy'
              ? 'ENERGY SWEEP'
              : 'REAL SPACE'}
        </span>
      </div>
      <div className="al-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 20, bottom: 30, left: 12 }}>
            <CartesianGrid stroke="#2b3847" strokeDasharray="3 5" />
            <XAxis
              dataKey={x}
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={fmt}
              tick={{ fill: '#aabccc', fontSize: 11 }}
              label={{
                value: xlabel,
                position: 'bottom',
                offset: 10,
                fill: '#b4c8d5',
                fontSize: 12,
              }}
            />
            <YAxis
              width={65}
              scale={log ? 'log' : 'auto'}
              domain={
                log ? [Math.min(0.1, ...data.map((row) => row[ys[0].key])), 1] : ['auto', 'auto']
              }
              tickFormatter={(v) => (log ? Number(v).toExponential(0) : fmt(v))}
              tick={{ fill: '#aabccc', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ background: '#14212e', border: '1px solid #546c7b', fontSize: 12 }}
              formatter={(v, name) => [Number(v).toPrecision(5), name]}
              labelFormatter={(v) => `${x} = ${Number(v).toPrecision(4)}`}
            />
            {marker !== undefined && (
              <ReferenceLine x={marker} stroke="#f1c38c" strokeDasharray="4 4" />
            )}
            {!log && <ReferenceLine y={0} stroke="#506575" />}
            {ys.map((y) => (
              <Line
                key={y.key}
                dataKey={y.key}
                name={y.name}
                stroke={y.color}
                strokeWidth={2.3}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
function Crystal({ deep }: { deep: boolean }) {
  const [angles, setAngles] = useState([-0.5, 0.6]),
    [plane, setPlane] = useState('none'),
    [neighbors, setNeighbors] = useState(true);
  const origin = useRef(angles);
  const drag = useSvgDrag(
    (dx, dy) => setAngles([origin.current[0] + dy * 0.008, origin.current[1] + dx * 0.008]),
    () => {
      origin.current = angles;
    },
  );
  const project = (p: Point3) => {
    const [x, y, z] = p.map((v) => v - 0.5),
      [rx, ry] = angles;
    const X = x * Math.cos(ry) + z * Math.sin(ry),
      Z = -x * Math.sin(ry) + z * Math.cos(ry),
      Y = y * Math.cos(rx) - Z * Math.sin(rx);
    return [330 + X * 235, 205 - Y * 235, y * Math.sin(rx) + Z * Math.cos(rx)];
  };
  const corners: Point3[] = Array.from({ length: 8 }, (_, i) => [
    i & 1 ? 1 : 0,
    i & 2 ? 1 : 0,
    i & 4 ? 1 : 0,
  ]);
  const planes: Record<string, Point3[]> = {
    '(100)': [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    '(110)': [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [1, 0, 1],
    ],
    '(111)': [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  };
  const selected = diamondAtoms.findIndex((p) => p.every((v) => v === 0.25));
  const near = new Set(diamondBonds.filter((b) => b.includes(selected)).flat());
  return (
    <section className="al-section" id="atomic-crystal">
      <div className="al-section-title">
        <span>01 / CRYSTAL STRUCTURE</span>
        <h2>Order in three dimensions.</h2>
        <p>A periodic arrangement of atoms gives silicon its diamond-cubic structure.</p>
      </div>
      <div className="al-layout">
        <aside className="al-card">
          <h3>Explore the unit cell</h3>
          <label className="al-select">
            Miller plane
            <select
              aria-label="Miller plane"
              value={plane}
              onChange={(e) => setPlane(e.target.value)}
            >
              {['none', '(100)', '(110)', '(111)'].map((p) => (
                <option key={p} value={p}>
                  {p === 'none' ? 'No plane' : p}
                </option>
              ))}
            </select>
          </label>
          <label className="al-check">
            <input
              type="checkbox"
              checked={neighbors}
              onChange={(e) => setNeighbors(e.target.checked)}
            />
            Highlight four nearest neighbors
          </label>
          <button
            onClick={() => {
              setAngles([-0.5, 0.6]);
              setPlane('none');
              setNeighbors(true);
            }}
          >
            Reset crystal view
          </button>
          <div className="al-note">
            <b>FCC lattice + two-atom basis</b>
            <p>
              Basis positions: (0, 0, 0) and (¼, ¼, ¼), in units of the cubic lattice constant a.
              Both colors represent silicon.
            </p>
          </div>
          <p>
            Eight corners × ⅛ + six faces × ½ + four interior atoms ={' '}
            <b>8 atoms per conventional cell.</b> This cell is not primitive.
          </p>
          <p>Si: a = 0.543 nm. Nearest-neighbor distance = √3 a / 4 ≈ 0.235 nm.</p>
        </aside>
        <div className="al-card">
          <div className="al-plothead">
            <b>Diamond-cubic silicon</b>
            <span>GEOMETRIC LATTICE</span>
          </div>
          <svg
            viewBox="0 0 660 410"
            className="al-crystal"
            role="group"
            aria-label="Rotatable silicon diamond cubic conventional unit cell"
          >
            <defs>
              <radialGradient id="al-sphere">
                <stop stopColor="#edfff6" />
                <stop offset=".4" stopColor="#9acdbd" />
                <stop offset="1" stopColor="#315c56" />
              </radialGradient>
            </defs>
            <g
              tabIndex={0}
              role="slider"
              aria-label="Rotate crystal horizontally; up and down tilt"
              aria-valuemin={-180}
              aria-valuemax={180}
              aria-valuenow={Math.round(
                (((((angles[1] * 180) / Math.PI + 180) % 360) + 360) % 360) - 180,
              )}
              {...drag.handlers}
              onKeyDown={(e) => {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key))
                  return;
                e.preventDefault();
                setAngles((a) =>
                  e.key === 'Home'
                    ? [-0.5, 0.6]
                    : [
                        a[0] + (e.key === 'ArrowUp' ? 0.1 : e.key === 'ArrowDown' ? -0.1 : 0),
                        a[1] + (e.key === 'ArrowRight' ? 0.1 : e.key === 'ArrowLeft' ? -0.1 : 0),
                      ],
                );
              }}
            >
              <rect width="660" height="410" fill="transparent" />
              {corners.flatMap((p, i) =>
                corners.map((q, j) => {
                  if (j <= i || p.filter((v, k) => v !== q[k]).length !== 1) return null;
                  const a = project(p),
                    b = project(q);
                  return (
                    <line
                      key={`${i}-${j}`}
                      x1={a[0]}
                      y1={a[1]}
                      x2={b[0]}
                      y2={b[1]}
                      stroke="#5e7184"
                      strokeDasharray="4 4"
                    />
                  );
                }),
              )}
              {diamondBonds.map(([i, j]) => {
                const a = project(diamondAtoms[i]),
                  b = project(diamondAtoms[j]),
                  hi = neighbors && (i === selected || j === selected);
                return (
                  <line
                    key={`${i}-${j}`}
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    stroke={hi ? '#f5c184' : '#6b96a6'}
                    strokeWidth={hi ? 5 : 2}
                    opacity={neighbors && !hi ? 0.35 : 0.9}
                  />
                );
              })}
              {planes[plane] && (
                <polygon
                  points={planes[plane].map((p) => project(p).slice(0, 2).join(',')).join(' ')}
                  fill="#d4ae7233"
                  stroke="#f1c18b"
                  strokeWidth="2"
                />
              )}
              {diamondAtoms
                .map((p, i) => ({ p, i, q: project(p) }))
                .sort((a, b) => a.q[2] - b.q[2])
                .map(({ p, i, q }) => (
                  <g key={i}>
                    <circle
                      cx={q[0]}
                      cy={q[1]}
                      r={i === selected && neighbors ? 13 : 10}
                      fill={p.basis ? 'url(#al-sphere)' : '#8baecb'}
                      stroke={neighbors && near.has(i) ? '#f5c184' : '#c9e2e5'}
                      strokeWidth={neighbors && near.has(i) ? 2 : 1}
                      opacity={neighbors && !near.has(i) ? 0.55 : 1}
                    />
                  </g>
                ))}
              {(['x', 'y', 'z'] as const).map((name, i) => {
                const p: Point3 = [0, 0, 0];
                p[i] = 1.2;
                const a = project([0, 0, 0]),
                  b = project(p);
                return (
                  <g key={name}>
                    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#c1d2dd" />
                    <text x={b[0] + 5} y={b[1]}>
                      {name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="al-draghint">
            ↔ Drag to rotate · arrow keys to turn and tilt · Home to reset
          </div>
          <div className="al-key">
            <span>
              <i style={{ background: '#8baecb' }} />
              FCC sites + (0,0,0)
            </span>
            <span>
              <i style={{ background: '#9acdbd' }} />
              FCC sites + (¼,¼,¼)
            </span>
            <span>
              <i style={{ background: '#f5c184' }} />
              Selected tetrahedron / plane
            </span>
          </div>
          <p className="al-note">
            Atom spheres and bond rods are a structural drawing, not electron probability clouds or
            electron trajectories. Bonds crossing the cell boundary continue into adjacent cells.
            The translucent plane is an overlay and does not simulate cutting.
          </p>
          <div className="al-explain">
            <h3>What changed and why?</h3>
            <p>
              {plane === 'none'
                ? 'Rotate the cell to reveal tetrahedral coordination. The highlighted interior silicon atom has four nearest neighbors.'
                : `${plane} selects a representative plane: ${plane === '(100)' ? 'x = a; parallel to y and z.' : plane === '(110)' ? 'x + y = a; parallel to z.' : 'x + y + z = a; intercepts all three axes at a.'} Miller indices are proportional to reciprocal axis intercepts. A zero index means the plane is parallel to that axis.`}{' '}
              Rotation changes only the viewing direction.
            </p>
          </div>
          {deep && (
            <p>
              Each Si contributes four valence electrons to covalent bonds. A shared pair per bond
              is a bonding picture, not four localized classical electron orbits. Parentheses (hkl)
              denote a plane; square brackets [uvw] denote a direction. The two sublattices are
              chemically identical.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
export default function AtomicLab() {
  const [deep, setDeep] = useState(false),
    [resetKey, setResetKey] = useState(0),
    [L, setL] = useState(5),
    [mass, setMass] = useState(1),
    [n, setN] = useState(1),
    [V, setV] = useState(1),
    [d, setD] = useState(1),
    [E, setE] = useState(0.3),
    [t, setT] = useState(0.3),
    [N, setNsites] = useState(12),
    [u, setU] = useState(0),
    [gap, setGap] = useState('direct'),
    [experiment, setExperiment] = useState(0),
    [prediction, setPrediction] = useState(''),
    [reveal, setReveal] = useState(false);
  const a = 0.5e-9,
    l = L * 1e-9,
    m = mass * m0,
    barrier = transmission(E * qe, V * qe, d * 1e-9, m),
    current = band((u * Math.PI) / a, t * qe, a),
    bottomMass = band(0, t * qe, a).mass;
  const well = useMemo(
    () =>
      Array.from({ length: 241 }, (_, i) => {
        const x = (L * i) / 240,
          psi = wellPsi(n, L * 1e-9, x * 1e-9);
        return { x, psi: psi * Math.sqrt(1e-9), density: psi * psi * 1e-9 };
      }),
    [n, L],
  );
  const ts = useMemo(
    () =>
      Array.from({ length: 301 }, (_, i) => {
        const energy = 0.01 + (3.99 * i) / 300;
        return { energy, T: transmission(energy * qe, V * qe, d * 1e-9, m) };
      }),
    [V, d, m],
  );
  const bands = useMemo(
    () =>
      Array.from({ length: 241 }, (_, i) => {
        const u = -1 + i / 120,
          b = band((u * Math.PI) / a, t * qe, a);
        return {
          u,
          energy: b.energy / qe,
          velocity: b.velocity / 1e5,
          curvature: (b.curvature / qe) * 1e18,
        };
      }),
    [t],
  );
  const reset = () => {
    setResetKey((k) => k + 1);
    setL(5);
    setMass(1);
    setN(1);
    setV(1);
    setD(1);
    setE(0.3);
    setT(0.3);
    setNsites(12);
    setU(0);
    setGap('direct');
    setExperiment(0);
    setDeep(false);
    setPrediction('');
    setReveal(false);
  };
  const exportData = () => {
    const rows = [
      'model,x_m,k_per_m,energy_J,psi_per_sqrt_m,probability_per_m,transmission,velocity_m_per_s,curvature_J_m2,well_width_m,mass_kg,barrier_height_J,barrier_width_m,hopping_J,chain_spacing_m,n,N',
    ];
    const add = (fields: (string | number)[]) =>
      rows.push([...fields, l, m, V * qe, d * 1e-9, t * qe, a, n, N].join(','));
    well.forEach((p) =>
      add([
        'well',
        p.x * 1e-9,
        '',
        wellEnergy(n, l, m),
        p.psi / Math.sqrt(1e-9),
        p.density / 1e-9,
        '',
        '',
        '',
      ]),
    );
    ts.forEach((p) => add(['barrier', '', '', p.energy * qe, '', '', p.T, '', '']));
    bands.forEach((p) =>
      add([
        'band',
        '',
        (p.u * Math.PI) / a,
        p.energy * qe,
        '',
        '',
        '',
        p.velocity * 1e5,
        (p.curvature * qe) / 1e18,
      ]),
    );
    chainLevels(N, t * qe).forEach((e) => add(['finite_chain', '', '', e, '', '', '', '', '']));
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })),
      link = document.createElement('a');
    link.href = url;
    link.download = 'atomic-to-bands-SI.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const experiments = [
    {
      title: 'Confinement',
      question:
        'Predict the ground-state energy when the well width doubles. What if the mass also doubles?',
      apply: () => {
        setL(5);
        setMass(0.25);
        setN(1);
      },
      answer:
        'Doubling L reduces every level to one quarter. Doubling m reduces it by another factor of two: together E becomes one eighth. Normalization keeps total probability equal to one.',
    },
    {
      title: 'Tunneling',
      question:
        'With E = 0.3 eV below a 1 eV barrier, what happens when width changes from 0.5 to 1 nm?',
      apply: () => {
        setMass(1);
        setE(0.3);
        setV(1);
        setD(0.5);
      },
      answer:
        'Transmission decreases strongly with width. The evanescent wave must span a longer forbidden region. In the thick-barrier limit T scales approximately as exp(−2κd); reflection plus transmission stays one.',
    },
    {
      title: 'From states to a band',
      question:
        'At zero coupling, where are the N levels? Increase coupling, then compare the bottom and top of the band.',
      apply: () => {
        setT(0);
        setNsites(12);
        setU(0);
      },
      answer:
        'All N orbital energies coincide at E₀ = 0 when hopping is zero. Coupling splits them and the infinite-chain bandwidth is 4t. The band bottom has positive curvature and electron effective mass; the top has negative curvature and negative electron effective mass.',
    },
  ];
  return (
    <div className="atomic-lab">
      <header>
        <a className="brand" href="#atomic">
          <span className="brandmark">Si</span>
          <span>
            SILICON ATLAS<span className="brand-sub">Quantum foundations</span>
          </span>
        </a>
        <button onClick={reset}>Reset lab</button>
      </header>
      <main>
        <div className="al-hero">
          <div className="eyebrow">NEAMEN / CHAPTERS 1—3</div>
          <h1>
            From atomic structure
            <br />
            to energy bands.
          </h1>
          <p>Turn the crystal. Confine a wave. Watch discrete states become a band.</p>
          <div className="al-actions">
            <button className={!deep ? 'active' : ''} onClick={() => setDeep(false)}>
              Beginner
            </button>
            <button className={deep ? 'active' : ''} onClick={() => setDeep(true)}>
              Deeper physics
            </button>
            <button onClick={exportData}>↓ Export calculated data · CSV</button>
          </div>
        </div>
        <nav className="al-sectionnav">
          <a href="#atomic-crystal">
            01 Crystal structure <span>geometry →</span>
          </a>
          <a href="#atomic-quantum">
            02 Quantum foundations <span>bound states →</span>
          </a>
          <a href="#atomic-bands">
            03 Energy bands <span>coupled states</span>
          </a>
        </nav>
        <Crystal key={resetKey} deep={deep} />
        <section className="al-section" id="atomic-quantum">
          <div className="al-section-title">
            <span>02 / QUANTUM FOUNDATIONS</span>
            <h2>Boundaries select the states.</h2>
            <p>
              First confine one particle, then replace confinement with a scattering experiment.
            </p>
          </div>
          <div className="al-layout">
            <aside className="al-card">
              <h3>Infinite square well</h3>
              <Slider
                name="Well width L"
                value={L}
                set={setL}
                min={0.5}
                max={10}
                step={0.1}
                unit="nm"
              />
              <Slider
                name="Effective mass m / m₀"
                value={mass}
                set={setMass}
                min={0.05}
                max={1}
                step="any"
              />
              <Slider name="Quantum number n" value={n} set={setN} min={1} max={6} />
              <button
                onClick={() => {
                  setL(0.5);
                  setMass(1);
                  setN(1);
                }}
              >
                Neamen Example 2.3
              </button>
              <p className="al-note">
                Mass is shared with the barrier experiment. This adjustable scalar mass is a generic
                envelope-model parameter, not an asserted silicon valley mass.
              </p>
              <div className="al-readout">
                <span>Selected energy E{n}</span>
                <strong>
                  {fmt(wellEnergy(n, l, m) / qe)} <small>eV</small>
                </strong>
              </div>
              <p>
                Normalized exactly: ∫₀ᴸ |ψ|² dx = 1.
                <br />
                Interior nodes: {n - 1}.
              </p>
            </aside>
            <div className="al-card">
              <div className="al-plothead">
                <b>Potential energy U(x) + allowed energies</b>
                <span>REAL SPACE · eV vs nm</span>
              </div>
              <svg
                className="al-well"
                viewBox="0 0 680 270"
                role="group"
                aria-label="Infinite well energy diagram. Click energy levels to select state."
              >
                <rect x="70" y="20" width="45" height="210" fill="#ad79542c" />
                <rect x="550" y="20" width="45" height="210" fill="#ad79542c" />
                <path d="M115 24V230H550V24" stroke="#e6b880" strokeWidth="3" fill="none" />
                <text x="80" y="17">
                  U = ∞
                </text>
                <text x="552" y="17">
                  U = ∞
                </text>
                <text x="299" y="251">
                  Position x (nm)
                </text>
                <text x="110" y="250">
                  0
                </text>
                <text x="550" y="250">
                  {fmt(L)}
                </text>
                <text x="280" y="224">
                  U = 0 inside
                </text>
                {Array.from({ length: 6 }, (_, i) => {
                  const j = i + 1,
                    y = 230 - (195 * j * j) / 36;
                  return (
                    <g
                      key={j}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select energy level ${j}`}
                      onClick={() => setN(j)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setN(j);
                        }
                      }}
                      className="al-level"
                    >
                      <path
                        d={`M120 ${y}H545`}
                        stroke={n === j ? '#98dcc7' : '#617c92'}
                        strokeWidth={n === j ? 3 : 1}
                      />
                      <rect x="120" y={y - 10} width="425" height="20" fill="transparent" />
                      <text x="15" y={y + 4}>
                        {fmt(wellEnergy(j, l, m) / qe)}
                      </text>
                      <text x="605" y={y + 4}>
                        n={j}
                      </text>
                    </g>
                  );
                })}
                <text x="15" y="16">
                  E (eV)
                </text>
              </svg>
              <p className="al-note">
                Energy axis rescales to E₆. Infinite walls are symbolic; their drawn height is not a
                finite barrier. Choose n with the slider or energy lines.
              </p>
              <div className="al-two">
                <Plot
                  data={well}
                  x="x"
                  ys={[{ key: 'psi', color: '#98dcc7', name: 'ψ (nm⁻½)' }]}
                  label="Wavefunction ψ (nm⁻½)"
                  xlabel="Position x (nm)"
                />
                <Plot
                  data={well}
                  x="x"
                  ys={[{ key: 'density', color: '#e6b880', name: '|ψ|² (nm⁻¹)' }]}
                  label="Probability density |ψ|² (nm⁻¹)"
                  xlabel="Position x (nm)"
                />
              </div>
              <div className="al-explain">
                <h3>What changed and why?</h3>
                <p>
                  A {L} nm well and mass {fmt(mass)} m₀ give E₁ = {fmt(wellEnergy(1, l, m) / qe)}{' '}
                  eV. Increasing width lowers energies as 1/L²; increasing mass lowers them as 1/m.
                  State {n} has {n - 1} interior nodes. The wavefunction can be negative;
                  probability density cannot.
                </p>
              </div>
              <p>
                The infinite wall imposes ψ(0) = ψ(L) = 0. Only standing waves fitting both
                boundaries are allowed. These are stationary states: |ψ|² is time independent, and
                no moving dot represents the electron.
              </p>
              {deep && (
                <p>
                  ψ is continuous at the infinite walls, but its derivative need not be. An overall
                  phase of ψ is unobservable. A single real stationary eigenfunction carries zero
                  probability current; these plots do not depict conventional electric current or
                  electric potential.
                </p>
              )}
            </div>
          </div>
          <div className="al-layout al-subsection">
            <aside className="al-card">
              <h3>Rectangular barrier</h3>
              <Slider
                name="Barrier height U₀"
                value={V}
                set={setV}
                min={0}
                max={3}
                step={0.05}
                unit="eV"
              />
              <Slider
                name="Barrier width d"
                value={d}
                set={setD}
                min={0}
                max={3}
                step={0.05}
                unit="nm"
              />
              <Slider
                name="Incident energy E"
                value={E}
                set={setE}
                min={0.01}
                max={4}
                step={0.01}
                unit="eV"
              />
              <div className="al-actions">
                <button onClick={() => setE(V || 0.01)}>
                  E = U₀ {V === 0 ? '(use 0.01 eV)' : ''}
                </button>
                <button onClick={() => setD(0)}>Zero width</button>
              </div>
              <p>
                Mass: {fmt(mass)} m₀, controlled above. Incident particles come from the left; the
                exterior potential energy is zero on both sides.
              </p>
              <div className="al-readout">
                <span>Transmitted flux / incident flux</span>
                <strong>{barrier.toPrecision(4)}</strong>
                <span>Reflected fraction R = {(1 - barrier).toPrecision(4)}</span>
              </div>
            </aside>
            <div className="al-card">
              <div className="al-plothead">
                <b>Barrier scattering · U(x), E (eV)</b>
                <span>REAL SPACE</span>
              </div>
              <svg
                viewBox="0 0 680 230"
                role="img"
                aria-label={`Barrier ${V} electron volts by ${d} nanometers, incident energy ${E} electron volts`}
              >
                <path
                  d={
                    d === 0 ? 'M65 185H620' : `M65 185H210V${185 - V * 37}H${210 + d * 90}V185H620`
                  }
                  fill="none"
                  stroke="#e6b880"
                  strokeWidth="3"
                />
                <path
                  d={`M65 ${185 - E * 37}H620`}
                  stroke="#98dcc7"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text x="15" y={189 - E * 37}>
                  {fmt(E)}
                </text>
                <text x="220" y={175 - V * 37}>
                  {d === 0 ? 'Zero-width barrier' : `U₀ = ${fmt(V)} eV`}
                </text>
                <text x="70" y="25">
                  E → incident energy
                </text>
                <path d="M85 160H175L165 154M175 160L165 166" stroke="#98dcc7" fill="none" />
                <text x="65" y="208">
                  −1.6
                </text>
                <text x="205" y="208">
                  0
                </text>
                <text x="610" y="208">
                  4.6
                </text>
                <text x="290" y="226">
                  Position x (nm)
                </text>
                {d >= 0.3 && (
                  <text x={210 + d * 90} y="208">
                    {fmt(d)}
                  </text>
                )}
              </svg>
              <div className="al-flux">
                <span style={{ flex: barrier, background: '#70bea8' }} />
                <span style={{ flex: 1 - barrier, background: '#927caa' }} />
              </div>
              <p className="al-note">
                Computed flux fractions: green T, purple R. T + R = 1 for this lossless, equal-mass
                scattering problem. Arrows indicate incident particle direction, not electron paths
                or conventional current.
              </p>
              <Plot
                data={ts}
                x="energy"
                ys={[{ key: 'T', color: '#98dcc7', name: 'Transmission T' }]}
                label="Transmission T · logarithmic axis"
                xlabel="Incident energy E (eV)"
                space="energy"
                marker={E}
                log
              />
              <div className="al-explain">
                <h3>What changed and why?</h3>
                <p>
                  {d === 0 || V === 0
                    ? 'The barrier disappears: transmission equals one at every positive incident energy.'
                    : E < V
                      ? 'E < U₀: the wave is evanescent inside the barrier, yet a finite transmitted flux emerges. Widening the barrier suppresses tunneling.'
                      : E === V
                        ? 'E = U₀: the formula uses its finite analytical limit. Transmission is generally less than one.'
                        : 'E > U₀: propagation is allowed inside, but boundary reflections can still occur. Interference produces perfect-transmission resonances.'}{' '}
                  The exact matched-boundary result is used, including near E = U₀.
                </p>
              </div>
              {deep && (
                <p>
                  At both finite steps, ψ and dψ/dx are continuous for the same constant mass in all
                  regions. There is no wave incident from the right. T is a flux ratio, not a
                  normalized spatial probability density. No decoherence, absorption,
                  self-consistent charging or mass discontinuity is modeled.
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="al-section" id="atomic-bands">
          <div className="al-section-title">
            <span>03 / BANDS · 1D TIGHT-BINDING TOY MODEL</span>
            <h2>Many states. One band.</h2>
            <p>
              Couple identical orbitals in a chain. Follow energy, slope, and curvature in
              wavevector space.
            </p>
          </div>
          <div className="al-layout">
            <aside className="al-card">
              <h3>Coupled atomic states</h3>
              <Slider
                name="Hopping energy t"
                value={t}
                set={setT}
                min={0}
                max={1}
                step={0.01}
                unit="eV"
              />
              <Slider name="Number of sites N" value={N} set={setNsites} min={2} max={40} />
              <Slider
                name="Selected wavevector ka / π"
                value={u}
                set={setU}
                min={-1}
                max={1}
                step="any"
              />
              <div className="al-actions">
                <button onClick={() => setU(0)}>Band minimum</button>
                <button onClick={() => setU(0.5)}>Inflection</button>
                <button onClick={() => setU(1)}>Band maximum</button>
              </div>
              <p>
                Chosen chain spacing aₜ = 0.5 nm; orbital energy E₀ = 0. These are toy-model
                parameters, independent of silicon’s cubic lattice constant.
              </p>
              <div className="al-readout">
                <span>Electron curvature mass m* / m₀</span>
                <strong>{current.mass === null ? 'Undefined' : fmt(current.mass / m0)}</strong>
                <span>
                  {current.mass === null
                    ? 'Zero curvature: inverse mass is zero.'
                    : current.mass < 0
                      ? 'Negative curvature near a band maximum.'
                      : 'Positive curvature near a band minimum.'}
                </span>
              </div>
              <button
                disabled={bottomMass === null || bottomMass / m0 < 0.05 || bottomMass / m0 > 1}
                onClick={() => {
                  if (bottomMass !== null) setMass(bottomMass / m0);
                }}
              >
                Use band-bottom mass in the well
              </button>
              <p className="al-note">
                Optional teaching link: transfers the scalar band-bottom mass only when within the
                well’s 0.05–1 m₀ range. Does not turn the well into a silicon prediction.
              </p>
            </aside>
            <div className="al-card">
              <div className="al-plothead">
                <b>One orbital per site → N split levels</b>
                <span>CALCULATED · OPEN CHAIN</span>
              </div>
              <svg
                viewBox="0 0 680 240"
                role="img"
                aria-label={`${N} coupled levels, hopping ${t} electron volts`}
              >
                <text x="55" y="24">
                  Isolated orbitals
                </text>
                <text x="320" y="24">
                  Finite chain · N = {N}
                </text>
                <text x="540" y="24">
                  Infinite chain
                </text>
                <line x1="70" x2="200" y1="120" y2="120" stroke="#9bc5d8" strokeWidth="3" />
                <text x="75" y="145">
                  E₀ = 0
                </text>
                <path d="M230 120H290M280 114L290 120L280 126" fill="none" stroke="#afbed1" />
                {chainLevels(N, t * qe).map((e, i) => (
                  <line
                    key={i}
                    x1="330"
                    x2="460"
                    y1={120 - (e / qe) * 42}
                    y2={120 - (e / qe) * 42}
                    stroke="#a99cd6"
                    opacity=".8"
                  />
                ))}
                <rect
                  x="555"
                  y={120 - 2 * t * 42}
                  width="65"
                  height={Math.max(0.8, 4 * t * 42)}
                  fill="#a99cd655"
                  stroke="#a99cd6"
                />
                <text x="535" y="220">
                  Width = {fmt(4 * t)} eV
                </text>
                <text x="15" y="42">
                  +2 eV
                </text>
                <text x="15" y="208">
                  −2 eV
                </text>
              </svg>
              <p className="al-note">
                The level diagram uses a fixed −2 to +2 eV scale. N counts orbitals (spin omitted);
                increasing N adds levels inside the same limiting band. E(k) below is the infinite
                periodic chain, not a numerical fit to these finite levels.
              </p>
              <Plot
                data={bands}
                x="u"
                ys={[{ key: 'energy', color: '#b4a0e2', name: 'Energy (eV)' }]}
                label="Dispersion E(k) (eV)"
                xlabel="Wavevector kaₜ / π (dimensionless)"
                space="wavevector"
                marker={u}
              />
              <div className="al-two">
                <Plot
                  data={bands}
                  x="u"
                  ys={[{ key: 'velocity', color: '#98dcc7', name: 'Group velocity (10⁵ m/s)' }]}
                  label="Group velocity (10⁵ m/s)"
                  xlabel="kaₜ / π"
                  space="wavevector"
                  marker={u}
                />
                <Plot
                  data={bands}
                  x="u"
                  ys={[{ key: 'curvature', color: '#e6b880', name: 'Curvature (eV nm²)' }]}
                  label="Curvature d²E/dk² (eV·nm²)"
                  xlabel="kaₜ / π"
                  space="wavevector"
                  marker={u}
                />
              </div>
              <div className="al-explain">
                <h3>What changed and why?</h3>
                <p>
                  {t === 0
                    ? 'At zero hopping, all atomic levels coincide. The band is flat, group velocity and curvature are zero, and a finite curvature mass cannot be assigned.'
                    : `Hopping t = ${fmt(t)} eV produces a limiting bandwidth of ${fmt(4 * t)} eV. At kaₜ/π = ${fmt(u)}, group velocity is ${fmt(current.velocity)} m/s. ${current.mass === null ? 'At the inflection, curvature is zero and the mass expression diverges.' : current.mass < 0 ? 'Negative curvature gives a negative electron effective mass.' : 'Positive curvature gives a positive electron effective mass.'}`}{' '}
                  A negative effective mass describes response to an external force; it does not
                  mean negative rest mass.
                </p>
              </div>
              <p>
                <b>Why holes?</b> In a nearly full band, the filled-band velocities cancel. Removing
                an electron leaves a current contribution equivalent to a positive charge. Near the
                valence-band maximum, a hole has positive effective mass. The electron remains
                negatively charged even where its curvature mass is negative.
              </p>
              {deep && (
                <p>
                  Semiclassical relations: ℏ dk/dt = F and v = (1/ℏ)dE/dk. For an electron F = −qℰ,
                  so acceleration = −qℰ/m*. A hole near a maximum has mₕ* = −mₑ* &gt; 0. Group
                  velocity is particle velocity; conventional electron current has the opposite
                  sign. No electric field or occupied-state distribution is imposed in these plots.
                </p>
              )}
            </div>
          </div>
          <div className="al-card al-gap">
            <div className="al-plothead">
              <b>Direct vs indirect gaps</b>
              <span>SEPARATE SCHEMATIC · NOT TIGHT-BINDING OUTPUT</span>
            </div>
            <div className="al-actions">
              <button className={gap === 'direct' ? 'active' : ''} onClick={() => setGap('direct')}>
                Direct
              </button>
              <button
                className={gap === 'indirect' ? 'active' : ''}
                onClick={() => setGap('indirect')}
              >
                Indirect
              </button>
            </div>
            <svg
              viewBox="0 0 680 240"
              role="img"
              aria-label={`${gap} bandgap schematic, energy versus wavevector`}
            >
              <path d="M80 20V205H625" stroke="#718497" fill="none" />
              <text x="22" y="30">
                Energy
              </text>
              <text x="520" y="227">
                Wavevector k →
              </text>
              <path d="M130 197Q340 90 550 197" stroke="#b4a0e2" fill="none" strokeWidth="3" />
              <path
                d={gap === 'direct' ? 'M170 40Q340 155 510 40' : 'M290 40Q460 155 630 40'}
                stroke="#98dcc7"
                fill="none"
                strokeWidth="3"
              />
              <path
                d={`M340 143L${gap === 'direct' ? 340 : 460} 98`}
                stroke="#e6b880"
                strokeDasharray="5 4"
              />
              <circle cx="340" cy="143.5" r="5" fill="#b4a0e2" />
              <circle cx={gap === 'direct' ? 340 : 460} cy="97.5" r="5" fill="#98dcc7" />
              <text x="95" y="120">
                CB
              </text>
              <text x="95" y="178">
                VB
              </text>
              <text x="390" y="180">
                {gap === 'direct' ? 'Same k at both extrema' : 'Different k at the extrema'}
              </text>
            </svg>
            <p>
              {gap === 'direct'
                ? 'A direct gap has conduction-band minimum and valence-band maximum at the same wavevector. Optical transitions can approximately conserve k because photon momentum is small.'
                : 'An indirect gap has extrema at different wavevectors. Near-edge optical transitions generally require phonon participation to conserve crystal momentum. Silicon is indirect, but these curves do not model its valleys or gap size.'}{' '}
              Curves and gap size here are schematic, with no numerical axes. This one-orbital toy
              band does not generate both silicon valence and conduction bands.
            </p>
          </div>
        </section>
        <section className="al-card al-experiments">
          <div className="eyebrow">THREE GUIDED EXPERIMENTS</div>
          <h2>Predict. Adjust. Explain.</h2>
          <div className="al-actions">
            {experiments.map((e, i) => (
              <button
                key={i}
                className={experiment === i ? 'active' : ''}
                onClick={() => {
                  setExperiment(i);
                  setReveal(false);
                  setPrediction('');
                }}
              >
                {i + 1}. {e.title}
              </button>
            ))}
          </div>
          <h3>{experiments[experiment].question}</h3>
          <textarea
            aria-label="Atomic lab prediction"
            placeholder="Write your prediction before applying the starting settings…"
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
          />
          <div className="al-actions">
            <button onClick={experiments[experiment].apply}>Apply starting settings</button>
            <button onClick={() => setReveal((v) => !v)}>
              {reveal ? 'Hide' : 'Reveal'} explanation
            </button>
          </div>
          {reveal && <p>{experiments[experiment].answer}</p>}
        </section>
        <details className="al-card al-reference" open={deep}>
          <summary>Equations, symbols & validity</summary>
          <h3>Infinite well · analytical stationary states</h3>
          <div className="al-formula">
            Eₙ = ℏ²π²n² / (2mL²)
            <br />
            ψₙ(x) = √(2/L) sin(nπx/L), 0 &lt; x &lt; L; ψ = 0 outside
            <br />U = 0 inside, U = ∞ outside; ∫ |ψₙ|² dx = 1
          </div>
          <p>
            n: positive integer state index (1–6 shown); L: well width (0.5–10 nm); m: positive
            constant effective mass (0.05–1 m₀); x: position; Eₙ: allowed energy measured from the
            well bottom; ψ: spatial wavefunction (m⁻½ internally); |ψ|²: probability per unit length
            (m⁻¹). No finite-wall leakage, many-body interaction, or material-specific band offsets.
          </p>
          <h3>Rectangular barrier · exact flux transmission</h3>
          <div className="al-formula">
            E &lt; U₀: T = [1 + U₀² sinh²(κd) / (4E(U₀−E))]⁻¹
            <br />E &gt; U₀: T = [1 + U₀² sin²(βd) / (4E(E−U₀))]⁻¹
            <br />κ = √[2m(U₀−E)] / ℏ; β = √[2m(E−U₀)] / ℏ<br />E = U₀ &gt; 0: T = [1 +
            mU₀d²/(2ℏ²)]⁻¹; R = 1−T
          </div>
          <p>
            U₀: barrier potential energy (0–3 eV), zero in the leads; d: width (0–3 nm); E: incident
            energy (0.01–4 eV); κ: inverse decay length; β: internal wave number; T and R:
            transmitted and reflected flux fractions. Equal mass and exterior potential on both
            sides, coherent elastic stationary scattering. At zero width or height T = 1. A
            continuous sinc/sinhc evaluation handles E = U₀ without division by zero; no clamping of
            computed transmission.
          </p>
          <h3>One orbital per site · nearest-neighbor tight binding</h3>
          <div className="al-formula">
            H = E₀ Σⱼ |j⟩⟨j| − t Σⱼ (|j⟩⟨j+1| + h.c.)
            <br />
            E(k) = E₀ − 2t cos(kaₜ)
            <br />
            v(k) = 2taₜ sin(kaₜ)/ℏ
            <br />
            d²E/dk² = 2taₜ² cos(kaₜ); m* = ℏ² / (d²E/dk²)
            <br />
            Finite open chain: Eⱼ = E₀ − 2t cos[jπ/(N+1)], j = 1,…,N
          </div>
          <p>
            H: Hamiltonian; |j⟩: orthonormal localized orbital at site j; h.c.: Hermitian-conjugate
            hopping term; E₀ = 0: energy reference; t: nonnegative hopping magnitude (0–1 eV); aₜ =
            0.5 nm: chosen chain spacing; k: wavevector in the first Brillouin zone [−π/aₜ, π/aₜ];
            N: site count (2–40); v: group velocity; m*: signed electron curvature mass. The finite
            chain has open ends; the continuous dispersion describes an infinite periodic chain.
            Spin, multiple orbitals, filling, interactions and actual silicon bands are excluded. At
            zero curvature inverse mass is zero; finite m* is undefined.
          </p>
          <p>
            Constants: q = 1.602176634×10⁻¹⁹ C, ℏ = 1.054571817×10⁻³⁴ J·s, m₀ = 9.1093837015×10⁻³¹
            kg. SI internally; eV × q → J, nm × 10⁻⁹ → m. ℰ denotes electric field, φ electric
            potential, U = −qφ electron electrostatic energy. These diagrams show energy, not
            voltage. Curvature converts from J·m² to eV·nm² by ×10¹⁸/q.
          </p>
          <p>
            All calculations are closed-form; there is no numerical eigenvalue or time-step solver.
            Plot samples are not solution grids. Invalid physical inputs are rejected by the
            calculation functions. The 3D lattice view projects exact fractional coordinates; depth
            sorting and translucent planes are illustrative rendering choices.
          </p>
        </details>
        <details className="al-card al-reference">
          <summary>Sources, chapter alignment & model distinctions</summary>
          <p>
            <b>Neamen, Semiconductor Physics and Devices, Fourth Edition:</b> §§1.3–1.5, printed pp.
            3–14 (PDF pp. 28–39): unit cells, Miller indices, diamond structure and bonding; §2.2.3,
            pp. 33–34 (PDF 58–59): boundary conditions; §2.3.2, pp. 36–39 (PDF 61–64): infinite well
            and Example 2.3; §2.3.4, pp. 44–46 (PDF 69–71): barrier tunneling. §§3.1.1–3.1.3, pp.
            59–72 (PDF 84–97): bands and k space; §§3.2.3–3.2.4, pp. 75–80 (PDF 100–105): effective
            mass and holes; §3.3.1, pp. 83–85 (PDF 108–110): actual semiconductor E–k diagrams.
          </p>
          <p>
            <b>Course Topic 2 — Basic SC considerations+IM:</b> PDF pp. 9, 13–18, 25–29 support
            covalent bonds, quantum states, bonding/antibonding splitting, diamond coordination and
            band formation.
          </p>
          <p>
            <b>Explicit distinctions:</b> Neamen Eq. 2.63 is a thick-barrier tunneling
            approximation; this lab solves the same rectangular geometry using exact
            matched-boundary transmission, including above-barrier energies and the threshold limit.
            Neamen §3.1.2 uses Kronig–Penney; the requested nearest-neighbor tight-binding model
            here is a separate analytical teaching model. The course’s multi-orbital silicon bond
            picture is not quantitatively reproduced by a one-orbital chain. No numerical silicon
            gap is inferred from it.
          </p>
          <p>
            <b>Notation caution:</b> The text uses V(x) for potential energy; here U(x)
            distinguishes energy from electric potential φ. Course slide 34’s phrase “lower
            potential … (+ point)” is ambiguous: an electron’s lower electrostatic energy
            corresponds to higher electric potential because U = −qφ. No drift animation is inferred
            from that wording.
          </p>
        </details>
        <footer>
          ATOMIC → QUANTUM → BANDS{' '}
          <span>Calculated analytical models · Explicit schematic boundaries</span>
        </footer>
      </main>
    </div>
  );
}
