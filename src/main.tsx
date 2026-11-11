import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import { HOME, moduleFromHash, moduleById } from './modules';
import { AppBar, LessonIntro, LessonOutro, useScrollReset } from './Shell';
// Stylesheets are loaded eagerly, in the same order as before code splitting, so a module's
// appearance never depends on which other modules were visited first. shell.css comes last:
// it holds the shared tokens and the frame around every module.
import './theme-colors.css';
import './junction.css';
import './bench.css';
import './photonics.css';
import './mos.css';
import './diode.css';
import './fabrication.css';
import './transport.css';
import './equilibrium.css';
import './atomic.css';
import './growth.css';
import './product.css';
import './style.css';
import './shell.css';

const Home = lazy(() => import('./Home'));
// Each module is a separate chunk, so the first page load only downloads the page in view.
const views: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  wafer: lazy(() => import('./Wafer')),
  atomic: lazy(() => import('./AtomicLab')),
  equilibrium: lazy(() => import('./EquilibriumLab')),
  transport: lazy(() => import('./TransportLab')),
  fabrication: lazy(() => import('./FabricationLab')),
  junction: lazy(() => import('./JunctionLab')),
  diode: lazy(() => import('./DiodeLab')),
  mos: lazy(() => import('./MosLab')),
  photonics: lazy(() => import('./PhotonicsLab')),
  bench: lazy(() => import('./BenchLab')),
};

/** Keeps a module failure (for example an impossible value typed into a link) from blanking the app. */
class ModuleBoundary extends React.Component<
  { id: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="module-error" role="alert">
        <h2>This setup could not be shown</h2>
        <p>
          A setting in the link is outside what this module supports ({this.state.error.message}).
        </p>
        <a
          href={`#${this.props.id}`}
          onClick={() => {
            history.replaceState(null, '', `#${this.props.id}`);
            location.reload();
          }}
        >
          Open the module with its default settings
        </a>
      </div>
    );
  }
}

function App() {
  const [current, setCurrent] = useState(() => moduleFromHash(location.hash));
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => setCurrent(moduleFromHash(location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useScrollReset(current);
  useEffect(() => {
    const m = moduleById(current);
    document.title = m
      ? `${m.number} ${m.label} · Silicon Atlas`
      : 'Silicon Atlas · Semiconductor device labs';
  }, [current]);
  const View = views[current];
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          frame.current?.focus();
        }}
      >
        Skip to content
      </a>
      <AppBar current={current} frame={frame} />
      <div
        id="main"
        ref={frame as React.RefObject<HTMLDivElement>}
        tabIndex={-1}
        className={current === HOME ? 'home-frame' : 'module-frame'}
      >
        <Suspense
          fallback={
            <p className="module-loading" role="status">
              Loading…
            </p>
          }
        >
          {current === HOME ? (
            <Home />
          ) : (
            <>
              <LessonIntro key={`in-${current}`} id={current} />
              <div className="module-body" data-module={current}>
                <ModuleBoundary key={current} id={current}>
                  <View />
                </ModuleBoundary>
              </div>
              <LessonOutro key={`out-${current}`} id={current} />
            </>
          )}
        </Suspense>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
