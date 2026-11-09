import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MODULES, STAGES, HOME, moduleById } from './modules';
import { LESSONS, type Lesson, type SectionTarget } from './lessons';

const PREF_GOALS = 'atlas.guide.collapsed';

function readPref(key: string) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function writePref(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    /* storage unavailable: preference lasts for this page only */
  }
}

/** Find the element a section shortcut points at inside the module frame. */
function findTarget(root: HTMLElement, t: SectionTarget): HTMLElement | null {
  const starts = (el: Element, text: string) =>
    (el.textContent ?? '').replace(/\s+/g, ' ').trim().startsWith(text);
  if (t.selector) return root.querySelector<HTMLElement>(t.selector);
  if (t.heading)
    return (
      Array.from(root.querySelectorAll<HTMLElement>('h2')).find((h) => starts(h, t.heading!)) ??
      null
    );
  if (t.summary)
    return (
      Array.from(root.querySelectorAll<HTMLElement>('summary')).find((s) =>
        starts(s, t.summary!),
      ) ?? null
    );
  return null;
}

/** Modules menu: every module grouped by course stage. */
function ModulesMenu({ current, onClose }: { current: string; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('[aria-current="page"], a')?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const click = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panel.current &&
        !panel.current.contains(t) &&
        !(t as Element).closest?.('.shell-menu-button')
      )
        onClose();
    };
    window.addEventListener('keydown', key);
    window.addEventListener('mousedown', click);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('mousedown', click);
    };
  }, [onClose]);
  return (
    <div className="shell-menu" ref={panel} id="modules-menu">
      <a
        className="shell-menu-home"
        href="#home"
        onClick={onClose}
        aria-current={current === HOME ? 'page' : undefined}
      >
        Course guide and suggested paths
      </a>
      <div className="shell-menu-grid">
        {STAGES.map((stage) => (
          <section key={stage.id} className={`shell-menu-stage stage-${stage.id}`}>
            <h2>{stage.label}</h2>
            {MODULES.filter((m) => m.stage === stage.id).map((m) => (
              <a
                key={m.id}
                href={`#${m.id}`}
                onClick={onClose}
                aria-current={current === m.id ? 'page' : undefined}
              >
                <span className="shell-num">{m.number}</span>
                <span>
                  <strong>{m.label}</strong>
                  <span className="shell-menu-summary">{m.summary}</span>
                </span>
              </a>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

/** "On this page" shortcuts with scroll tracking. Targets are re-resolved as the module re-renders. */
function SectionBar({
  lesson,
  frame,
}: {
  lesson: Lesson;
  frame: React.RefObject<HTMLElement | null>;
}) {
  const [available, setAvailable] = useState<boolean[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const root = frame.current;
    if (!root) return;
    let raf = 0;
    const resolve = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const found = lesson.sections.map((s) => !!findTarget(root, s));
        setAvailable((prev) => (prev.join() === found.join() ? prev : found));
      });
    };
    resolve();
    const obs = new MutationObserver(resolve);
    obs.observe(root, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [lesson, frame]);

  useEffect(() => {
    const root = frame.current;
    if (!root) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const line = 160;
        let idx = -1;
        lesson.sections.forEach((s, i) => {
          const el = findTarget(root, s);
          if (el && el.getBoundingClientRect().top <= line) idx = i;
        });
        setActive(idx);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [lesson, frame]);

  const go = (s: SectionTarget) => {
    const root = frame.current;
    const el = root && findTarget(root, s);
    if (!el) return;
    if (el.tagName === 'SUMMARY') {
      const d = el.parentElement as HTMLDetailsElement | null;
      if (d && !d.open) d.open = true;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (!el.hasAttribute('tabindex') && el.tagName !== 'SUMMARY') el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  return (
    <nav className="shell-sections" aria-label="On this page">
      <button
        type="button"
        className="shell-sections-top"
        onClick={() => window.scrollTo({ top: 0 })}
        aria-current={active === -1 ? 'location' : undefined}
      >
        Overview
      </button>
      {lesson.sections.map((s, i) =>
        available[i] === false ? null : (
          <button
            key={s.label}
            type="button"
            onClick={() => go(s)}
            aria-current={active === i ? 'location' : undefined}
          >
            {s.label}
          </button>
        ),
      )}
    </nav>
  );
}

/** Top bar shared by the course guide and every module. */
export function AppBar({
  current,
  frame,
}: {
  current: string;
  frame: React.RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const idx = MODULES.findIndex((m) => m.id === current);
  const mod = idx >= 0 ? MODULES[idx] : undefined;
  const prev = idx > 0 ? MODULES[idx - 1] : undefined;
  const next = idx >= 0 && idx < MODULES.length - 1 ? MODULES[idx + 1] : undefined;
  const lesson = mod ? LESSONS[mod.id] : undefined;
  useEffect(() => setOpen(false), [current]);
  return (
    <header className="shell-bar">
      <div className="shell-row">
        <a className="shell-brand" href="#home" aria-label="Silicon Atlas course guide">
          <span className="shell-mark" aria-hidden="true">
            Si
          </span>
          <span className="shell-name">Silicon Atlas</span>
        </a>
        <button
          type="button"
          className="shell-menu-button"
          aria-expanded={open}
          aria-controls="modules-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
          Modules
        </button>
        {mod ? (
          <p className="shell-current">
            <span className="shell-num">{mod.number}</span>
            <span className="shell-current-label">{mod.label}</span>
          </p>
        ) : (
          <p className="shell-current shell-current-home">Course guide</p>
        )}
        {mod && (
          <nav className="shell-step" aria-label="Previous and next module">
            {prev ? (
              <a href={`#${prev.id}`} rel="prev" title={`Previous: ${prev.number} ${prev.label}`}>
                <span aria-hidden="true">‹</span>
                <span className="shell-step-label">
                  {prev.number} {prev.label}
                </span>
                <span className="visually-hidden">Previous module: {prev.label}</span>
              </a>
            ) : (
              <a href="#home" title="Course guide">
                <span aria-hidden="true">‹</span>
                <span className="shell-step-label">Course guide</span>
              </a>
            )}
            {next && (
              <a href={`#${next.id}`} rel="next" title={`Next: ${next.number} ${next.label}`}>
                <span className="shell-step-label">
                  {next.number} {next.label}
                </span>
                <span aria-hidden="true">›</span>
                <span className="visually-hidden">Next module: {next.label}</span>
              </a>
            )}
          </nav>
        )}
      </div>
      {lesson && <SectionBar key={lesson.id} lesson={lesson} frame={frame} />}
      {open && <ModulesMenu current={current} onClose={close} />}
    </header>
  );
}

function ModuleLink({ id }: { id: string }) {
  const m = moduleById(id);
  if (!m) return null;
  return (
    <a href={`#${m.id}`} className="guide-module-link">
      <span className="shell-num">{m.number}</span> {m.label}
    </a>
  );
}

/** Opening panel for a module: what it teaches, what it assumes, what to read. */
export function LessonIntro({ id }: { id: string }) {
  const lesson = LESSONS[id];
  const mod = moduleById(id);
  const [collapsed, setCollapsed] = useState(() => readPref(PREF_GOALS));
  if (!lesson || !mod) return null;
  const toggle = () => {
    setCollapsed((c) => {
      writePref(PREF_GOALS, !c);
      return !c;
    });
  };
  return (
    <section className={`guide-intro stage-${mod.stage}`} aria-labelledby="guide-intro-title">
      <div className="guide-intro-head">
        <h2 id="guide-intro-title">
          <span className="guide-intro-kicker">Module {mod.number} of 10</span>
          {mod.summary}
        </h2>
        <button type="button" className="guide-toggle" aria-expanded={!collapsed} onClick={toggle}>
          {collapsed ? 'Show learning goals' : 'Hide learning goals'}
        </button>
      </div>
      <dl className="guide-facts">
        <div>
          <dt>Time</dt>
          <dd>About {lesson.minutes} min</dd>
        </div>
        <div>
          <dt>Reading</dt>
          <dd>{lesson.reading}</dd>
        </div>
        <div>
          <dt>Builds on</dt>
          <dd>
            {lesson.buildsOn.length ? (
              lesson.buildsOn.map((b) => <ModuleLink key={b} id={b} />)
            ) : (
              <span>No earlier module needed</span>
            )}
          </dd>
        </div>
      </dl>
      {!collapsed && (
        <div className="guide-goals">
          <h3>By the end you should be able to</h3>
          <ul>
            {lesson.goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Closing panel: self-check questions and the way on. */
export function LessonOutro({ id }: { id: string }) {
  const lesson = LESSONS[id];
  const idx = MODULES.findIndex((m) => m.id === id);
  const next = MODULES[idx + 1];
  const prev = MODULES[idx - 1];
  if (!lesson) return null;
  return (
    <section className="guide-outro" aria-labelledby="guide-check-title">
      <div className="guide-check">
        <h2 id="guide-check-title">Check your understanding</h2>
        <p className="guide-note">Answer in your own words first, then open the answer.</p>
        <ol>
          {lesson.check.map((q) => (
            <li key={q.question}>
              <p>{q.question}</p>
              <details>
                <summary>Show answer</summary>
                <p>{q.answer}</p>
              </details>
            </li>
          ))}
        </ol>
      </div>
      <nav className="guide-next" aria-label="Continue">
        {next ? (
          <a href={`#${next.id}`} className="guide-next-card">
            <span className="guide-next-label">Next module</span>
            <strong>
              <span className="shell-num">{next.number}</span> {next.label}
            </strong>
            <span>{next.summary}</span>
          </a>
        ) : (
          <a href="#home" className="guide-next-card">
            <span className="guide-next-label">You have reached the last module</span>
            <strong>Back to the course guide</strong>
            <span>Pick another path or revisit a module.</span>
          </a>
        )}
        {prev && (
          <a href={`#${prev.id}`} className="guide-prev-link">
            Previous: {prev.number} {prev.label}
          </a>
        )}
      </nav>
    </section>
  );
}

/** Scroll to the top when the module changes (hash navigation keeps the old offset otherwise). */
export function useScrollReset(current: string) {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0 });
  }, [current]);
}
