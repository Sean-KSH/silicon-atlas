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
import { growthConstants as g, growthModel, growthAt, growthSeries, growthCsv } from './growth';
import './growth.css';
import { useSvgDrag } from './useSvgDrag';
export default function GrowthLab() {
  const [superheat, setSuperheat] = useState(20),
    [pull, setPull] = useState(0.8),
    [time, setTime] = useState(0),
    [running, setRunning] = useState(false),
    [rate, setRate] = useState(600),
    [quantity, setQuantity] = useState<'lengthMm' | 'massKg'>('lengthMm');
  const dragStartTime = useRef(0);
  const crystalDrag = useSvgDrag(
    (_dx, dy) =>
      setTime(Math.max(0, Math.min(g.durationS, dragStartTime.current - dy / ((0.7 * pull) / 60)))),
    () => {
      dragStartTime.current = time;
      setRunning(false);
    },
  );
  const result = useMemo(() => {
    try {
      return {
        model: growthModel({ meltK: g.meltingK + superheat, pullMps: (pull * 1e-3) / 60 }),
        error: '',
      };
    } catch (e) {
      return { model: null, error: String(e) };
    }
  }, [superheat, pull]);
  useEffect(() => {
    if (!running) return;
    let frame = 0,
      last: number | undefined;
    const tick = (now: number) => {
      if (last !== undefined) {
        const elapsed = (now - last) / 1000;
        setTime((t) => Math.min(g.durationS, t + elapsed * rate));
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const hide = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [running, rate]);
  useEffect(() => {
    if (time >= g.durationS) setRunning(false);
  }, [time]);
  const restart = () => {
    setRunning(false);
    setTime(0);
  };
  const preset = (s: number, p: number) => {
    restart();
    setSuperheat(s);
    setPull(p);
  };
  const series = useMemo(() => (result.model ? growthSeries(result.model) : []), [result.model]);
  if (!result.model)
    return (
      <section className="panel growth-lab">
        <h2>Thermal model unavailable</h2>
        <p role="alert">{result.error}</p>
        <button onClick={() => preset(20, 0.8)}>Restore supported settings</button>
      </section>
    );
  const m = result.model,
    r = growthAt(m, time),
    scale = 0.7,
    diameter = m.diameter * 1000 * scale,
    height = r.length * 1000 * scale,
    left = 330 - diameter / 2,
    top = 310 - height;
  const baseline = growthModel({ meltK: 1707, pullMps: 0.8e-3 / 60 });
  const unit = quantity === 'lengthMm' ? 'mm' : 'kg';
  return (
    <section className="growth-lab" id="growth-lab">
      <div className="analysis-title">
        <div>
          <span className="eyebrow">ANIMATED THERMAL EXPERIMENT</span>
          <h2>Temperature. Pull speed. Ingot growth.</h2>
        </div>
        <span className="pill">CALCULATED BODY GROWTH</span>
      </div>
      <p className="growth-intro">
        Explore the steady cylindrical body compatible with a fixed heat-removal budget. This is a
        teaching heat-balance model, not a calibrated Czochralski process simulator.
      </p>
      <div className="growth-grid">
        <aside className="panel controls">
          <div className="eyebrow">CONSTANT-CONDITION RUN</div>
          <h2>Operating conditions</h2>
          <label>
            Melt temperature
            <strong>
              {(g.meltingK + superheat - 273.15).toFixed(1)} <small>°C</small>
            </strong>
            <input
              aria-label="Growth melt temperature"
              type="range"
              min="0"
              max="80"
              step="1"
              value={superheat}
              onChange={(e) => {
                restart();
                setSuperheat(+e.target.value);
              }}
            />
            <span className="range">
              <span>Melting point</span>
              <span>+80 K</span>
            </span>
            <span className="growth-detail">
              {g.meltingK + superheat} K · superheat ΔT = {superheat} K
            </span>
          </label>
          <label>
            Pull speed
            <strong>
              {pull.toFixed(2)} <small>mm/min</small>
            </strong>
            <input
              aria-label="Growth pull speed"
              type="range"
              min=".2"
              max="2"
              step=".05"
              value={pull}
              onChange={(e) => {
                restart();
                setPull(+e.target.value);
              }}
            />
            <span className="range">
              <span>0.20 mm/min</span>
              <span>2.00 mm/min</span>
            </span>
          </label>
          <div className="growth-fixed">
            <span>
              Fixed cooling budget <b>600 W</b>
            </span>
            <span>
              Melt-side coefficient <b>500 W/(m²·K)</b>
            </span>
            <span>
              Initial melt charge <b>5 kg</b>
            </span>
            <small>Chosen teaching boundary conditions; not measured furnace parameters.</small>
          </div>
          <h3>Compare operating points</h3>
          <div className="presets">
            <button onClick={() => preset(20, 0.8)}>Baseline · +20 K / 0.8 mm/min</button>
            <button onClick={() => preset(80, 0.8)}>Hotter melt · +80 K</button>
            <button onClick={() => preset(20, 1.6)}>Faster pull · 1.6 mm/min</button>
          </div>
          <p className="note">
            Changing conditions resets time. Each run assumes a newly established constant-diameter
            body; startup, neck, shoulder and transient shape changes are excluded.
          </p>
        </aside>
        <div className="panel growth-stage">
          <div className="sectiontop">
            <div>
              <div className="eyebrow">FIGURE 07 / TIME-RESOLVED VIEW</div>
              <h2>Growing body at {Math.floor(time / 60)} min</h2>
            </div>
            <span className="growth-status">
              {time >= g.durationS ? 'Run complete' : running ? 'Playing' : 'Paused'} · {rate}× time
            </span>
          </div>
          <div className="growth-drawing">
            <svg
              viewBox="0 0 800 410"
              role="group"
              aria-label={`Calculated cylindrical ingot: diameter ${(m.diameter * 1000).toFixed(1)} millimeters, length ${(r.length * 1000).toFixed(1)} millimeters at ${(time / 60).toFixed(1)} minutes`}
            >
              <defs>
                <linearGradient id="grown-metal">
                  <stop stopColor="#24364b" />
                  <stop offset=".3" stopColor="#7f98ac" />
                  <stop offset=".48" stopColor="#cedce4" />
                  <stop offset=".68" stopColor="#6d859a" />
                  <stop offset="1" stopColor="#23364c" />
                </linearGradient>
                <linearGradient id="growth-melt" x2="0" y2="1">
                  <stop stopColor="#e2b979" />
                  <stop offset="1" stopColor="#956237" />
                </linearGradient>
              </defs>
              <path
                d="M220 291V341Q220 362 244 362H416Q440 362 440 341V291"
                fill="#293b49"
                stroke="#8ea7b9"
                strokeWidth="3"
              />
              <path
                d="M228 310H432V339Q432 353 416 353H244Q228 353 228 339Z"
                fill="url(#growth-melt)"
              />
              <path d="M228 310H432" stroke="#f6dbab" strokeWidth="2" />
              <g
                className={`crystal-drag ${crystalDrag.dragging ? 'is-dragging' : ''}`}
                role="slider"
                tabIndex={0}
                aria-label="Drag crystal to scrub growth time"
                aria-valuemin={0}
                aria-valuemax={180}
                aria-valuenow={Math.round(time / 60)}
                aria-valuetext={`${(time / 60).toFixed(1)} minutes; ${(r.length * 1000).toFixed(1)} millimeters long`}
                {...crystalDrag.handlers}
                onKeyDown={(e) => {
                  if (
                    !['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(
                      e.key,
                    )
                  )
                    return;
                  e.preventDefault();
                  setRunning(false);
                  setTime((t) =>
                    e.key === 'Home'
                      ? 0
                      : e.key === 'End'
                        ? g.durationS
                        : Math.max(
                            0,
                            Math.min(
                              g.durationS,
                              t +
                                (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) *
                                  (e.shiftKey ? 600 : 60),
                            ),
                          ),
                  );
                }}
              >
                <rect
                  className="crystal-hit"
                  x={left - 12}
                  y={top - 30}
                  width={diameter + 24}
                  height={Math.max(height + 30, 48)}
                  rx="8"
                  fill="transparent"
                />
                {time > 0 && (
                  <>
                    <rect
                      x={left}
                      y={top}
                      width={diameter}
                      height={height}
                      fill="url(#grown-metal)"
                      stroke="#aecbdc"
                    />
                    <line
                      x1={left + diameter * 0.35}
                      x2={left + diameter * 0.35}
                      y1={top}
                      y2="310"
                      stroke="#e3f4ff"
                      opacity=".2"
                    />
                  </>
                )}
                <path
                  d={`M${left} ${top}H${left + diameter}`}
                  stroke="#aecbdc"
                  strokeDasharray={time === 0 ? '4 3' : undefined}
                />
                <rect x="325" y={top - 18} width="10" height="18" fill="#c4d4df" />
              </g>
              <path d={`M330 18V${top - 18}`} stroke="#9ab2c5" strokeWidth="4" />
              <text x="342" y={top - 5} className="figure-sub">
                Seed / pre-grown support
              </text>
              <path
                d={`M${left} 378H${left + diameter}M${left} 373V383M${left + diameter} 373V383`}
                stroke="#aecbdc"
              />
              <text x="330" y="401" textAnchor="middle" className="figure-label">
                D = {(m.diameter * 1000).toFixed(1)} mm
              </text>
              <path
                d={`M${left - 25} ${top}V310M${left - 30} ${top}H${left - 20}M${left - 30} 310H${left - 20}`}
                stroke="#a6c1d3"
              />
              <text x={left - 35} y={(top + 310) / 2} textAnchor="end" className="figure-label">
                {(r.length * 1000).toFixed(1)} mm
              </text>
              <text x="40" y="35" className="figure-sub">
                BODY SCALE · 100 mm
              </text>
              <path d="M40 48H110M40 43V53M110 43V53" stroke="#9eb8cb" />
              <path
                d="M490 135V80M484 88L490 80L496 88"
                stroke="#9fcac0"
                strokeWidth="2"
                fill="none"
              />
              <text x="510" y="95" className="figure-label">
                Heat removed
              </text>
              <text x="510" y="115" className="figure-sub">
                Qout = 600 W (fixed)
              </text>
              <path
                d="M490 275V220M484 228L490 220L496 228"
                stroke="#e8bf81"
                strokeWidth="2"
                fill="none"
              />
              <text x="510" y="232" className="figure-label">
                Heat from melt
              </text>
              <text x="510" y="252" className="figure-sub">
                Qin = {m.liquidHeat.toFixed(1)} W
              </text>
              <text x="510" y="310" className="figure-label">
                Interface: 1687 K
              </text>
              <text x="510" y="332" className="figure-sub">
                Bulk melt: {m.meltK} K
              </text>
              <text x="40" y="365" className="figure-sub">
                Level maintained
              </text>
            </svg>
          </div>
          <div className="drag-instruction">
            <span className="drag-icon">↕</span>
            <div>
              <b>
                {crystalDrag.dragging
                  ? 'Pulling crystal · plots synchronized'
                  : 'Grab the crystal and pull upward'}
              </b>
              <span>
                Drag to explore growth time at the selected pull speed. Arrow keys: 1 min · Shift:
                10 min.
              </span>
            </div>
          </div>
          <p className="caption">
            Dragging scrubs the calculated time history; it does not apply a force or change pull
            speed. Body width and length use the same fixed spatial scale and the computed model.
            Hardware and seed are schematic. Motion is accelerated {rate}×; 1 real second represents{' '}
            {rate / 60} simulated minutes. No crystal-quality or defect animation is implied.
          </p>
          <div className="playback">
            <button
              className="primary"
              onClick={() => {
                if (time >= g.durationS) setTime(0);
                setRunning(!running);
              }}
            >
              {running ? 'Pause' : 'Play growth'}
            </button>
            <button onClick={restart}>Reset time</button>
            <label>
              Playback speed
              <select
                aria-label="Growth playback speed"
                value={rate}
                onChange={(e) => setRate(+e.target.value)}
              >
                <option value={60}>60× · 1 min/s</option>
                <option value={600}>600× · 10 min/s</option>
                <option value={1200}>1200× · 20 min/s</option>
              </select>
            </label>
            <span>{(time / 60).toFixed(1)} / 180 min</span>
          </div>
          <label className="time-scrub">
            Simulation time
            <input
              aria-label="Growth simulation time"
              type="range"
              min="0"
              max="10800"
              step="1"
              value={time}
              onChange={(e) => {
                setRunning(false);
                setTime(+e.target.value);
              }}
            />
          </label>
          <div className="metrics">
            <div>
              <span>Steady body diameter</span>
              <strong>
                {(m.diameter * 1000).toFixed(1)} <small>mm</small>
              </strong>
            </div>
            <div>
              <span>Body length at current time</span>
              <strong>
                {(r.length * 1000).toFixed(1)} <small>mm</small>
              </strong>
            </div>
            <div>
              <span>Solidified body mass</span>
              <strong>
                {r.mass.toFixed(3)} <small>kg</small>
              </strong>
            </div>
          </div>
          <div className="heat-budget">
            <div>
              <span>Cooling budget</span>
              <b>
                {m.latentHeat.toFixed(1)} W latent + {m.liquidHeat.toFixed(1)} W melt heat = 600 W
              </b>
            </div>
            <div className="heat-track">
              <span style={{ width: `${(m.latentHeat / g.coolingW) * 100}%` }} />
              <span style={{ width: `${(m.liquidHeat / g.coolingW) * 100}%` }} />
            </div>
            <small>
              Green: solidification heat · Amber: incoming melt heat · Power-balance residual:{' '}
              {m.residual.toExponential(1)} W
            </small>
          </div>
          <div className="plothead">
            <div className="tabs">
              <button
                className={quantity === 'lengthMm' ? 'selected' : ''}
                onClick={() => setQuantity('lengthMm')}
              >
                Body length
              </button>
              <button
                className={quantity === 'massKg' ? 'selected' : ''}
                onClick={() => setQuantity('massKg')}
              >
                Solid mass
              </button>
            </div>
            <button
              onClick={() => {
                const u = URL.createObjectURL(new Blob([growthCsv(m)], { type: 'text/csv' }));
                const a = document.createElement('a');
                a.href = u;
                a.download = 'thermal-growth-run.csv';
                a.click();
                setTimeout(() => URL.revokeObjectURL(u), 1000);
              }}
            >
              ↓ Run CSV
            </button>
          </div>
          <p className="plotlabel">
            Calculated {quantity === 'lengthMm' ? 'body length' : 'solid mass'} ({unit})
            <span>Constant conditions · marker shows current time</span>
          </p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 12, right: 20, bottom: 25, left: 10 }}>
                <CartesianGrid stroke="#28384c" strokeDasharray="3 3" />
                <XAxis
                  dataKey="minutes"
                  type="number"
                  domain={[0, 180]}
                  tick={{ fill: '#a7b9ce', fontSize: 11 }}
                  label={{ value: 'Simulation time (min)', position: 'bottom', offset: 5 }}
                />
                <YAxis
                  domain={[0, 'auto']}
                  tick={{ fill: '#a7b9ce', fontSize: 11 }}
                  tickFormatter={(v) => Number(v).toPrecision(3)}
                />
                <Tooltip
                  contentStyle={{ background: '#162437', border: '1px solid #496077' }}
                  labelFormatter={(v) => `${Number(v).toFixed(1)} min`}
                  formatter={(v) => [
                    `${Number(v).toPrecision(4)} ${unit}`,
                    quantity === 'lengthMm' ? 'Length' : 'Mass',
                  ]}
                />
                <Line
                  dataKey={quantity}
                  stroke="#82cfbe"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <ReferenceLine x={time / 60} stroke="#e8bf81" strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="explanation">
            <h3>What changed and why?</h3>
            <p>
              At fixed total cooling, hotter melt sends more heat back to the interface, leaving
              less capacity for latent heat removal. The compatible body becomes narrower. Faster
              pulling also requires a smaller area to satisfy the same heat budget. The body is{' '}
              {((m.diameter / baseline.diameter) * 100).toFixed(1)}% of the baseline diameter, and
              length increases at {pull.toFixed(2)} mm/min. These trends depend on the fixed-cooling
              assumption; they are not universal furnace laws.
            </p>
          </div>
          <p className="note">
            After {(time / 60).toFixed(1)} min: {(r.extractedJ / 1e6).toFixed(3)} MJ removed ={' '}
            {(r.latentJ / 1e6).toFixed(3)} MJ latent + {(r.meltHeatJ / 1e6).toFixed(3)} MJ incoming
            heat. Melt remaining: {r.remaining.toFixed(3)} kg. The 5 kg charge is sufficient
            throughout every supported 180-minute run.
          </p>
        </div>
      </div>
      <details className="panel growth-equations">
        <summary>Thermal equations, boundary conditions & sources</summary>
        <div className="formula">
          Qout = Qin + ṁ Lf
          <br />
          Qin = h A (Tb − Tm); ṁ = ρ A vp
          <br />A = Qout / [ρ Lf vp + h (Tb − Tm)]
          <br />D = √(4A/π); ℓ(t) = vp t; m(t) = ρ A ℓ(t)
        </div>
        <p>
          Qout: constant heat-removal power through the solid (600 W); Qin: melt-to-interface heat
          (W); ṁ: mass growth rate (kg/s); Lf: latent heat of fusion (1.8×10⁶ J/kg); h: effective
          melt-side heat-transfer coefficient (500 W/(m²·K)); A: flat interface area (m²); Tb:
          controlled bulk melt temperature (1687–1767 K); Tm: equilibrium interface temperature
          (1687 K); ρ: constant solid density (2330 kg/m³); vp: pull speed, equal to axial
          solidification speed here (0.2–2 mm/min, converted to m/s); D: body diameter (m); ℓ: new
          cylindrical-body length (m); t: simulated time (s); m: new solid mass (kg).
        </p>
        <p>
          <b>Closure and assumptions:</b> This app derives A from an integrated interface energy
          balance with fixed total cooling. Qout, h, 5 kg charge and 300 mm crucible diameter are
          chosen teaching conditions, not fitted material data. Assume an already-established
          cylindrical body, flat interface at Tm, spatially uniform melt temperature, constant
          properties, and active melt-level control so vp equals the growth speed. A heater
          maintains Tb. Qout is heat carried away from the interface, not total furnace or
          cooling-system power; subsequent sensible cooling of the solid is outside this budget. No
          shoulder/neck evolution, thermal inertia, meniscus/free-boundary solver, radiation field,
          convection field, crucible contamination, stress or defects. Seed/support mass is
          excluded. A setting change starts a separate run; it does not simulate a temperature step
          in an existing ingot.
        </p>
        <p>
          <b>Why not change the interface temperature?</b> The phase boundary stays near silicon’s
          melting temperature. The temperature control adjusts bulk-melt superheat and incoming
          heat, not the melting point. The heat budget predicts a compatible steady diameter, not
          its dynamical stability. Scheil k remains independently controlled below: this model
          supplies no k(T, vp) relation.
        </p>
        <p>
          <b>Validity:</b> use only the stated ranges and 0–180 min. Model functions reject
          unsupported inputs, exhausted melt and oversized geometry. Time histories evaluate
          closed-form expressions; no time-step solver or convergence claim is used. Playback speed
          affects only how quickly time is displayed. The run pauses when the tab is hidden.
        </p>
        <p>
          <b>Sources:</b> Neamen 4e §1.7.1, printed pp. 17–19, and course Topic 5 PDF p. 5 support
          the qualitative growth setup.{' '}
          <a
            href="https://www.sciencedirect.com/science/article/pii/S0022024818301192"
            target="_blank"
            rel="noreferrer"
          >
            A first-principle model of 300 mm Czochralski single-crystal Si production (2018)
          </a>{' '}
          distinguishes interface heat balance from hydrodynamic/geometrical radius modeling; our
          lumped closure does not implement or claim that model’s validation.{' '}
          <a href="https://doi.org/10.3390/cryst10020121" target="_blank" rel="noreferrer">
            3D Numerical Analysis of the Asymmetric Three-Phase Line of Floating Zone for Silicon
            Crystal Growth (2020), Table 2
          </a>{' '}
          supplies the adopted constant ρ and Lf; only these properties are used, not its
          floating-zone process model.{' '}
          <a
            href="https://stem-tools.jlab.org/itselemental/ele014"
            target="_blank"
            rel="noreferrer"
          >
            Jefferson Lab — Silicon
          </a>{' '}
          gives Tm = 1687 K (about 1414 °C). Celsius values here use T°C = TK − 273.15.
        </p>
      </details>
    </section>
  );
}
