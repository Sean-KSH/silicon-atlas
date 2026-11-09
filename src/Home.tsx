import React, { useState } from 'react';
import { MODULES, STAGES, moduleById } from './modules';
import { LESSONS, COURSE_PATHS } from './lessons';
import './home.css';

/*
 * Course map. The ten modules sit on the Fermi level of a stylized p–n junction band diagram:
 * the bands step down where the course reaches the junction (module 06). It is a map drawn in
 * the course's own visual language, not a calculated band diagram.
 */
const W = 1000;
const COL = W / MODULES.length;
const x = (i: number) => (i + 0.5) * COL;
const JUNCTION = 5; // index of module 06
const EF = 118;
const STEP = 46;
const bandY = (base: number, px: number) => {
  // Smooth step centred on the junction module, like a depletion region.
  const c = x(JUNCTION) - COL * 0.15;
  const t = 1 / (1 + Math.exp(-(px - c) / 22));
  return base + STEP * t;
};
const bandPath = (base: number) => {
  let d = '';
  for (let px = 0; px <= W; px += 8)
    d += `${px === 0 ? 'M' : 'L'}${px},${bandY(base, px).toFixed(1)} `;
  return d;
};

function CourseMap() {
  const [focus, setFocus] = useState<string | null>(null);
  const shown = moduleById(focus ?? '') ?? null;
  return (
    <figure className="course-map" aria-labelledby="course-map-caption">
      <svg viewBox={`0 0 ${W} 220`} role="group" aria-label="Course map of the ten modules">
        {/* stage bands along the bottom */}
        {STAGES.map((s) => {
          const idx = MODULES.map((m, i) => (m.stage === s.id ? i : -1)).filter((i) => i >= 0);
          const x0 = idx[0] * COL + 6;
          const x1 = (idx[idx.length - 1] + 1) * COL - 6;
          return (
            <g key={s.id} className={`map-stage stage-${s.id}`}>
              <rect x={x0} y={206} width={x1 - x0} height={3} rx={1.5} />
            </g>
          );
        })}
        <path className="map-ec" d={bandPath(40)} />
        <path className="map-ev" d={bandPath(150)} />
        <line className="map-ef" x1={0} x2={W} y1={EF} y2={EF} />
        <text className="map-band-label" x={8} y={34}>
          Ec
        </text>
        <text className="map-band-label" x={8} y={168}>
          Ev
        </text>
        <text className="map-band-label map-ef-label" x={W - 8} y={EF - 8} textAnchor="end">
          EF
        </text>
        {/* a few carriers: electrons in the n-side conduction band, holes in the p-side valence band */}
        {[640, 700, 770, 850, 925].map((cx, i) => (
          <circle
            key={`e${i}`}
            className="map-electron"
            cx={cx}
            cy={bandY(40, cx) - 9 - (i % 2) * 7}
            r={3.2}
          />
        ))}
        {[60, 140, 215, 300, 380].map((cx, i) => (
          <circle
            key={`h${i}`}
            className="map-hole"
            cx={cx}
            cy={bandY(150, cx) + 9 + (i % 2) * 7}
            r={3.4}
          />
        ))}
        {MODULES.map((m, i) => (
          <a
            key={m.id}
            href={`#${m.id}`}
            className={`map-station stage-${m.stage}${focus === m.id ? ' is-focus' : ''}`}
            onMouseEnter={() => setFocus(m.id)}
            onMouseLeave={() => setFocus(null)}
            onFocus={() => setFocus(m.id)}
            onBlur={() => setFocus(null)}
            aria-label={`${m.number} ${m.label}`}
          >
            <circle cx={x(i)} cy={EF} r={17} className="map-hit" />
            <circle cx={x(i)} cy={EF} r={12} className="map-dot" />
            <text x={x(i)} y={EF + 4.5} textAnchor="middle" className="map-num">
              {m.number}
            </text>
          </a>
        ))}
      </svg>
      <ol className="map-labels" aria-hidden="true">
        {MODULES.map((m) => (
          <li key={m.id} className={focus === m.id ? 'is-focus' : undefined}>
            {m.label}
          </li>
        ))}
      </ol>
      <ol className="map-stage-labels" aria-hidden="true">
        {STAGES.map((s) => (
          <li
            key={s.id}
            className={`stage-${s.id}`}
            style={{ flexGrow: MODULES.filter((m) => m.stage === s.id).length }}
          >
            {s.label}
          </li>
        ))}
      </ol>
      <figcaption id="course-map-caption">
        {shown ? (
          <>
            <span className="shell-num">{shown.number}</span> <strong>{shown.label}.</strong>{' '}
            {shown.summary}
          </>
        ) : (
          <>
            The course map is drawn as the band diagram of a p–n junction: the bands step down where
            the course reaches the junction. Select a module to open it.
          </>
        )}
      </figcaption>
    </figure>
  );
}

const HOW = [
  {
    title: 'Read the goals',
    text: 'Each module opens with what you should be able to do afterwards, the textbook reading and the modules it builds on.',
  },
  {
    title: 'Change one thing',
    text: 'Move a single control: doping, temperature, bias, wavelength or a process step. Every linked diagram and plot updates from the same calculation.',
  },
  {
    title: 'Read “What changed and why”',
    text: 'The green panels explain the response in words and say which quantities were held fixed.',
  },
  {
    title: 'Predict, then check',
    text: 'Guided experiments ask you to commit to a prediction before applying the settings and revealing the explanation.',
  },
  {
    title: 'Know the limits',
    text: 'Expandable panels give the equations, assumptions and sources. When a control leaves the range where a model is valid, the module says so instead of drawing a confident wrong answer.',
  },
];

export default function Home() {
  return (
    <main className="home">
      <section className="home-hero">
        <h1>See inside the devices you study.</h1>
        <p className="home-lede">
          Ten connected labs for introductory solid-state and electronic/photonic devices courses.
          Change a doping level, a bias or a process step and watch the charge, fields, bands and
          currents respond, with the equations and assumptions beside every plot.
        </p>
        <div className="home-actions">
          <a className="home-primary" href="#wafer">
            Start with module 01
          </a>
          <a className="home-secondary" href="#paths">
            Choose a course path
          </a>
        </div>
      </section>

      <CourseMap />

      <section id="paths" className="home-section" aria-labelledby="paths-title">
        <h2 id="paths-title">Choose a path</h2>
        <p className="home-section-lede">
          Every module stands on its own, and each lists what it builds on. These two orders match
          the way the material is usually taught.
        </p>
        <div className="home-paths">
          {COURSE_PATHS.map((p) => (
            <article key={p.title} className="home-path">
              <h3>{p.title}</h3>
              <p>{p.audience}</p>
              <ol>
                {p.modules.map((id) => {
                  const m = moduleById(id)!;
                  return (
                    <li key={id}>
                      <a href={`#${id}`}>
                        <span className="shell-num">{m.number}</span>
                        <span>{m.label}</span>
                        <span className="home-path-time">{LESSONS[id].minutes} min</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="how-title">
        <h2 id="how-title">How a lab works</h2>
        <ol className="home-how">
          {HOW.map((h) => (
            <li key={h.title}>
              <h3>{h.title}</h3>
              <p>{h.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section" aria-labelledby="all-title">
        <h2 id="all-title">All modules</h2>
        <div className="home-modules">
          {STAGES.map((s) => (
            <div key={s.id} className={`home-stage stage-${s.id}`}>
              <h3>{s.label}</h3>
              <ul>
                {MODULES.filter((m) => m.stage === s.id).map((m) => {
                  const l = LESSONS[m.id];
                  return (
                    <li key={m.id}>
                      <a href={`#${m.id}`}>
                        <span className="shell-num">{m.number}</span>
                        <span className="home-module-text">
                          <strong>{m.label}</strong>
                          <span>{m.summary}</span>
                        </span>
                        <span className="home-module-meta">
                          <span>{l.reading}</span>
                          <span>About {l.minutes} min</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section home-instructors" aria-labelledby="inst-title">
        <h2 id="inst-title">For instructors</h2>
        <div className="home-inst-grid">
          <div className="home-inst-notes">
            <p>
              The labs run in any current browser with no accounts or installation. Presets restore
              tested settings, so a demonstration looks the same every time, and most plots export
              their data as CSV.
            </p>
            <p>
              Each model is the simplest one that teaches its concept, with its assumptions and
              valid range stated in the module. Automated tests check every model against analytical
              limits, conservation laws and textbook worked examples. None has yet been compared
              with measured data.
            </p>
          </div>
          <div className="home-demos">
            <h3>Ten-minute demonstrations</h3>
            <ul>
              {MODULES.map((m) => (
                <li key={m.id}>
                  <a href={`#${m.id}`}>
                    <span className="shell-num">{m.number}</span> {m.label}
                  </a>
                  <p>{LESSONS[m.id].demo}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <p>
          Silicon Atlas is an independent student project by Sean Kim. It is not an official product
          of, or endorsed by, Princeton University or any course. The principal physics reference is
          D. A. Neamen, <cite>Semiconductor Physics and Devices</cite>, 4th edition; explanations
          and graphics are original.
        </p>
      </footer>
    </main>
  );
}
